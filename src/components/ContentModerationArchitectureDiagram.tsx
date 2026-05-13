"use client";

import { useState, useEffect, useRef } from "react";

const W = 1000, H = 470;
const MONO = "'IBM Plex Mono','Fira Mono',monospace";
const SDUR = 55;
const C_FLOW   = "#5572d8";
const C_API    = "#d8855a";
const C_RESULT = "#5ab870";

const COLS = [
  { x: 70,  label: "01 · INPUT"    },
  { x: 224, label: "02 · INGEST"   },
  { x: 416, label: "03 · CLASSIFY" },
  { x: 609, label: "04 · PARSE"    },
  { x: 798, label: "05 · DECIDE"   },
  { x: 945, label: "06 · OUTPUT"   },
];
const DIVS = [138, 318, 519, 710, 884];

interface NodeDef {
  x: number; y: number; w: number; h: number;
  type: "input" | "flow" | "api" | "result";
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
  USER:     { x: 22,  y: 195, w: 96,  h: 48, type: "input",  label: "USER INPUT",      sub: "text + context"    },
  FASTAPI:  { x: 158, y: 195, w: 132, h: 48, type: "flow",   label: "POST /MODERATE",  sub: "FastAPI · Uvicorn" },
  MOD:      { x: 158, y: 328, w: 132, h: 48, type: "flow",   label: "MODERATOR",       sub: "harm taxonomy"     },
  CLAUDE:   { x: 342, y: 195, w: 148, h: 48, type: "api",    label: "CLAUDE SONNET",   sub: "claude-sonnet-4-6" },
  PYDANTIC: { x: 544, y: 195, w: 130, h: 48, type: "flow",   label: "PYDANTIC",        sub: "JSON validation"   },
  DECISION: { x: 732, y: 195, w: 132, h: 48, type: "flow",   label: "DECISION ENGINE", sub: "confidence > 0.5"  },
  SQLITE:   { x: 544, y: 328, w: 130, h: 48, type: "flow",   label: "SQLITE",          sub: "soft-delete audit" },
  APPEALS:  { x: 732, y: 328, w: 132, h: 48, type: "flow",   label: "APPEALS QUEUE",   sub: "/api/v1/appeals"   },
  RESULT:   { x: 905, y: 195, w: 80,  h: 48, type: "result", label: "CLASSIFIED",      sub: "severity 1–5"      },
};

const INFO: Record<string, InfoDef> = {
  USER:     { col: C_FLOW,   title: "CONTENT SUBMISSION",    desc: "Text with optional context field sent via HTTP POST. Any string input accepted for classification across all six harm categories.",                                                                                                  tags: ["HTTP POST", "text", "context?", "JSON body"] },
  FASTAPI:  { col: C_FLOW,   title: "POST /API/V1/MODERATE", desc: "FastAPI endpoint served by Uvicorn. Validates the request shape, instantiates the Moderator, stores the result, and returns structured JSON classification output.",                                                             tags: ["FastAPI", "Uvicorn", "async", "route handler"] },
  MOD:      { col: C_FLOW,   title: "MODERATOR",             desc: "Assembles a structured system prompt defining all six harm categories with severity definitions. Calls Claude Sonnet with exponential backoff retry — 3 attempts at 1s, 2s, and 4s delays.",                                    tags: ["system prompt", "harm taxonomy", "backoff retry", "HarmCategory enum"] },
  CLAUDE:   { col: C_API,    title: "CLAUDE SONNET",         desc: "Classifies content across hate speech, violence, misinformation, prompt injection, self-harm, and illegal activity simultaneously. Returns per-category confidence scores (0–1), severity (1–5), and a one-sentence summary. No keyword lists — pure language understanding.",  tags: ["claude-sonnet-4-6", "structured JSON", "confidence", "severity", "no pattern matching"] },
  PYDANTIC: { col: C_FLOW,   title: "PYDANTIC VALIDATION",   desc: "Validates Claude's JSON response against a strict schema defined in the system prompt. Catches model formatting drift before it reaches the caller. Schema is defined up-front so mismatches are surfaced at the boundary.",     tags: ["schema validation", "type safety", "formatting guard", "system prompt schema"] },
  DECISION: { col: C_FLOW,   title: "DECISION ENGINE",       desc: "Sets flagged=true if any harm category confidence exceeds 0.5. Assigns primary category and severity. Safe-category prompts are measured for false-positive rate — over-refusal is treated as a system failure, not a safe default.", tags: ["threshold 0.5", "flagged", "false-positive tracking", "severity 1–5"] },
  SQLITE:   { col: C_FLOW,   title: "SQLITE AUDIT TRAIL",    desc: "All classification records stored with soft delete to preserve full history. Appeals stored with reviewer notes and approval status. Full CRUD on the appeals queue: submit, list, approve, reject.",                           tags: ["soft-delete", "audit history", "RunRepository", "appeals CRUD"] },
  APPEALS:  { col: C_API,    title: "APPEALS QUEUE",         desc: "POST /api/v1/appeals escalates flagged content to human review. Reviewers approve or reject with notes. Full audit trail maintained via soft-delete. Reviewer decisions persisted to SQLite.",                                  tags: ["POST /api/v1/appeals", "human review", "approve/reject", "reviewer notes"] },
  RESULT:   { col: C_RESULT, title: "CLASSIFICATION RESULT", desc: "Structured JSON response: all six harm categories with confidence scores, primary category, severity (1–5, minimal to critical), boolean flagged, and one-sentence summary.",                                                   tags: ["categories", "confidence", "severity", "flagged", "summary", "JSON"] },
};

