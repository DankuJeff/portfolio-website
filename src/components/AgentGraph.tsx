"use client";

import { useEffect, useRef } from "react";

type Specialist = { id: string; label: string; angleDeg: number };

const SPECIALISTS: Specialist[] = [
  { id: "research", label: "RESEARCH", angleDeg: -90 },
  { id: "documents", label: "DOCUMENTS", angleDeg: -18 },
  { id: "financial", label: "FINANCIAL", angleDeg: 54 },
  { id: "decision", label: "DECISION", angleDeg: 126 },
  { id: "comms", label: "COMMS", angleDeg: -162 },
];

const CX = 500;
const CY = 500;
const RING_R = 340;
const CONDUCTOR_R = 68;
const SPECIALIST_R = 58;

function specialistPos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + RING_R * Math.cos(rad),
    y: CY + RING_R * Math.sin(rad),
  };
}

const T_OUT = 1.6;
const T_BACK = 1.6;
const T_TOTAL = T_OUT + T_BACK;

export default function AgentGraph() {
  const tokenRefs = useRef<Array<SVGCircleElement | null>>([]);
  const conductorPulseRef = useRef<SVGCircleElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = (now - start) / 1000;

      SPECIALISTS.forEach((s, i) => {
        const offset = i * 0.5;
        const t = (elapsed + offset) % T_TOTAL;
        const outbound = t < T_OUT;
        const phase = outbound ? t / T_OUT : (t - T_OUT) / T_BACK;
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * phase);

        const pos = specialistPos(s.angleDeg);
        const x = outbound ? CX + (pos.x - CX) * eased : pos.x + (CX - pos.x) * eased;
        const y = outbound ? CY + (pos.y - CY) * eased : pos.y + (CY - pos.y) * eased;

        const token = tokenRefs.current[i];
        if (token) {
          token.setAttribute("cx", String(x));
          token.setAttribute("cy", String(y));
          token.setAttribute("fill", outbound ? "#818cf8" : "#22d3ee");
          token.setAttribute("opacity", String(0.85));
        }
      });

      const pulse = conductorPulseRef.current;
      if (pulse) {
        const beat = (elapsed % 2.4) / 2.4;
        const scale = 1 + beat * 0.6;
        const opacity = (1 - beat) * 0.35;
        pulse.setAttribute("r", String(CONDUCTOR_R * scale));
        pulse.setAttribute("opacity", String(opacity));
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Agent orchestration diagram: a Conductor agent dispatching tasks to five specialist agents."
      style={{ shapeRendering: "geometricPrecision", textRendering: "geometricPrecision" }}
    >
      <defs>
        <radialGradient id="conductor-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(129, 140, 248, 0.55)" />
          <stop offset="60%" stopColor="rgba(99, 102, 241, 0.18)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </radialGradient>
        <radialGradient id="specialist-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(24, 24, 27, 0.95)" />
          <stop offset="100%" stopColor="rgba(9, 9, 11, 0.95)" />
        </radialGradient>
        <filter id="token-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges */}
      <g>
        {SPECIALISTS.map((s) => {
          const pos = specialistPos(s.angleDeg);
          return (
            <line
              key={`edge-${s.id}`}
              x1={CX}
              y1={CY}
              x2={pos.x}
              y2={pos.y}
              stroke="rgba(99, 102, 241, 0.22)"
              strokeWidth={1.5}
              strokeDasharray="2 6"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Tokens (animated) — rendered before nodes so labels stay legible on top */}
      {SPECIALISTS.map((s, i) => (
        <circle
          key={`token-${s.id}`}
          ref={(el) => {
            tokenRefs.current[i] = el;
          }}
          cx={CX}
          cy={CY}
          r={5}
          fill="#818cf8"
          filter="url(#token-glow)"
          opacity={0}
        />
      ))}

      {/* Conductor outer halo (pulses) */}
      <circle
        ref={conductorPulseRef}
        cx={CX}
        cy={CY}
        r={CONDUCTOR_R}
        fill="none"
        stroke="rgba(129, 140, 248, 0.6)"
        strokeWidth={1.5}
        opacity={0}
      />

      {/* Conductor static glow */}
      <circle cx={CX} cy={CY} r={CONDUCTOR_R + 60} fill="url(#conductor-glow)" />

      {/* Conductor node */}
      <circle
        cx={CX}
        cy={CY}
        r={CONDUCTOR_R}
        fill="#09090b"
        stroke="rgba(165, 180, 252, 0.85)"
        strokeWidth={2}
      />
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fontSize={17}
        letterSpacing={2}
        fill="#c7d2fe"
        fontWeight={600}
      >
        CONDUCTOR
      </text>
      <text
        x={CX}
        y={CY + 16}
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fontSize={13}
        letterSpacing={1.5}
        fill="#a1a1aa"
      >
        opus 4.6
      </text>

      {/* Specialists */}
      {SPECIALISTS.map((s) => {
        const pos = specialistPos(s.angleDeg);
        return (
          <g key={s.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={SPECIALIST_R + 14}
              fill="rgba(34, 211, 238, 0.04)"
            />
            <circle
              cx={pos.x}
              cy={pos.y}
              r={SPECIALIST_R}
              fill="url(#specialist-fill)"
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontFamily="var(--font-geist-mono), ui-monospace, monospace"
              fontSize={14}
              letterSpacing={1.5}
              fill="#d4d4d8"
              fontWeight={500}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
