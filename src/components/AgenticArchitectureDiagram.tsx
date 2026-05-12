"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── types ──────────────────────────────────────────────────────────
interface Particle {
  x0: number; y0: number; x1: number; y1: number;
  col: string; r: number; t: number; spd: number;
}
interface NodePos { x: number; y: number; }
interface NodeDim { w: number; h: number; }
interface EdgeDef { from: string; to: string; dashed: boolean; }
interface StepDef { delay: number; fire: string[]; pts: [string, string, string, number][]; }
interface LabelDef { label: string; sub: string; }
interface InfoDef  { color: string; title: string; desc: string; tags: string[]; }
interface StageDef { x: number; label: string; }

// ── helpers ────────────────────────────────────────────────────────
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── layout constants ───────────────────────────────────────────────
const W = 840, H = 490;

const POS: Record<string, NodePos> = {
  user:      { x: 50,  y: 245 },
  conductor: { x: 200, y: 245 },
  bullmq:    { x: 380, y: 245 },
  research:  { x: 560, y: 72  },
  document:  { x: 560, y: 158 },
  comms:     { x: 560, y: 245 },
  decision:  { x: 560, y: 332 },
  finance:   { x: 560, y: 416 },
  postgres:  { x: 738, y: 158 },
  redis:     { x: 738, y: 332 },
  api:       { x: 282, y: 84  },
};

const DIMS: Record<string, NodeDim> = {
  user:      { w: 78,  h: 42 },
  conductor: { w: 112, h: 70 },
  bullmq:    { w: 98,  h: 56 },
  research:  { w: 100, h: 56 },
  document:  { w: 100, h: 56 },
  comms:     { w: 100, h: 56 },
  decision:  { w: 100, h: 56 },
  finance:   { w: 100, h: 56 },
  postgres:  { w: 84,  h: 48 },
  redis:     { w: 84,  h: 48 },
  api:       { w: 96,  h: 50 },
};

const EDGES: EdgeDef[] = [
  { from: "user",      to: "conductor", dashed: false },
  { from: "conductor", to: "bullmq",    dashed: false },
  { from: "bullmq",    to: "research",  dashed: false },
  { from: "bullmq",    to: "document",  dashed: false },
  { from: "bullmq",    to: "comms",     dashed: false },
  { from: "bullmq",    to: "decision",  dashed: false },
  { from: "bullmq",    to: "finance",   dashed: false },
  { from: "research",  to: "postgres",  dashed: false },
  { from: "document",  to: "postgres",  dashed: false },
  { from: "comms",     to: "redis",     dashed: false },
  { from: "decision",  to: "postgres",  dashed: false },
  { from: "finance",   to: "redis",     dashed: false },
  { from: "api",       to: "conductor", dashed: true  },
];

const STEPS: StepDef[] = [
  { delay: 300,  fire: ["user"],                                        pts: [["user","conductor","#6366f1",3.5]] },
  { delay: 1050, fire: ["conductor","api"],                             pts: [["api","conductor","#f59e0b",3]] },
  { delay: 1700, fire: [],                                              pts: [["conductor","bullmq","#6366f1",3.5]] },
  { delay: 2350, fire: ["bullmq"],                                      pts: [
    ["bullmq","research","#6366f1",3],
    ["bullmq","document","#6366f1",3],
    ["bullmq","comms",   "#6366f1",3],
    ["bullmq","decision","#6366f1",3],
    ["bullmq","finance", "#6366f1",3],
  ]},
  { delay: 3000, fire: ["research","document","comms","decision","finance"], pts: [
    ["api","research","#f59e0b",2.5],
    ["api","document","#f59e0b",2.5],
    ["api","comms",   "#f59e0b",2.5],
    ["api","decision","#f59e0b",2.5],
    ["api","finance", "#f59e0b",2.5],
  ]},
  { delay: 3650, fire: ["postgres","redis"],                            pts: [
    ["research","postgres","#34d399",3],
    ["document","postgres","#34d399",3],
    ["comms",   "redis",   "#34d399",3],
    ["decision","postgres","#34d399",3],
    ["finance", "redis",   "#34d399",3],
  ]},
  { delay: 4300, fire: [],                                              pts: [["conductor","user","#34d399",3.5]] },
];

const LOOP_MS = 5600;

