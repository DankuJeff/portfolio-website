export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dot grid background */}
      <div className="dot-grid absolute inset-0 opacity-60" />

      {/* Radial gradient fade at edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, transparent 40%, #09090b 100%)",
        }}
      />

      {/* Accent glow behind headline */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-8 blur-3xl"
        style={{ background: "rgba(99, 102, 241, 0.15)" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Role badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {["AI Systems Developer", "Developer Advocate", "Builder"].map((role) => (
            <span
              key={role}
              className="px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase border border-indigo-500/30 text-indigo-400 bg-indigo-500/5"
            >
              {role}
            </span>
          ))}
        </div>

        {/* Name headline */}
        <h1 className="gradient-text text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none mb-6">
          Tyler Munstock
        </h1>

        {/* Differentiator */}
        <p className="text-xl sm:text-2xl text-zinc-400 font-light leading-relaxed max-w-2xl mx-auto mb-4">
          10 years building AI-driven game systems in Unreal Engine 5.
        </p>
        <p className="text-xl sm:text-2xl text-zinc-300 font-light leading-relaxed max-w-2xl mx-auto mb-10">
          Now building{" "}
          <span className="text-indigo-400 font-medium">
            AI applications
          </span>{" "}
          — agents, orchestrators, and developer tools.
        </p>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 text-zinc-600 mb-10">
          <span className="text-xs font-mono tracking-widest uppercase">scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-zinc-600 to-transparent" />
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#projects"
            className="glow-button inline-flex items-center gap-2 px-7 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors"
          >
            View Projects
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </a>
          <a
            href="https://github.com/DankuJeff"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

      </div>
    </section>
  );
}
