"use client";

import { useState, useEffect, useRef } from "react";

const W = 1000, H = 440;
const MONO = "'IBM Plex Mono','Fira Mono',monospace";
const SDUR = 680;
const FC = "#6366f1";
const AC = "#f59e0b";
const RC = "#34d399";
const XC = "#4a8090";

interface NodeDef {
  x: number; y: number; w: number; h: number;
  type: "input" | "flow" | "api";
  label: string; sub: string;
}
interface StepDef {
  fr: string; to: string; col: string;
  p0: { x: number; y: number };
  p1: { x: number; y: number };
}
interface InfoDef {
  col: string; title: string; desc: string; tags: string[];
}
interface AnimState {
  idx: number; t: number; last: number | null;
  paused: boolean; active: string | null;
  lit: Record<string, number>;
}

function ease(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

const N: Record<string, NodeDef> = {
  user:      { x: 65,  y: 305, w: 78,  h: 44, type: "input", label: "USER",          sub: "question" },
  chatui:    { x: 195, y: 305, w: 108, h: 56, type: "flow",  label: "CHAT UI",        sub: "Next.js 15" },
  retrieve:  { x: 348, y: 305, w: 130, h: 56, type: "flow",  label: "/API/RETRIEVE",  sub: "embed + vector search" },
  embed:     { x: 510, y: 305, w: 140, h: 48, type: "api",   label: "OPENAI EMBED",   sub: "text-embedding-3-small" },
  pinecone:  { x: 665, y: 305, w: 118, h: 48, type: "api",   label: "PINECONE",       sub: "1,220 vectors · top-5" },
  generate:  { x: 820, y: 305, w: 120, h: 56, type: "flow",  label: "/API/GENERATE",  sub: "claude-sonnet-4-6" },
  claudeapi: { x: 820, y: 393, w: 120, h: 48, type: "api",   label: "CLAUDE API",     sub: "anthropic" },
  papers:    { x: 178, y: 130, w: 110, h: 46, type: "input", label: "PDF CORPUS",     sub: "11 AI/ML papers" },
  parser:    { x: 322, y: 130, w: 126, h: 46, type: "flow",  label: "PARSE_PDFS.PY",  sub: "PyMuPDF" },
  chunker:   { x: 475, y: 130, w: 122, h: 46, type: "flow",  label: "CHUNKER",        sub: "512 tok · 64 overlap" },
};

const AO = { x: 950, y: 305 };

const INFO: Record<string, InfoDef> = {
  user:      { col: XC, title: "User Question",                  desc: "A natural-language question submitted through the chat interface. Triggers the full retrieval and generation pipeline on each request.", tags: ["Chat UI", "HTTP POST", "natural language"] },
  chatui:    { col: FC, title: "Chat UI · Next.js 15",           desc: "React frontend handling user input, orchestrating calls to /api/retrieve and /api/generate in sequence, and rendering the grounded answer with citation cards via react-markdown.", tags: ["Next.js 15", "React", "react-markdown", "Citation Cards"] },
  retrieve:  { col: FC, title: "/api/retrieve",                  desc: "Next.js API route that embeds the user question via OpenAI, runs a top-5 semantic similarity search against the Pinecone index, and returns the highest-relevance chunks with metadata.", tags: ["OpenAI Embeddings", "Pinecone query", "top-5 recall", "semantic search"] },
  embed:     { col: AC, title: "OpenAI Embedding API",           desc: "Converts text to 1536-dimensional dense vectors using text-embedding-3-small. Called in two contexts: offline during ingest to embed all 1,220 paper chunks, and at query time to embed the user question for similarity search.", tags: ["text-embedding-3-small", "1536-dim vectors", "dual-use: ingest + query", "OpenAI"] },
  pinecone:  { col: AC, title: "Pinecone Vector Index",          desc: "Cloud-hosted vector store holding 1,220 embedded chunks from 11 AI/ML papers. Populated offline via upsert during ingest. At query time, returns the top-5 most similar chunks by cosine similarity. Achieved 100% recall@5 across all evaluated queries.", tags: ["1,220 vectors", "top-5 search", "100% recall@5", "upsert · query"] },
  generate:  { col: FC, title: "/api/generate",                  desc: "Next.js API route that assembles a prompt from the user question and the top-5 retrieved chunks, then calls the Claude API with prompt caching enabled. Streams the grounded response back to the Chat UI.", tags: ["claude-sonnet-4-6", "prompt caching", "context assembly", "MaxTokens=1024"] },
  claudeapi: { col: AC, title: "Claude API · Anthropic",         desc: "Generates grounded, cited answers using the retrieved paper chunks as context. Prompt caching reduces cost and latency on repeated prefix patterns across requests.", tags: ["claude-sonnet-4-6", "prompt cached", "/v1/messages", "MaxTokens=1024"] },
  papers:    { col: XC, title: "PDF Corpus · Offline Ingest",   desc: "11 landmark AI/ML research papers in PDF format. Ingest runs offline and only on corpus updates — not on every user query. PyMuPDF extracts full text from each paper before chunking and embedding.", tags: ["11 papers", "PDF", "offline", "one-time ingest", "PyMuPDF"] },
  parser:    { col: FC, title: "parse_pdfs.py · PyMuPDF",       desc: "Python script using PyMuPDF to extract clean full text from each PDF. Output is passed directly to the chunker for splitting into overlapping token windows.", tags: ["PyMuPDF", "text extraction", "Python", "offline pipeline"] },
  chunker:   { col: FC, title: "Chunker · 512 tok / 64 overlap", desc: "Splits extracted paper text into overlapping 512-token chunks with a 64-token overlap window, ensuring no semantic context is lost at boundaries. Produces 1,220 total chunks across all 11 papers.", tags: ["512 tokens", "64 overlap", "1,220 chunks", "offline pipeline"] },
  answer:    { col: RC, title: "Answer + Citation Cards",        desc: "The final output — a grounded Markdown answer paired with citation cards linking each claim back to its source chunk and paper. Every response is fully traceable to a source.", tags: ["Markdown", "Citation Cards", "react-markdown", "grounded response"] },
};

const _u = N.user, _c = N.chatui, _r = N.retrieve, _e = N.embed, _p = N.pinecone, _g = N.generate, _cl = N.claudeapi;
const STEPS: StepDef[] = [
  { fr: "user",      to: "chatui",    col: FC, p0: { x: _u.x + _u.w / 2,   y: _u.y },           p1: { x: _c.x - _c.w / 2,   y: _c.y } },
  { fr: "chatui",    to: "retrieve",  col: FC, p0: { x: _c.x + _c.w / 2,   y: _c.y },           p1: { x: _r.x - _r.w / 2,   y: _r.y } },
  { fr: "retrieve",  to: "embed",     col: FC, p0: { x: _r.x + _r.w / 2,   y: _r.y },           p1: { x: _e.x - _e.w / 2,   y: _e.y } },
  { fr: "embed",     to: "pinecone",  col: AC, p0: { x: _e.x + _e.w / 2,   y: _e.y },           p1: { x: _p.x - _p.w / 2,   y: _p.y } },
  { fr: "pinecone",  to: "generate",  col: FC, p0: { x: _p.x + _p.w / 2,   y: _p.y },           p1: { x: _g.x - _g.w / 2,   y: _g.y } },
  { fr: "generate",  to: "claudeapi", col: FC, p0: { x: _g.x - 15,          y: _g.y + _g.h / 2 }, p1: { x: _cl.x - 15,       y: _cl.y - _cl.h / 2 } },
  { fr: "claudeapi", to: "generate",  col: AC, p0: { x: _cl.x + 15,         y: _cl.y - _cl.h / 2 }, p1: { x: _g.x + 15,      y: _g.y + _g.h / 2 } },
  { fr: "generate",  to: "answer",    col: RC, p0: { x: _g.x + _g.w / 2,   y: _g.y },           p1: { x: AO.x,              y: AO.y } },
];

function ns(type: NodeDef["type"], hot: boolean): { border: string; bg: string; glow: string | null } {
  if (type === "api")   return { border: hot ? "#e07820" : "#3a1800", bg: hot ? "#120800" : "#060300", glow: hot ? "rgba(224,120,32,.4)" : null };
  if (type === "input") return { border: hot ? "#4a8090" : "#152428", bg: hot ? "#050e12" : "#020608", glow: hot ? "rgba(74,128,144,.32)" : null };
  return                       { border: hot ? "#6366f1" : "#161e40", bg: hot ? "#070b1e" : "#040610", glow: hot ? "rgba(99,102,241,.4)" : null };
}

interface Props {
  maxWidth?: number;
  onExpand?: () => void;
}

export default function RAGArchitectureDiagram({ maxWidth, onExpand }: Props) {
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

    function rr(
      x: number, y: number, w: number, h: number, r: number,
      { border, bg, glow }: { border: string; bg: string; glow: string | null },
      dash = false
    ) {
      const l = x - w / 2, t = y - h / 2;
      ctx.beginPath(); ctx.roundRect(l, t, w, h, r);
      if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 18; } else ctx.shadowBlur = 0;
      ctx.fillStyle = bg; ctx.fill(); ctx.shadowBlur = 0;
      ctx.setLineDash(dash ? [5, 4] : []);
      ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    }

    function arr(x1: number, y1: number, x2: number, y2: number, dash: boolean, col: string) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      const ux = dx / len, uy = dy / len;
      ctx.beginPath(); ctx.setLineDash(dash ? [4, 4] : []);
      ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 9, y2 - uy * 9);
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      const a = Math.atan2(dy, dx);
      ctx.beginPath(); ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 9 * Math.cos(a - 0.38), y2 - 9 * Math.sin(a - 0.38));
      ctx.lineTo(x2 - 9 * Math.cos(a + 0.38), y2 - 9 * Math.sin(a + 0.38));
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }

    function lbl(text: string, x: number, y: number, align: CanvasTextAlign = "center", col = "#1e3040") {
      ctx.font = `7px ${MONO}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.fillText(text, x, y);
    }

    function frame(ts: number) {
      const s = st.current;
      if (!s.paused) {
        if (s.last !== null) {
          s.t += (ts - s.last) / SDUR;
          if (s.t >= 1) { s.lit[STEPS[s.idx].to] = ts; s.idx = (s.idx + 1) % STEPS.length; s.t = 0; }
        }
        s.last = ts;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#06080e"; ctx.fillRect(0, 0, W, H);

      const EC = "#182838", now = ts, LD = 1600;
      const HOT = new Set([
        ...(s.active ? [s.active] : []),
        ...Object.entries(s.lit).filter(([, t]) => now - t < LD).map(([id]) => id),
      ]);

      // stage labels
      const stages = [
        { x: N.user.x,     t: "01 · INPUT"     },
        { x: N.chatui.x,   t: "02 · INTERFACE" },
        { x: N.retrieve.x, t: "03 · RETRIEVE"  },
        { x: N.embed.x,    t: "04 · EMBED"     },
        { x: N.pinecone.x, t: "05 · STORE"     },
        { x: N.generate.x, t: "06 · GENERATE"  },
        { x: AO.x,         t: "07 · OUTPUT"    },
      ];
      ctx.font = `7px ${MONO}`; ctx.fillStyle = "#0f1e2c"; ctx.textAlign = "center";
      for (const sg of stages) ctx.fillText(sg.t, sg.x, 24);

      // offline section box
      const il = N.papers.x - N.papers.w / 2 - 14;
      const ir = N.chunker.x + N.chunker.w / 2 + 14;
      const it = N.papers.y - N.papers.h / 2 - 22;
      const ib = N.papers.y + N.papers.h / 2 + 12;
      ctx.beginPath(); ctx.roundRect(il, it, ir - il, ib - it, 5);
      ctx.setLineDash([4, 6]); ctx.strokeStyle = "#152030"; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
      lbl("OFFLINE · ON INGEST", (il + ir) / 2, it - 5, "center", "#152030");

      // edges — query flow
      arr(N.user.x + N.user.w / 2,         N.user.y,       N.chatui.x - N.chatui.w / 2,      N.chatui.y,    false, EC);
      arr(N.chatui.x + N.chatui.w / 2,     N.chatui.y,     N.retrieve.x - N.retrieve.w / 2,  N.retrieve.y,  false, EC);
      arr(N.retrieve.x + N.retrieve.w / 2, N.retrieve.y,   N.embed.x - N.embed.w / 2,        N.embed.y,     false, EC);
      arr(N.embed.x + N.embed.w / 2,       N.embed.y,      N.pinecone.x - N.pinecone.w / 2,  N.pinecone.y,  false, EC);
      arr(N.pinecone.x + N.pinecone.w / 2, N.pinecone.y,   N.generate.x - N.generate.w / 2,  N.generate.y,  false, EC);

      // generate ↔ claudeapi
      const vmid = (N.generate.y + N.generate.h / 2 + N.claudeapi.y - N.claudeapi.h / 2) / 2;
      arr(N.generate.x - 15,  N.generate.y + N.generate.h / 2,    N.claudeapi.x - 15, N.claudeapi.y - N.claudeapi.h / 2, false, EC);
      lbl("HTTP POST", N.generate.x - 22, vmid, "right");
      arr(N.claudeapi.x + 15, N.claudeapi.y - N.claudeapi.h / 2,  N.generate.x + 15,  N.generate.y + N.generate.h / 2,   true,  EC);
      lbl("response",  N.generate.x + 22, vmid, "left");

      // generate → answer
      arr(N.generate.x + N.generate.w / 2, N.generate.y, AO.x - 48, AO.y, false, EC);

      // edges — ingest pipeline
      arr(N.papers.x + N.papers.w / 2,   N.papers.y,  N.parser.x - N.parser.w / 2,   N.parser.y,  false, EC);
      arr(N.parser.x + N.parser.w / 2,   N.parser.y,  N.chunker.x - N.chunker.w / 2, N.chunker.y, false, EC);
      arr(N.chunker.x, N.chunker.y + N.chunker.h / 2, N.embed.x, N.embed.y - N.embed.h / 2, false, EC);
      lbl("embed chunks", N.chunker.x + 16, (N.chunker.y + N.chunker.h / 2 + N.embed.y - N.embed.h / 2) / 2, "left");

      // nodes
      for (const [id, n] of Object.entries(N)) {
        const hot = HOT.has(id);
        const dash = (id === "papers" || id === "user");
        rr(n.x, n.y, n.w, n.h, 5, ns(n.type, hot), dash);
        ctx.font = `500 ${n.w > 120 ? 8 : 8.5}px ${MONO}`;
        ctx.fillStyle = hot ? "#b0c8e0" : "#223444"; ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y - 5);
        ctx.font = `7.5px ${MONO}`;
        ctx.fillStyle = hot ? "#3a5a78" : "#162030";
        ctx.fillText(n.sub, n.x, n.y + 9);
      }

      // answer oval
      const aoHot = HOT.has("answer");
      ctx.beginPath(); ctx.ellipse(AO.x, AO.y, 48, 20, 0, 0, Math.PI * 2);
      if (aoHot) { ctx.shadowColor = "rgba(52,211,153,.38)"; ctx.shadowBlur = 18; } else ctx.shadowBlur = 0;
      ctx.fillStyle = aoHot ? "#041a0e" : "#020805"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = aoHot ? "#34d399" : "#0d2d14"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = `500 7.5px ${MONO}`; ctx.fillStyle = aoHot ? "#34d399" : "#153020";
      ctx.textAlign = "center"; ctx.fillText("ANSWER + CITATIONS", AO.x, AO.y + 3);

      // pulse
      if (!s.paused) {
        const step = STEPS[s.idx], et = ease(Math.min(s.t, 1));
        const px = step.p0.x + (step.p1.x - step.p0.x) * et;
        const py = step.p0.y + (step.p1.y - step.p0.y) * et;
        const c = step.col;
        const g = ctx.createRadialGradient(px, py, 0, px, py, 16);
        g.addColorStop(0, c + "cc"); g.addColorStop(0.45, c + "44"); g.addColorStop(1, c + "00");
        ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = canRef.current!.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    const my = (e.clientY - r.top)  * (H / r.height);
    for (const [id, n] of Object.entries(N)) {
      if (mx >= n.x - n.w / 2 && mx <= n.x + n.w / 2 && my >= n.y - n.h / 2 && my <= n.y + n.h / 2) {
        st.current.paused = true; st.current.active = id; setInspect(id); return;
      }
    }
    if (Math.abs(mx - AO.x) < 50 && Math.abs(my - AO.y) < 22) {
      st.current.paused = true; st.current.active = "answer"; setInspect("answer");
    }
  }

  function resume() {
    st.current.paused = false; st.current.active = null; st.current.last = null; setInspect(null);
  }

  const info = inspect ? INFO[inspect] : null;

  return (
    <div style={{ background: "#06080e", padding: "20px 16px 16px", fontFamily: MONO, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ width: displayW, display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#253850" }}>AI RESEARCH ASSISTANT</div>
          <div style={{ fontSize: 9, color: "#172030", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 3 }}>
            {inspect ? "⏸  PAUSED · CLICK RESUME TO CONTINUE" : "AUTO-ANIMATING · CLICK ANY NODE TO INSPECT"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 2 }}>
          {([["#6366f1", "Flow"], ["#f59e0b", "API Call"], ["#34d399", "Result"]] as [string, string][]).map(([c, l]) => (
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

      {/* Info panel — rendered at displayW, not scaled */}
      {info && (
        <div style={{ width: displayW, marginTop: 10, background: "#060c16", border: `1px solid ${info.col}22`, borderRadius: 6, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".16em", textTransform: "uppercase", color: info.col, marginBottom: 6 }}>{info.title}</div>
          <div style={{ fontSize: 12, color: "#4a6a88", lineHeight: 1.75, marginBottom: 10, fontFamily: "system-ui,sans-serif" }}>{info.desc}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
            {info.tags.map(t => (
              <span key={t} style={{ fontSize: 8, letterSpacing: ".1em", padding: "3px 8px", borderRadius: 3, background: `${info.col}10`, border: `1px solid ${info.col}22`, color: `${info.col}88`, fontFamily: MONO }}>{t}</span>
            ))}
          </div>
          <button
            onClick={resume}
            style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".14em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 3, border: "1px solid #1a2e48", background: "transparent", color: "#253e58", cursor: "pointer" }}
          >
            ▶ RESUME
          </button>
        </div>
      )}
    </div>
  );
}
