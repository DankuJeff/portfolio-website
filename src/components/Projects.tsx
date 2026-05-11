"use client";

import { useState, useEffect } from "react";
import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import ProjectDrawer from "@/components/ProjectDrawer";

export default function Projects() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  // Open the correct drawer on initial mount (direct URL navigation or page refresh)
  useEffect(() => {
    const match = window.location.pathname.match(/^\/projects\/(.+)$/);
    if (match) {
      const project = projects.find((p) => p.id === match[1]);
      if (project) {
        setActiveProject(project);
      }
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    function onPopState() {
      const match = window.location.pathname.match(/^\/projects\/(.+)$/);
      if (match) {
        const project = projects.find((p) => p.id === match[1]);
        if (project) {
          setActiveProject(project);
          setOriginRect(null);
        }
      } else {
        setActiveProject(null);
        setOriginRect(null);
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleOpen(project: Project, rect: DOMRect) {
    setOriginRect(rect);
    setActiveProject(project);
    // pushState updates the URL bar without triggering a route change or remount
    window.history.pushState(null, "", `/projects/${project.id}`);
  }

  function handleClose() {
    setActiveProject(null);
    setOriginRect(null);
    window.history.pushState(null, "", "/");
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

        {/* Featured projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {projects.slice(0, 2).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={handleOpen}
              featured
            />
          ))}
        </div>

        {/* Secondary projects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.slice(2).map((project) => (
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
