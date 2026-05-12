"use client";

import { useEffect, useState } from "react";

type NavItem = { id: string; label: string };

const ITEMS: NavItem[] = [
  { id: "hero", label: "Intro" },
  { id: "signals", label: "Signals" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function SideNav() {
  const [activeId, setActiveId] = useState<string>("hero");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sections = ITEMS
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry whose center is nearest the middle of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const aMid = a.boundingClientRect.top + a.boundingClientRect.height / 2;
            const bMid = b.boundingClientRect.top + b.boundingClientRect.height / 2;
            const center = window.innerHeight / 2;
            return Math.abs(aMid - center) - Math.abs(bMid - center);
          });

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }

  return (
    <nav
      aria-label="Section navigation"
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 flex-col items-start gap-1"
    >
      {ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className="group flex items-center gap-3 py-2"
          >
            <span
              className={`block h-px transition-all duration-300 ${
                isActive
                  ? "w-12 bg-indigo-400"
                  : "w-6 bg-zinc-700 group-hover:w-10 group-hover:bg-zinc-500"
              }`}
              aria-hidden
            />
            <span
              className={`text-[10px] font-mono tracking-widest uppercase transition-colors ${
                isActive
                  ? "text-indigo-300"
                  : "text-zinc-600 group-hover:text-zinc-400"
              }`}
            >
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
