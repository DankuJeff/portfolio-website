"use client";

import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function update() {
      const el = fillRef.current;
      if (!el) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      el.style.transform = `scaleX(${progress})`;
    }

    function onScroll() {
      if (rafRef.current !== undefined) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = undefined;
        update();
      });
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-zinc-900/40 pointer-events-none"
    >
      <div
        ref={fillRef}
        className="h-full origin-left bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
