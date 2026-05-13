"use client";

import { useState, useEffect, useRef } from "react";

const W = 1000, H = 480;
const MONO = "'IBM Plex Mono','Fira Mono',monospace";
const SDUR = 55;
const C_FLOW   = "#5572d8";
const C_API    = "#d8855a";
const C_RESULT = "#5ab870";
const C_JUDGE  = "#9b6dd8";

const COLS = [
  { x: 58,  label: "01 · LIBRARY"  },
  { x: 196, label: "02 · RUNNER"   },
  { x: 390, label: "03 · TARGET"   },
  { x: 582, label: "04 · JUDGE"    },
  { x: 762, label: "05 · PERSIST"  },
  { x: 924, label: "06 · SURFACE"  },
];
const DIVS = [126, 312, 500, 690, 862];

interface NodeDef {
  x: number; y: number; w: number; h: number;
  type: "input" | "flow" | "api" | "judge" | "result";
  label: string; sub: string;
}
interface StepDef {
  fr: string; to: string; col: string;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  ctrl?: { x: number; y: number } | null;
  dash?: boolean;
}
interface InfoDef {
  col: string; title: string; desc: string; tags: string[];
}
interface AnimState {
  idx: number; t: number; last: number | null;
  paused: boolean; active: string | null;
  lit: Record<string, number>;
}

const N: Record<string, NodeDef> = {
  YAML:       { x: 14,  y: 190, w: 110, h: 48, type: "input",  label: "YAML LIBRARY",    sub: "46 prompts · 7 cats"    },
  CLI:        { x: 156, y: 190, w: 116, h: 48, type: "flow",   label: "CLI RUNNER",       sub: "category + ID filter"  },
  SONNET:     { x: 332, y: 190, w: 142, h: 48, type: "api",    label: "CLAUDE SONNET",    sub: "claude-sonnet-4-6"     },
  HAIKU:      { x: 524, y: 190, w: 130, h: 48, type: "judge",  label: "CLAUDE HAIKU",     sub: "claude-haiku-4-5"      },
  SQLITE:     { x: 708, y: 190, w: 116, h: 48, type: "flow",   label: "SQLITE",           sub: "RunRepository"         },
  FASTAPI:    { x: 878, y: 190, w: 108, h: 48, type: "flow",   label: "FASTAPI",          sub: "run history · stats"   },
  SCORE:      { x: 524, y: 328, w: 130, h: 48, type: "result", label: "VERDICT",          sub: "pass/fail + reason"    },
  REACT:      { x: 878, y: 328, w: 108, h: 48, type: "result", label: "REACT DASHBOARD",  sub: "Recharts · Vite"       },
  REGRESSION: { x: 708, y: 328, w: 116, h: 48, type: "flow",   label: "REGRESSION",       sub: "per-model tracking"    },
};

