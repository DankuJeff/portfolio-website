const skillGroups = [
  {
    label: "AI & APIs",
    skills: ["Claude API", "Claude Code", "Multi-agent Systems", "Anthropic SDK", "pgvector", "RAG"],
  },
  {
    label: "Game Dev",
    skills: ["Unreal Engine 5", "C++", "Blueprints", "Behavior Trees", "EQS", "NavMesh", "GAS", "Niagara", "FMOD"],
  },
  {
    label: "Web & Backend",
    skills: ["TypeScript", "Node.js", "Fastify", "React", "Next.js", "PostgreSQL", "Redis", "BullMQ", "Drizzle"],
  },
  {
    label: "DevOps & Tools",
    skills: ["Docker", "GitHub Actions", "Vercel", "Google OAuth2", "WebSockets", "SSE"],
  },
];

const stats = [
  { value: "10+", label: "Years experience" },
  { value: "5", label: "Agent specialists built" },
  { value: "10+", label: "Games shipped" },
];

export default function About() {
  return (
    <section id="about" className="py-28 px-6 border-t border-zinc-800/60">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — bio */}
          <div className="flex flex-col gap-8">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">
                / about
              </span>
              <h2 className="text-3xl font-bold text-zinc-100 mt-3">
                Background
              </h2>
            </div>

            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
              <p>
                10 years across game development — 4 as Lead Producer and Programmer on{" "}
                <span className="text-zinc-300 font-medium">Shadows of Magellan</span>, a UE5
                naval combat roguelike, plus 6 years as Lead Producer on games shipped across
                4–14 person college teams — hands-on across programming, art, audio, engineering,
                and full systems implementation. Built production AI systems throughout: behavior
                trees, EQS-driven NPC agents, procedural world generation.
              </p>
              <p>
                That same systems thinking now goes into AI tooling. The Agentic Concierge is the
                first public result — a multi-agent orchestration system that handles real operations
                autonomously, with human-in-the-loop approval gates and full audit trails.
              </p>
              <p>
                The intersection of technical depth and communication is where I operate best —{" "}
                <span className="text-indigo-400">Developer Advocacy</span>,{" "}
                <span className="text-indigo-400">AI Systems Engineering</span>, and{" "}
                <span className="text-indigo-400">Technical Program Management</span> at companies
                building the AI infrastructure layer.
              </p>
              <p className="text-zinc-500 font-mono text-xs">
                BS Computer Animation &amp; Game Development — CSU Chico, 2021
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4 border-t border-zinc-800/60">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold gradient-text">{stat.value}</span>
                  <span className="text-xs text-zinc-500 font-mono">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — skills */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Tech Stack
              </span>
            </div>

            <div className="space-y-5">
              {skillGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2.5">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 rounded-lg text-xs font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* GitHub CTA */}
            <div className="mt-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-300 font-medium">See all the code</p>
                <p className="text-xs text-zinc-600 mt-0.5">Open source on GitHub</p>
              </div>
              <a
                href="https://github.com/DankuJeff"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                github.com/DankuJeff
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
