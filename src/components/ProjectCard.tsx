import type { Project } from "@/data/projects";

interface ProjectCardProps {
  project: Project;
  onClick: (project: Project, rect: DOMRect) => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const isComingSoon = project.status === "coming-soon";

  return (
    <div
      onClick={(e) => {
        if (!isComingSoon) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          onClick(project, rect);
        }
      }}
      className={`card-hover group relative flex flex-col rounded-xl border bg-zinc-900 overflow-hidden
        ${isComingSoon
          ? "border-zinc-800 opacity-60 cursor-default"
          : "border-zinc-800 cursor-pointer"
        }`}
    >
      {/* Screenshot placeholder */}
      <div className="relative w-full aspect-video bg-zinc-800 overflow-hidden">
        {isComingSoon ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-700 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
            </div>
            <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase">Coming Soon</span>
          </div>
        ) : project.thumbnailUrl ? (
          <>
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Hover arrow */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-indigo-600/80 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Placeholder grid pattern */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            {/* Placeholder label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-mono text-zinc-600 tracking-widest uppercase">Screenshot coming</span>
            </div>
            {/* Hover arrow */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 rounded-full bg-indigo-600/80 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Card content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-zinc-100 leading-snug">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 shrink-0">
            {project.status === "live" && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
            <span className="text-xs font-mono text-zinc-600">{project.year}</span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-zinc-400 leading-relaxed">
          {project.tagline}
        </p>

        {/* Tech stack chips */}
        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
          {project.techStack.slice(0, 6).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 6 && (
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-600 border border-zinc-700/50">
              +{project.techStack.length - 6}
            </span>
          )}
        </div>

        {/* Links row */}
        {!isComingSoon && (
          <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/60">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            )}
            <span className="ml-auto text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors font-mono">
              View details →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
