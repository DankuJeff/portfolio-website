"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import ProjectDrawer from "@/components/ProjectDrawer";

export default function Projects() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  // Tracks URL changes caused by handleOpen so the effect doesn't double-open
  const openedFromCard = useRef(false);

  useEffect(() => {
    if (openedFromCard.current) {
      openedFromCard.current = false;
      return;
    }
    const match = pathname.match(/^\/projects\/(.+)$/);
    if (match) {
      const slug = match[1];
      const project = projects.find((p) => p.id === slug);
      if (project) {
        setActiveProject(project);
        setOriginRect(null);
      }
    } else {
      // Browser back button or direct navigation to / — close drawer
      setActiveProject(null);
      setOriginRect(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function handleOpen(project: Project, rect: DOMRect) {
    openedFromCard.current = true;
    setOriginRect(rect);
    setActiveProject(project);
    router.push(`/projects/${project.id}`, { scroll: false });
  }

  function handleClose() {
    setActiveProject(null);
    setOriginRect(null);
    router.push("/", { scroll: false });
  }

  return (
    <section id="projects" className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col gap-3 mb-14">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
            / projects
          </span>
          <h2 className="text-3xl font-bold text-zinc-100">
            What I&apos;ve Built
          </h2>
          <p className="text-zinc-500 max-w-xl">
            Each project is a production-grade system, not a tutorial. Click any live
            project for architecture details and technical highlights.
          </p>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleOpen}
            />
          ))}
        </div>
      </div>

      <ProjectDrawer
        project={activeProject}
        originRect={originRect}
        onClose={handleClose}
      />
    </section>
  );
}