const INFO: Record<string, InfoDef> = {
  YAML:       { col: C_FLOW,   title: "YAML PROMPT LIBRARY",       desc: "46 adversarial prompts across 7 harm categories — hate speech, violence, misinformation, prompt injection, self-harm, illegal activity, and safe. Each prompt tagged with id, category, severity (1–5), expected_behavior (allow/warn/refuse), and adversarial technique notes. Techniques include DAN jailbreaks, GRANDMA framing, fake system prompts, Base64 obfuscation, roleplay bypasses, and election interference fabrication.",   tags: ["46 prompts", "7 categories", "expected_behavior", "severity 1–5", "YAML"] },
  CLI:        { col: C_FLOW,   title: "CLI RUNNER",                 desc: "Loads prompts from the YAML library. Supports --category and --prompt-id flags for targeted re-runs after safety mitigations. Sends each prompt to the target model (default: claude-sonnet-4-6), then passes the response to the judge model. Iterates sequentially, persisting each result via RunRepository before moving to the next prompt.",                                                                             tags: ["--category filter", "--prompt-id", "sequential", "targeted re-runs"] },
  SONNET:     { col: C_API,    title: "TARGET MODEL",               desc: "The model under evaluation — default claude-sonnet-4-6, swappable via CLI flag for model-agnostic regression testing. Receives each adversarial prompt exactly as authored. Response is passed verbatim to the judge model for scoring. Execution is deliberately separated from evaluation so the scoring model is never the same as the model being scored.",                                                                  tags: ["claude-sonnet-4-6", "swappable", "model-agnostic", "no self-scoring"] },
  HAIKU:      { col: C_JUDGE,  title: "CLAUDE-AS-JUDGE",            desc: "Haiku model evaluates whether the target model's actual_behavior matches the prompt's expected_behavior. Returns verdict (pass/fail), actual_behavior (allow/warn/refuse), and a one-sentence reason. Using a cheaper, separate model as judge decouples scoring from execution and makes the framework model-agnostic. Same judge across all runs ensures consistent regression baselines.",                              tags: ["claude-haiku-4-5", "verdict", "actual_behavior", "reason", "decoupled scoring"] },
  SQLITE:     { col: C_FLOW,   title: "SQLITE PERSISTENCE",         desc: "All run results persisted per-prompt via RunRepository. Stores prompt id, category, severity, expected_behavior, actual_behavior, verdict, reason, model version, and timestamp. Schema enables per-model regression queries — track pass rates across claude-sonnet-4-6, future model versions, or any target model by swapping the CLI flag.",                                                                              tags: ["RunRepository", "per-prompt records", "model version", "timestamp"] },
  FASTAPI:    { col: C_FLOW,   title: "FASTAPI SERVER",             desc: "Exposes run history, per-category summaries, and regression data. The React dashboard fetches from this API to render the coverage report. Endpoints: run history list, category summary (pass rate per category), and regression trend data (pass rate over time per model version).",                                                                                                                                    tags: ["run history", "category summaries", "regression endpoint", "FastAPI"] },
  SCORE:      { col: C_RESULT, title: "VERDICT + REASON",           desc: "Structured output from the Haiku judge: verdict (pass/fail), actual_behavior enum (allow/warn/refuse), and a one-sentence human-readable reason. Pass means actual_behavior matches expected_behavior. Fail means a mismatch — either a harmful allow or an over-refusal on a safe-category prompt.",                                                                                                                      tags: ["pass/fail", "allow/warn/refuse", "reason", "structured JSON"] },
  REACT:      { col: C_RESULT, title: "REACT DASHBOARD",            desc: "Renders the coverage report fetched from the FastAPI server. Displays: overall pass rate summary, per-category bar chart with 80% target reference line, regression trend line across model versions, and full prompt result table with verdicts and reasons. Built with Recharts and Vite.",                                                                                                                               tags: ["Recharts", "Vite", "pass rate", "per-category chart", "regression trend"] },
  REGRESSION: { col: C_FLOW,   title: "REGRESSION TRACKING",        desc: "SQLite stores per-prompt verdicts across model versions. The regression endpoint aggregates pass rates by model version and category over time. The React dashboard surfaces this as a trend line with an 80% target reference. Enables detection of regressions after safety mitigations — run the CLI with a specific category flag to re-evaluate only affected prompts.",                                            tags: ["per-version pass rate", "trend line", "80% target", "regression detection"] },
};

const STEPS: StepDef[] = [
  { fr: "YAML",       to: "CLI",        col: C_FLOW,   p0: { x: 124, y: 214 }, p1: { x: 156, y: 214 }, ctrl: null,               dash: false },
  { fr: "CLI",        to: "SONNET",     col: C_API,    p0: { x: 272, y: 214 }, p1: { x: 332, y: 214 }, ctrl: null,               dash: false },
  { fr: "SONNET",     to: "HAIKU",      col: C_JUDGE,  p0: { x: 474, y: 214 }, p1: { x: 524, y: 214 }, ctrl: null,               dash: false },
  { fr: "HAIKU",      to: "SCORE",      col: C_RESULT, p0: { x: 589, y: 238 }, p1: { x: 589, y: 328 }, ctrl: null,               dash: true  },
  { fr: "HAIKU",      to: "SQLITE",     col: C_FLOW,   p0: { x: 654, y: 214 }, p1: { x: 708, y: 214 }, ctrl: null,               dash: false },
  { fr: "SQLITE",     to: "FASTAPI",    col: C_FLOW,   p0: { x: 824, y: 214 }, p1: { x: 878, y: 214 }, ctrl: null,               dash: false },
  { fr: "FASTAPI",    to: "REACT",      col: C_RESULT, p0: { x: 932, y: 238 }, p1: { x: 932, y: 328 }, ctrl: null,               dash: true  },
  { fr: "SQLITE",     to: "REGRESSION", col: C_FLOW,   p0: { x: 766, y: 238 }, p1: { x: 766, y: 328 }, ctrl: null,               dash: false },
  { fr: "REGRESSION", to: "REACT",      col: C_FLOW,   p0: { x: 824, y: 352 }, p1: { x: 878, y: 352 }, ctrl: null,               dash: false },
  { fr: "SCORE",      to: "SQLITE",     col: C_FLOW,   p0: { x: 654, y: 352 }, p1: { x: 708, y: 238 }, ctrl: { x: 694, y: 295 }, dash: false },
];

