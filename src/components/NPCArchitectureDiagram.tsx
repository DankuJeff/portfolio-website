"use client";

import { useState, useEffect, useRef } from "react";

// ── constants ────────────────────────────────────────────────────────
const W = 1040, H = 380;
const MONO = "'IBM Plex Mono','Fira Mono',monospace";
const SDUR = 720;

// ── types ────────────────────────────────────────────────────────────
interface NodeDef {
  x: number; y: number; w: number; h: number;
  type: "event" | "ue5" | "api" | "widget";
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

// ── layout ───────────────────────────────────────────────────────────
const N: Record<string, NodeDef> = {
  trigger:   { x: 65,  y: 148, w: 108, h: 50, type: "event",  label: "PLAYER EVENT",         sub: "Jump / Failure" },
  monitor:   { x: 218, y: 148, w: 156, h: 50, type: "ue5",    label: "UPlayerActionMonitor",  sub: "UActorComponent" },
  subsys:    { x: 398, y: 148, w: 164, h: 50, type: "ue5",    label: "UClaudeNPCSubsystem",   sub: "MaxHistory=10 · Tokens=200" },
  character: { x: 583, y: 148, w: 156, h: 50, type: "ue5",    label: "AClaudeNPCCharacter",   sub: "AActor" },
  elvSub:    { x: 768, y: 148, w: 160, h: 50, type: "ue5",    label: "UElevenLabsSubsystem",  sub: "PCM pipeline" },
  sound:     { x: 938, y: 148, w: 150, h: 50, type: "ue5",    label: "USoundWaveProcedural",  sub: "22050Hz · 16-bit mono" },
  claude:    { x: 398, y: 305, w: 140, h: 48, type: "api",    label: "CLAUDE API",            sub: "claude-sonnet-4-6" },
  subtitle:  { x: 583, y: 305, w: 148, h: 48, type: "widget", label: "NPCSubtitleWidget",     sub: "UUserWidget" },
  elvApi:    { x: 768, y: 305, w: 140, h: 48, type: "api",    label: "ELEVENLABS API",        sub: "TTS · PCM stream" },
};
const AO = { x: 938, y: 265 };

const INFO: Record<string, InfoDef> = {
  trigger:   { col: "#4a8090", title: "Player Input Trigger",    desc: "Blueprint delegate fires on consecutive failed jumps. FrustrationLevel escalates with AttemptCount, triggering the NPC guidance pipeline.",                                                          tags: ["Blueprint Delegate", "FrustrationLevel", "AttemptCount", "NotifyJumpFailed()"] },
  monitor:   { col: "#5a8aff", title: "UPlayerActionMonitor",    desc: "Actor component tracking failed jump attempts and computing frustration in real time. Constructs the FNPCContext struct passed downstream to the Claude subsystem.",                                   tags: ["AttemptCount", "FrustrationLevel", "FNPCContext", "UActorComponent"] },
  subsys:    { col: "#5a8aff", title: "UClaudeNPCSubsystem",     desc: "Game instance subsystem owning the HTTP pipeline to Claude. Serialises FNPCContext, maintains a rolling 10-message history, fires async requests, and delegates responses via OnResponseReceived.",   tags: ["SendMessage()", "MaxHistoryMessages=10", "MaxTokens=200", "HTTP POST", "UGameInstanceSubsystem"] },
  character: { col: "#5a8aff", title: "AClaudeNPCCharacter",     desc: "The NPC actor. Receives Claude's response, sets speaking state, triggers subtitle display, and passes the dialogue line to the ElevenLabs subsystem for voice synthesis.",                           tags: ["SetSpeaking()", "SendContextMessage()", "SpeakLine()", "AActor"] },
  elvSub:    { col: "#5a8aff", title: "UElevenLabsSubsystem",    desc: "Sends the NPC line to ElevenLabs, receives raw PCM audio bytes, and streams them into the procedural sound wave for real-time playback.",                                                             tags: ["SpeakText()", "StopCurrentSpeech()", "PCM pipeline", "UGameInstanceSubsystem"] },
  sound:     { col: "#5a8aff", title: "USoundWaveProcedural",    desc: "Procedural audio buffer streaming PCM data from ElevenLabs through Unreal's audio engine at 22050Hz 16-bit mono — the NPC's synthesised voice.",                                                    tags: ["PlayPCMData()", "22050Hz", "16-bit mono", "UAudioComponent"] },
  claude:    { col: "#d97706", title: "Claude API",              desc: "Anthropic's /v1/messages endpoint. Receives the full conversation history and FNPCContext, and generates a contextually-aware NPC dialogue response.",                                                tags: ["claude-sonnet-4-6", "HTTP POST", "/v1/messages", "Anthropic"] },
  subtitle:  { col: "#4a7090", title: "NPCSubtitleWidget",       desc: "UMG widget mirroring the NPC's spoken line as on-screen subtitles, shown in sync with SpeakLine() for accessibility.",                                                                               tags: ["ShowSubtitle()", "HideSubtitle()", "UUserWidget", "UMG"] },
  elvApi:    { col: "#d97706", title: "ElevenLabs API",          desc: "TTS endpoint accepting NPC dialogue text, synthesising speech with a chosen voice model, and streaming raw PCM audio bytes back to the subsystem.",                                                  tags: ["TTS", "PCM audio stream", "Voice synthesis", "REST API"] },
  audioOut:  { col: "#22c55e", title: "Audio Output",            desc: "Final stage — the synthesised NPC voice rendered through Unreal's audio engine and heard by the player.",                                                                                             tags: ["Audio Engine", "UE5", "Playback"] },
};

const _s = N.subsys, _cl = N.claude, _ch = N.character, _sb = N.subtitle, _es = N.elvSub, _ea = N.elvApi;
const STEPS: StepDef[] = [
  { fr: "trigger",   to: "monitor",   col: "#5a8aff", p0: { x: N.trigger.x + N.trigger.w / 2, y: N.trigger.y },     p1: { x: N.monitor.x - N.monitor.w / 2, y: N.monitor.y } },
  { fr: "monitor",   to: "subsys",    col: "#5a8aff", p0: { x: N.monitor.x + N.monitor.w / 2, y: N.monitor.y },     p1: { x: _s.x - _s.w / 2, y: _s.y } },
  { fr: "subsys",    to: "claude",    col: "#5a8aff", p0: { x: _s.x - 15, y: _s.y + _s.h / 2 },                    p1: { x: _cl.x - 15, y: _cl.y - _cl.h / 2 } },
  { fr: "claude",    to: "subsys",    col: "#d97706", p0: { x: _cl.x + 15, y: _cl.y - _cl.h / 2 },                 p1: { x: _s.x + 15, y: _s.y + _s.h / 2 } },
  { fr: "subsys",    to: "character", col: "#5a8aff", p0: { x: _s.x + _s.w / 2, y: _s.y },                         p1: { x: _ch.x - _ch.w / 2, y: _ch.y } },
  { fr: "character", to: "subtitle",  col: "#5a8aff", p0: { x: _ch.x, y: _ch.y + _ch.h / 2 },                      p1: { x: _sb.x, y: _sb.y - _sb.h / 2 } },
  { fr: "character", to: "elvSub",    col: "#5a8aff", p0: { x: _ch.x + _ch.w / 2, y: _ch.y },                      p1: { x: _es.x - _es.w / 2, y: _es.y } },
  { fr: "elvSub",    to: "elvApi",    col: "#5a8aff", p0: { x: _es.x - 15, y: _es.y + _es.h / 2 },                 p1: { x: _ea.x - 15, y: _ea.y - _ea.h / 2 } },
  { fr: "elvApi",    to: "elvSub",    col: "#d97706", p0: { x: _ea.x + 15, y: _ea.y - _ea.h / 2 },                 p1: { x: _es.x + 15, y: _es.y + _es.h / 2 } },
  { fr: "elvSub",    to: "sound",     col: "#5a8aff", p0: { x: _es.x + _es.w / 2, y: _es.y },                      p1: { x: N.sound.x - N.sound.w / 2, y: N.sound.y } },
  { fr: "sound",     to: "audioOut",  col: "#22c55e", p0: { x: N.sound.x, y: N.sound.y + N.sound.h / 2 },          p1: AO },
];

function ease(t: number): number { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

function nStyle(type: NodeDef["type"], hot: boolean): { border: string; bg: string; glow: string | null } {
  if (type === "api")    return { border: hot ? "#e07820" : "#3a1800", bg: hot ? "#120800" : "#060300", glow: hot ? "rgba(224,120,32,.38)" : null };
  if (type === "event")  return { border: hot ? "#4a8090" : "#152428", bg: hot ? "#050e12" : "#020608", glow: hot ? "rgba(74,128,144,.32)" : null };
  if (type === "widget") return { border: hot ? "#4a7090" : "#152030", bg: hot ? "#050b14" : "#020509", glow: hot ? "rgba(74,112,144,.32)" : null };
  return                        { border: hot ? "#5a8aff" : "#102040", bg: hot ? "#060a18" : "#020408", glow: hot ? "rgba(90,138,255,.38)" : null };
}

// ── component ─────────────────────────────────────────────────────────
interface Props {
  maxWidth?: number;
  onExpand?: () => void;
}

export default function NPCArchitectureDiagram({ maxWidth, onExpand }: Props) {
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

    const rr = (
      x: number, y: number, w: number, h: number, r: number,
      { border, bg, glow }: { border: string; bg: string; glow: string | null },
      dash = false
    ) => {
      const l = x - w / 2, t = y - h / 2;
      ctx.beginPath(); ctx.roundRect(l, t, w, h, r);
      if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 18; } else ctx.shadowBlur = 0;
      ctx.fillStyle = bg; ctx.fill(); ctx.shadowBlur = 0;
      if (dash) ctx.setLineDash([5, 4]); else ctx.setLineDash([]);
      ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
    };

    const arr = (x1: number, y1: number, x2: number, y2: number, dash: boolean, col: string) => {
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
    };

    const lbl = (text: string, x: number, y: number, align: CanvasTextAlign = "center") => {
      ctx.font = `7px ${MONO}`; ctx.fillStyle = "#1e3040"; ctx.textAlign = align; ctx.fillText(text, x, y);
    };

    const frame = (ts: number) => {
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

      // edges — main pipeline
      const mf = ["trigger", "monitor", "subsys", "character", "elvSub", "sound"] as const;
      for (let i = 0; i < mf.length - 1; i++) {
        const a = N[mf[i]], b = N[mf[i + 1]];
        arr(a.x + a.w / 2, a.y, b.x - b.w / 2, b.y, false, EC);
      }
      lbl("FNPCContext", (N.trigger.x + N.trigger.w / 2 + N.monitor.x - N.monitor.w / 2) / 2, N.trigger.y - 8);

      // sound → audioOut
      arr(N.sound.x, N.sound.y + N.sound.h / 2, AO.x, AO.y - 20, false, EC);

      // subsys ↔ claude (dual offset vertical)
      const vmid = (_s.y + _s.h / 2 + _cl.y - _cl.h / 2) / 2;
      arr(_s.x - 15, _s.y + _s.h / 2, _cl.x - 15, _cl.y - _cl.h / 2, false, EC);
      lbl("HTTP POST", _s.x - 22, vmid, "right");
      arr(_cl.x + 15, _cl.y - _cl.h / 2, _s.x + 15, _s.y + _s.h / 2, true, EC);
      lbl("response", _s.x + 24, vmid, "left");

      // character → subtitle
      arr(_ch.x, _ch.y + _ch.h / 2, _sb.x, _sb.y - _sb.h / 2, false, EC);

      // elvSub ↔ elvApi (dual offset vertical)
      arr(_es.x - 15, _es.y + _es.h / 2, _ea.x - 15, _ea.y - _ea.h / 2, false, EC);
      lbl("PCM request", _es.x - 22, vmid, "right");
      arr(_ea.x + 15, _ea.y - _ea.h / 2, _es.x + 15, _es.y + _es.h / 2, true, EC);

      // nodes
      for (const [id, n] of Object.entries(N)) {
        const hot = HOT.has(id);
        rr(n.x, n.y, n.w, n.h, 5, nStyle(n.type, hot), id === "trigger");
        ctx.font = `500 8.5px ${MONO}`; ctx.fillStyle = hot ? "#b0c8e0" : "#223444"; ctx.textAlign = "center";
        ctx.fillText(n.label, n.x, n.y - 5);
        ctx.font = `7.5px ${MONO}`; ctx.fillStyle = hot ? "#3a5a78" : "#162030";
        ctx.fillText(n.sub, n.x, n.y + 9);
      }

      // audioOut oval
      const aoHot = HOT.has("audioOut");
      ctx.beginPath(); ctx.ellipse(AO.x, AO.y, 58, 20, 0, 0, Math.PI * 2);
      if (aoHot) { ctx.shadowColor = "rgba(34,197,94,.38)"; ctx.shadowBlur = 18; } else ctx.shadowBlur = 0;
      ctx.fillStyle = aoHot ? "#061408" : "#020805"; ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = aoHot ? "#22c55e" : "#0d2d14"; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = `500 8px ${MONO}`; ctx.fillStyle = aoHot ? "#22c55e" : "#153020";
      ctx.textAlign = "center"; ctx.fillText("AUDIO OUTPUT", AO.x, AO.y + 3);

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
    };

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
    if (Math.abs(mx - AO.x) < 60 && Math.abs(my - AO.y) < 22) {
      st.current.paused = true; st.current.active = "audioOut"; setInspect("audioOut");
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
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".2em", textTransform: "uppercase", color: "#253850" }}>NPC AI TUTORIAL GUIDE</div>
          <div style={{ fontSize: 9, color: "#172030", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 3 }}>
            {inspect ? "⏸  PAUSED · CLICK RESUME TO CONTINUE" : "AUTO-ANIMATING · CLICK ANY NODE TO INSPECT"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 2 }}>
          {([["#5a8aff", "UE5 Class"], ["#e07820", "Ext. API"], ["#22c55e", "Output"]] as [string, string][]).map(([c, l]) => (
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