const STEPS: StepDef[] = [
  { fr: "USER",     to: "FASTAPI",  col: C_FLOW,   p0: { x: 118, y: 219 }, p1: { x: 158, y: 219 }, ctrl: null,               dash: false },
  { fr: "FASTAPI",  to: "MOD",      col: C_FLOW,   p0: { x: 224, y: 243 }, p1: { x: 224, y: 328 }, ctrl: null,               dash: true  },
  { fr: "MOD",      to: "CLAUDE",   col: C_API,    p0: { x: 290, y: 352 }, p1: { x: 416, y: 243 }, ctrl: { x: 360, y: 260 }, dash: false },
  { fr: "CLAUDE",   to: "PYDANTIC", col: C_FLOW,   p0: { x: 490, y: 219 }, p1: { x: 544, y: 219 }, ctrl: null,               dash: false },
  { fr: "PYDANTIC", to: "DECISION", col: C_FLOW,   p0: { x: 674, y: 219 }, p1: { x: 732, y: 219 }, ctrl: null,               dash: false },
  { fr: "DECISION", to: "RESULT",   col: C_RESULT, p0: { x: 864, y: 219 }, p1: { x: 905, y: 219 }, ctrl: null,               dash: false },
  { fr: "DECISION", to: "SQLITE",   col: C_FLOW,   p0: { x: 798, y: 243 }, p1: { x: 609, y: 328 }, ctrl: { x: 690, y: 300 }, dash: false },
  { fr: "DECISION", to: "APPEALS",  col: C_API,    p0: { x: 798, y: 243 }, p1: { x: 798, y: 328 }, ctrl: null,               dash: true  },
  { fr: "APPEALS",  to: "SQLITE",   col: C_FLOW,   p0: { x: 732, y: 352 }, p1: { x: 674, y: 352 }, ctrl: null,               dash: false },
];

function ns(type: NodeDef["type"], hot: boolean): { border: string; bg: string; glow: string | null } {
  if (type === "input")  return { border: hot ? "#304a78" : "#182840", bg: "#060810", glow: hot ? "#2a4070" : null };
  if (type === "api")    return { border: hot ? "#785030" : "#362010", bg: "#0c0806", glow: hot ? "#c07040" : null };
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

export default function ContentModerationArchitectureDiagram({ maxWidth, onExpand }: Props) {
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
        lbl(n.label, n.x + n.w / 2, n.y + n.h / 2 - 4,  "center", hot ? "#a0c0e0" : "#3a5870");
        ctx.font = `400 8px ${MONO}`;
        lbl(n.sub,   n.x + n.w / 2, n.y + n.h / 2 + 9,  "center", hot ? "#406080" : "#1e3048");
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
  const legend = [[C_FLOW, "Pipeline"], [C_API, "Claude API"], [C_RESULT, "Output"]] as [string, string][];

  return (
    <div style={{ background: "#06080e", padding: "20px 16px 16px", fontFamily: MONO, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      <div style={{ width: displayW, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#253850" }}>
            CONTENT MODERATION PIPELINE
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