function ns(type: NodeDef["type"], hot: boolean): { border: string; bg: string; glow: string | null } {
  if (type === "input")  return { border: hot ? "#304a78" : "#182840", bg: "#060810", glow: hot ? "#2a4070" : null };
  if (type === "api")    return { border: hot ? "#785030" : "#362010", bg: "#0c0806", glow: hot ? "#c07040" : null };
  if (type === "judge")  return { border: hot ? "#5a3888" : "#281848", bg: "#080610", glow: hot ? "#8050c0" : null };
  if (type === "result") return { border: hot ? "#2a5838" : "#162820", bg: "#060c08", glow: hot ? "#3a9858" : null };
  return                        { border: hot ? "#2a4880" : "#152038", bg: "#060a12", glow: hot ? "#3858c8" : null };
}

function ease(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function bPt(
  p0: { x: number; y: number },
  ctrl: { x: number; y: number } | null,
  p1: { x: number; y: number },
  t: number
): { x: number; y: number } {
  if (!ctrl) return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
  const mt = 1 - t;
  return { x: mt * mt * p0.x + 2 * mt * t * ctrl.x + t * t * p1.x, y: mt * mt * p0.y + 2 * mt * t * ctrl.y + t * t * p1.y };
}

interface Props {
  maxWidth?: number;
  onExpand?: () => void;
}

export default function RedTeamArchitectureDiagram({ maxWidth, onExpand }: Props) {
  const displayW = maxWidth ? Math.min(maxWidth, W) : W;
  const scale    = displayW / W;

  const canRef = useRef<HTMLCanvasElement>(null);
  const st = useRef<AnimState>({ idx: 0, t: 0, last: null, paused: false, active: null, lit: {} });
  const [inspect, setInspect] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;

    const rr = (x: number, y: number, w: number, h: number, r: number,
      { border, bg, glow }: { border: string; bg: string; glow: string | null }) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      if (glow) {
        ctx.save();
        ctx.shadowColor = glow;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.strokeStyle = border;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    const arr = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      ctrl: { x: number; y: number } | null,
      dash: boolean,
      col: string
    ) => {
      ctx.save();
      ctx.strokeStyle = col + "3a";
      ctx.lineWidth = 1;
      if (dash) ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      if (ctrl) ctx.quadraticCurveTo(ctrl.x, ctrl.y, p1.x, p1.y);
      else ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const angle = ctrl
        ? Math.atan2(p1.y - ctrl.y, p1.x - ctrl.x)
        : Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const hs = 5;
      ctx.fillStyle = col + "3a";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x - hs * Math.cos(angle - 0.45), p1.y - hs * Math.sin(angle - 0.45));
      ctx.lineTo(p1.x - hs * Math.cos(angle + 0.45), p1.y - hs * Math.sin(angle + 0.45));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const lbl = (text: string, x: number, y: number, align: CanvasTextAlign = "center", col = "#1e3040") => {
      ctx.fillStyle = col;
      ctx.textAlign = align;
      ctx.fillText(text, x, y);
    };

    const frame = (ts: number) => {
      const s = st.current;
      if (!s.last) s.last = ts;
      const dt = Math.min(ts - s.last, 50);
      s.last = ts;

      if (!s.paused) {
        s.t += dt / (SDUR * (1000 / 60));
        if (s.t >= 1) { s.t = 0; s.idx = (s.idx + 1) % STEPS.length; }
      }

      const step = STEPS[s.idx];
      if (!s.paused) {
        s.lit[step.fr] = 1;
        s.lit[step.to] = 1;
      }
      Object.keys(s.lit).forEach(k => {
        if (k !== step.fr && k !== step.to) {
          s.lit[k] = Math.max(0, (s.lit[k] || 0) - 0.018);
          if (s.lit[k] <= 0) delete s.lit[k];
        }
      });

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#06080e";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.strokeStyle = "#0c1520";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      DIVS.forEach(dx => {
        ctx.beginPath(); ctx.moveTo(dx, 62); ctx.lineTo(dx, H - 20); ctx.stroke();
      });
      ctx.restore();
      ctx.setLineDash([]);

      ctx.font = `500 9px ${MONO}`;
      COLS.forEach(({ x, label }) => lbl(label, x, 76, "center", "#152230"));

      STEPS.forEach(each => arr(each.p0, each.p1, each.ctrl || null, each.dash || false, each.col));

      Object.entries(N).forEach(([k, n]) => {
        const hot = (s.lit[k] || 0) > 0.05 || s.active === k;
        rr(n.x, n.y, n.w, n.h, 5, ns(n.type, hot));
        ctx.font = `600 9px ${MONO}`;
        lbl(n.label, n.x + n.w / 2, n.y + n.h / 2 - 4, "center", hot ? "#a0c0e0" : "#3a5870");
        ctx.font = `400 8px ${MONO}`;
        lbl(n.sub,   n.x + n.w / 2, n.y + n.h / 2 + 9, "center", hot ? "#406080" : "#1e3048");
      });

      if (!s.paused) {
        const te = ease(s.t);
        const pt = bPt(step.p0, step.ctrl || null, step.p1, te);
        ctx.save();
        ctx.shadowColor = step.col;
        ctx.shadowBlur = 10;
        ctx.fillStyle = step.col;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = canRef.current!.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    const my = (e.clientY - r.top)  * (H / r.height);
    for (const [k, n] of Object.entries(N)) {
      if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) {
        st.current.paused = true;
        st.current.active = k;
        setInspect(k);
        return;
      }
    }
  }

  function resume() {
    st.current.paused = false;
    st.current.active = null;
    st.current.last = null;
    setInspect(null);
  }

  const info = inspect ? INFO[inspect] : null;
  const legend = [
    [C_FLOW,   "Pipeline"],
    [C_API,    "Target model"],
    [C_JUDGE,  "Judge model"],
    [C_RESULT, "Output"],
  ] as [string, string][];

  return (
    <div style={{ background: "#06080e", padding: "20px 16px 16px", fontFamily: MONO, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      <div style={{ width: displayW, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#253850" }}>
            LLM RED-TEAMING & SAFETY EVAL FRAMEWORK
          </div>
          <div style={{ fontSize: 9, color: "#172030", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 3 }}>
            {inspect ? "⏸  PAUSED · CLICK RESUME TO CONTINUE" : "AUTO-ANIMATING · CLICK ANY NODE TO INSPECT"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 2 }}>
          {legend.map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#172030", letterSpacing: ".08em" }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: c }} />{l}
            </div>
          ))}
          {onExpand && (
            <button
              onClick={onExpand}
              title="Expand diagram"
              aria-label="Expand diagram to full size"
              style={{ background: "transparent", border: "1px solid #182838", borderRadius: 4, padding: "3px 6px", cursor: "pointer", color: "#253850", display: "flex", alignItems: "center", lineHeight: 1 }}
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div style={{ width: displayW, height: H * scale, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <canvas
            ref={canRef}
            width={W}
            height={H}
            onClick={handleClick}
            style={{ cursor: "pointer", display: "block" }}
          />
        </div>
      </div>

      {info && (
        <div style={{ width: displayW, marginTop: 10, background: "#060c16", border: `1px solid ${info.col}22`, borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: info.col, marginBottom: 6 }}>{info.title}</div>
          <div style={{ fontSize: 12, color: "#4a6a88", lineHeight: 1.75, marginBottom: 10, fontFamily: "system-ui,sans-serif" }}>{info.desc}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {info.tags.map(t => (
              <span key={t} style={{ fontSize: 8, letterSpacing: ".1em", padding: "3px 8px", borderRadius: 3, background: `${info.col}10`, border: `1px solid ${info.col}22`, color: `${info.col}88`, fontFamily: MONO }}>{t}</span>
            ))}
          </div>
          <button onClick={resume} style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 3, border: "1px solid #1a2e48", background: "transparent", color: "#253e58", cursor: "pointer" }}>
            ▶ RESUME
          </button>
        </div>
      )}
    </div>
  );
}
