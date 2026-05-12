import { TECH_ICONS } from "@/lib/techIcons";

type Size = "sm" | "md";

interface TechChipProps {
  name: string;
  size?: Size;
}

export default function TechChip({ name, size = "sm" }: TechChipProps) {
  const Icon = TECH_ICONS[name];

  const box =
    size === "md"
      ? "w-9 h-9 rounded-lg"
      : "w-7 h-7 rounded-md";
  const iconSize = size === "md" ? "w-5 h-5" : "w-4 h-4";
  const textPad =
    size === "md"
      ? "h-9 px-3 rounded-lg text-xs"
      : "h-7 px-2 rounded-md text-[10px]";

  if (Icon) {
    return (
      <span
        title={name}
        aria-label={name}
        className={`${box} group inline-flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-800 transition-colors`}
      >
        <Icon className={`${iconSize} text-zinc-400 group-hover:text-indigo-300 transition-colors`} />
      </span>
    );
  }

  return (
    <span
      className={`${textPad} inline-flex items-center font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-colors`}
    >
      {name}
    </span>
  );
}
