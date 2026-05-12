type Metric = {
  value: string;
  unit?: string;
  label: string;
  sublabel: string;
  source: string;
};

const METRICS: Metric[] = [
  {
    value: "1,220",
    unit: "vectors",
    label: "RAG corpus",
    sublabel: "11 papers · 100% recall@5",
    source: "AI Research Assistant",
  },
  {
    value: "81.2",
    unit: "%",
    label: "Safety pass rate",
    sublabel: "46 adversarial prompts · 7 categories",
    source: "Red-Team Eval Framework",
  },
  {
    value: "6",
    unit: "agents",
    label: "In production",
    sublabel: "1 Opus conductor · 5 Sonnet specialists",
    source: "Agentic Concierge",
  },
  {
    value: "5",
    unit: "systems",
    label: "Shipped",
    sublabel: "All live · all open source",
    source: "github.com/DankuJeff",
  },
];

export default function SystemMetrics() {
  return (
    <section
      id="signals"
      aria-label="System signals"
      className="relative py-16 px-6 border-y border-zinc-800/60 bg-zinc-950/60"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header rail */}
        <div className="flex items-center gap-3 mb-10 text-[10px] font-mono tracking-widest uppercase text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>signals</span>
          <span className="flex-1 h-px bg-gradient-to-r from-zinc-800 to-transparent" />
          <span className="text-zinc-600">by the numbers</span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-800/60 rounded-xl overflow-hidden border border-zinc-800">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="group relative bg-zinc-950 p-6 flex flex-col gap-2 transition-colors hover:bg-zinc-900/60"
            >
              {/* Top-right ambient dot */}
              <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400/60" />

              {/* Value */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tabular-nums text-zinc-100 tracking-tight">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-sm font-mono text-zinc-500 tracking-wider lowercase">
                    {m.unit}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="text-sm font-medium text-indigo-300">{m.label}</div>

              {/* Sublabel */}
              <div className="text-xs text-zinc-500 leading-relaxed">{m.sublabel}</div>

              {/* Source */}
              <div className="mt-3 pt-3 border-t border-zinc-800/60 text-[10px] font-mono tracking-widest uppercase text-zinc-600">
                {m.source}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