const LABELS: Record<string, LabelDef> = {
  user:      { label: "USER",       sub: "request"      },
  conductor: { label: "CONDUCTOR",  sub: "opus 4.6"     },
  bullmq:    { label: "BULLMQ",     sub: "task queue"   },
  research:  { label: "RESEARCH",   sub: "sonnet 4.6"   },
  document:  { label: "DOCUMENT",   sub: "sonnet 4.6"   },
  comms:     { label: "COMMS",      sub: "sonnet 4.6"   },
  decision:  { label: "DECISION",   sub: "sonnet 4.6"   },
  finance:   { label: "FINANCE",    sub: "sonnet 4.6"   },
  postgres:  { label: "POSTGRESQL", sub: "+ pgvector"   },
  redis:     { label: "REDIS 7",    sub: "cache + queue"},
  api:       { label: "CLAUDE API", sub: "anthropic"    },
};

const INFO: Record<string, InfoDef> = {
  user:      { color:"#6366f1", title:"User Request",               desc:"A natural language task enters the system. Sent as HTTP POST; response streams back to the client via SSE in real time.",                                                                                                       tags:["HTTP POST","SSE stream","natural language"] },
  conductor: { color:"#6366f1", title:"Conductor Agent · Opus 4.6", desc:"The orchestrator. Opus 4.6 parses the request and builds a DAG — a dependency graph of sub-tasks. It decides which specialists run, in what order, and where human approval gates apply before execution continues.",             tags:["claude-opus-4-6","DAG planning","task decomposition","human-in-the-loop"] },
  bullmq:    { color:"#6366f1", title:"BullMQ Task Queue",           desc:"DAG tasks are enqueued with dependency ordering enforced. Redis backs the queue. Built-in crash recovery and deduplication ensure no task runs twice and none are dropped.",                                                     tags:["Redis-backed","dependency ordering","crash recovery","dedup"] },
  research:  { color:"#6366f1", title:"Research Agent · Sonnet 4.6",desc:"Performs live web research via Playwright and DuckDuckGo. Stores semantic embeddings in pgvector for cross-session retrieval across the document vault.",                                                                        tags:["Playwright","DuckDuckGo","pgvector","claude-sonnet-4-6"] },
  document:  { color:"#6366f1", title:"Document Agent · Sonnet 4.6",desc:"Generates and parses PDF and DOCX files. Documents are stored in the PostgreSQL vault with vector embeddings for semantic search.",                                                                                              tags:["PDF/DOCX","pgvector","document vault","claude-sonnet-4-6"] },
  comms:     { color:"#6366f1", title:"Comms Agent · Sonnet 4.6",   desc:"Drafts and sends emails and letters via the Gmail REST API. Approval-gated — human sign-off required before any message is dispatched.",                                                                                        tags:["Gmail REST API","draft → approve → send","claude-sonnet-4-6"] },
  decision:  { color:"#6366f1", title:"Decision Agent · Sonnet 4.6",desc:"Runs weighted matrix scoring and ranking across options. Used for vendor selection, candidate ranking, or any multi-criteria decision problem.",                                                                                 tags:["weighted matrix","ranking engine","scoring","claude-sonnet-4-6"] },
  finance:   { color:"#6366f1", title:"Finance Agent · Sonnet 4.6", desc:"Pulls balance data via Plaid, runs cost calculations, and generates financial reports. Read-only access by default.",                                                                                                            tags:["Plaid","Stripe balances","cost calculator","claude-sonnet-4-6"] },
  postgres:  { color:"#34d399", title:"PostgreSQL 16 + pgvector",    desc:"Primary persistent store. Holds workflow state, task results, the document vault, and vector embeddings for semantic retrieval across all agents.",                                                                             tags:["pgvector","document vault","workflow state","task results"] },
  redis:     { color:"#34d399", title:"Redis 7",                     desc:"Dual-purpose: backs the BullMQ task queue for job persistence and ordering, and serves as a session cache for fast in-flight agent state.",                                                                                    tags:["BullMQ backend","session cache","in-flight state"] },
  api:       { color:"#f59e0b", title:"Claude API · Anthropic",      desc:"All LLM calls route through the Anthropic API. The Conductor uses Opus 4.6 for high-reasoning orchestration. All five specialists use Sonnet 4.6 for cost-efficient parallel execution.",                                      tags:["claude-opus-4-6","claude-sonnet-4-6","Anthropic","external service"] },
};

const STAGES: StageDef[] = [
  { x: POS.user.x,      label: "01 · INPUT"      },
  { x: POS.conductor.x, label: "02 · ORCHESTRATE" },
  { x: POS.bullmq.x,    label: "03 · QUEUE"      },
  { x: POS.comms.x,     label: "04 · EXECUTE"    },
  { x: POS.postgres.x,  label: "05 · PERSIST"    },
];

