"use client";

import { useState } from "react";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import ProjectDrawer from "@/components/ProjectDrawer";

export default function Projects() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  function handleOpen(project: Project, rect: DOMRect) {
    setOriginRect(rect);
    setActiveProject(project);
  }

  function handleClose() {
    setActiveProject(null);
    setOriginRect(null);
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
