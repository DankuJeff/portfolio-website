"use client";

import { useEffect, useCallback } from "react";
import type { Project } from "@/data/projects";

interface ProjectDrawerProps {
  project: Project | null;
  originRect: DOMRect | null;
  onClose: () => void;
}

function getModalTransform(originRect: DOMRect | null): {
  transformOrigin: string;
  scaleStart: number;
} {
  if (!originRect || typeof window === "undefined") {
    return { transformOrigin: "center center", scaleStart: 0.92 };
  }

  // Modal natural dimensions when centered
  const modalWidth = Math.min(window.innerWidth - 80, 672);
  const modalHeight = window.innerHeight * 0.88;

  // Modal top-left corner when centered on screen
  const modalLeft = (window.innerWidth - modalWidth) / 2;
  const modalTop = (window.innerHeight - modalHeight) / 2;

  // Card center in screen coordinates
  const cardCenterX = originRect.left + originRect.width / 2;
  const cardCenterY = originRect.top + originRect.height / 2;

  // Transform origin relative to the modal element itself
  const originX = cardCenterX - modalLeft;
  const originY = cardCenterY - modalTop;

  // Scale so the modal starts at roughly the card's width
  const scaleStart = Math.min(originRect.width / modalWidth, 0.45);

  return {
    transformOrigin: `${originX}px ${originY}px`,
    scaleStart,
  };
}

export default function ProjectDrawer({
  project,
  originRect,
  onClose,
}: ProjectDrawerProps) {
  const isOpen = project !== null;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  const { transformOrigin, scaleStart } = getModalTransform(originRect);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Centering shell — pointer-events passthrough when closed */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10"
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        {/* Animated panel */}
        <div
          className="relative w-full max-w-2xl max-h-[88vh] bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          style={{
            transformOrigin,
            transform: isOpen ? "scale(1)" : `scale(${scaleStart})`,
            opacity: isOpen ? 1 : 0,
            transition: isOpen
              ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease"
              : "transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.15s ease",
          }}
        >
          {project && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-zinc-800 shrink-0">
                <div className="flex flex-col gap-1.5 pr-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-zinc-100">
                      {project.title}
                    </h2>
                    {project.status === "live" && (
                      <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 font-mono">{project.year}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Screenshot placeholder */}
                <div
                  className="w-full rounded-xl border border-zinc-800 overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-800"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase">
                      Screenshots coming soon
                    </span>
                  </div>
                </div>

                {/* Overview */}
                <div>
                  <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
                    Overview
                  </h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                {/* Architecture */}
                {project.architecture && (
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-4">
                    <h3 className="text-xs font-mono text-indigo-400 uppercase tracking-widest mb-3">
                      Architecture
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {project.architecture}
                    </p>
                  </div>
                )}

                {/* Highlights */}
                <div>
                  <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
                    Technical Highlights
                  </h3>
                  <ul className="space-y-3">
                    {project.highlights.map((highlight, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-zinc-300 leading-relaxed"
                      >
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech stack */}
                <div>
                  <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
                    Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="flex gap-3 pt-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glow-button flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>
                      View on GitHub
                    </a>
                  )}
                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 font-medium text-sm transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