// ── component ──────────────────────────────────────────────────────
interface Props {
  maxWidth?: number;
  onExpand?: () => void;
}

export default function AgenticArchitectureDiagram({ maxWidth, onExpand }: Props) {
  const displayW = maxWidth ? Math.min(maxWidth, W) : W;
  const scale    = displayW / W;

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeoutsRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pausedRef    = useRef(false);

  const [active,    setActive]    = useState<string | null>(null);
  const [firingSet, setFiringSet] = useState<Set<string>>(new Set());
  const [isPaused,  setIsPaused]  = useState(false);

  // ─ canvas draw loop ─
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let rafId: number;

    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      particlesRef.current = particlesRef.current.filter(p => p.t < 1);

      for (const p of particlesRef.current) {
        if (!pausedRef.current) p.t = Math.min(1, p.t + p.spd);
        const e = easeInOut(p.t);
        const x = p.x0 + (p.x1 - p.x0) * e;
        const y = p.y0 + (p.y1 - p.y0) * e;

        const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4.5);
        g.addColorStop(0,   p.col + "cc");
        g.addColorStop(0.5, p.col + "44");
        g.addColorStop(1,   p.col + "00");
        ctx.beginPath();
        ctx.arc(x, y, p.r * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.col;
        ctx.fill();
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ─ helpers ─
  const spawnPt = useCallback((from: string, to: string, col: string, r: number) => {
    const p0 = POS[from], p1 = POS[to];
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    particlesRef.current.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, col, r, t: 0, spd: 250 / dist / 60 });
  }, []);

  const flashNodes = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setFiringSet(s => { const n = new Set(s); ids.forEach(id => n.add(id)); return n; });
    setTimeout(() => setFiringSet(s => { const n = new Set(s); ids.forEach(id => n.delete(id)); return n; }), 550);
  }, []);

  const runAnim = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    STEPS.forEach(({ delay, fire, pts }) => {
      const t = setTimeout(() => {
        if (pausedRef.current) return;
        flashNodes(fire);
        pts.forEach(([from, to, col, r]) => spawnPt(from, to, col, r));
      }, delay);
      timeoutsRef.current.push(t);
    });

    timeoutsRef.current.push(
      setTimeout(() => { if (!pausedRef.current) runAnim(); }, LOOP_MS)
    );
  }, [flashNodes, spawnPt]);

  useEffect(() => {
    runAnim();
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [runAnim]);

  // ─ interactions ─
  const handleClick = (id: string) => {
    if (pausedRef.current) {
      // Already paused — switch the info panel without resuming
      setActive(id);
      return;
    }
    // Running — pause and inspect this node
    pausedRef.current = true;
    setIsPaused(true);
    setActive(id);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const resume = () => {
    pausedRef.current = false;
    setIsPaused(false);
    setActive(null);
    runAnim();
  };

  // ─ node styling ─
  const nStyle = (id: string): React.CSSProperties => {
    const on = firingSet.has(id) || active === id;
    if (id === "api")
      return { border: `1px solid ${on ? "#e07820" : "#2a1a00"}`, background: "#0b0500", boxShadow: on ? "0 0 18px rgba(224,120,32,.45)" : "none" };
    if (id === "postgres" || id === "redis")
      return { border: `1px solid ${on ? "#34d399" : "#0d1e2e"}`, background: "#060c14", boxShadow: on ? "0 0 16px rgba(52,211,153,.3)" : "none" };
    if (id === "conductor")
      return { border: `1px solid ${on ? "#6366f1" : "#1c3360"}`, background: "#091222", boxShadow: on ? "0 0 22px rgba(99,102,241,.55)" : "none" };
    return { border: `1px solid ${on ? "#6366f1" : "#162030"}`, background: "#070c16", boxShadow: on ? "0 0 14px rgba(99,102,241,.35)" : "none" };
  };

  const lCol = (id: string) =>
    id === "api" ? "#b06020" : id === "conductor" ? "#5572a8" : id === "postgres" || id === "redis" ? "#244458" : "#344e68";
  const sCol = (id: string) =>
    id === "api" ? "#522200" : "#111e2e";

  const sTop = POS.research.y - DIMS.research.h / 2;
  const sBot = POS.finance.y  + DIMS.finance.h  / 2;
  const sMid = (sTop + sBot) / 2;

  const mono = "'IBM Plex Mono', 'Fira Mono', monospace";

  return (
    <div style={{ background: "#06080e", padding: "20px 16px 16px", fontFamily: mono, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ width: displayW, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#253850", marginBottom: 3 }}>
            AGENTIC CONCIERGE
          </div>
          <div style={{ fontSize: 9, color: "#172030", letterSpacing: ".1em", textTransform: "uppercase" }}>
            {isPaused ? "⏸  PAUSED · CLICK NODE TO SWITCH · RESUME TO CONTINUE" : "AUTO-ANIMATING · CLICK ANY NODE TO INSPECT"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 2 }}>
          {([["#6366f1","Flow"],["#f59e0b","API call"],["#34d399","Result"]] as [string,string][]).map(([c, l]) => (
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

      {/* Diagram — scaled to fit maxWidth */}
      <div style={{ width: displayW, height: H * scale, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", position: "relative" }}>

          {/* Static edges */}
          <svg
            style={{ position: "absolute", inset: 0, width: W, height: H, pointerEvents: "none", zIndex: 1 }}
            viewBox={`0 0 ${W} ${H}`}
          >
            {EDGES.map(({ from, to, dashed }, i) => (
              <line
                key={i}
                x1={POS[from].x} y1={POS[from].y}
                x2={POS[to].x}   y2={POS[to].y}
                stroke="#182838" strokeWidth="1"
                strokeDasharray={dashed ? "3 5" : "5 8"}
                opacity=".55"
              />
            ))}
          </svg>

          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}
          />

          {/* Specialist bracket */}
          <div style={{ position: "absolute", left: POS.research.x - DIMS.research.w / 2 - 20, top: sTop, height: sBot - sTop, width: 1, background: "#142230", zIndex: 2 }} />
          <div style={{
            position: "absolute",
            left: POS.research.x - DIMS.research.w / 2 - 31,
            top: sMid,
            fontSize: 8, letterSpacing: ".18em", textTransform: "uppercase", color: "#142230",
            transform: "translateY(-50%) rotate(-90deg)", whiteSpace: "nowrap", zIndex: 2,
          }}>
            SPECIALISTS
          </div>

          {/* Stage labels */}
          {STAGES.map(({ x, label }) => (
            <div key={label} style={{
              position: "absolute", left: x, top: 10,
              fontSize: 7.5, letterSpacing: ".12em", textTransform: "uppercase", color: "#0f1e2c",
              transform: "translateX(-50%)", whiteSpace: "nowrap", zIndex: 2,
            }}>
              {label}
            </div>
          ))}

          {/* Nodes */}
          {Object.keys(DIMS).map(id => {
            const { w, h } = DIMS[id];
            const { label, sub } = LABELS[id];
            return (
              <div
                key={id}
                onClick={() => handleClick(id)}
                style={{
                  position: "absolute",
                  left: POS[id].x - w / 2,
                  top:  POS[id].y - h / 2,
                  width: w, height: h,
                  borderRadius: 7,
                  cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 3, zIndex: 5,
                  transition: "border-color .2s, box-shadow .2s",
                  userSelect: "none",
                  ...nStyle(id),
                }}
              >
                <span style={{
                  fontSize: id === "conductor" ? 10 : 9,
                  fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase",
                  color: lCol(id), fontFamily: mono,
                  textAlign: "center", lineHeight: 1.2, padding: "0 4px",
                }}>
                  {label}
                </span>
                <span style={{ fontSize: 8, letterSpacing: ".07em", color: sCol(id), fontFamily: mono, textAlign: "center" }}>
                  {sub}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info panel — not scaled, rendered at displayW */}
      {active && INFO[active] && (
        <div style={{
          width: displayW, marginTop: 10,
          background: "#080e1a",
          border: `1px solid ${INFO[active].color}22`,
          borderRadius: 8, padding: "14px 18px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: INFO[active].color, marginBottom: 7, fontFamily: mono }}>
            {INFO[active].title}
          </div>
          <div style={{ fontSize: 13, color: "#4a6a88", lineHeight: 1.75, marginBottom: 10, fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {INFO[active].desc}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {INFO[active].tags.map(t => (
              <span key={t} style={{
                fontSize: 8, letterSpacing: ".1em", padding: "3px 8px", borderRadius: 3,
                background: `${INFO[active].color}0f`,
                border: `1px solid ${INFO[active].color}22`,
                color: `${INFO[active].color}88`,
                fontFamily: mono,
              }}>
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={resume}
            style={{
              fontFamily: mono, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase",
              padding: "5px 12px", borderRadius: 3, border: "1px solid #1a2e48",
              background: "transparent", color: "#253e58", cursor: "pointer",
            }}
          >
            ▶ RESUME
          </button>
        </div>
      )}
    </div>
  );
}
