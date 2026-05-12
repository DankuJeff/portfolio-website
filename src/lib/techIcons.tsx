import type { ComponentType, SVGProps } from "react";
import {
  SiAnthropic,
  SiCplusplus,
  SiDocker,
  SiDrizzle,
  SiElevenlabs,
  SiFastapi,
  SiFastify,
  SiGithubactions,
  SiGoogle,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenai,
  SiPostgresql,
  SiPydantic,
  SiPython,
  SiReact,
  SiRedis,
  SiSqlalchemy,
  SiSqlite,
  SiTailwindcss,
  SiTypescript,
  SiUnrealengine,
  SiVercel,
  SiVite,
} from "react-icons/si";

export type TechIcon = ComponentType<SVGProps<SVGSVGElement>>;

// Each icon is imported individually from react-icons/si so the bundler keeps
// only the icons we reference. Anything not in this map falls back to a text
// chip in TechChip.tsx — that keeps obscure or non-branded items (BullMQ,
// pgvector, NavMesh, Blueprints, etc.) legible without inventing a logo.
export const TECH_ICONS: Record<string, TechIcon> = {
  TypeScript: SiTypescript,
  Python: SiPython,
  "Node.js": SiNodedotjs,
  Fastify: SiFastify,
  FastAPI: SiFastapi,
  "Claude API": SiAnthropic,
  "Anthropic SDK": SiAnthropic,
  PostgreSQL: SiPostgresql,
  Redis: SiRedis,
  React: SiReact,
  "React 18": SiReact,
  "Next.js": SiNextdotjs,
  "Next.js 15": SiNextdotjs,
  "Tailwind CSS": SiTailwindcss,
  Vite: SiVite,
  SQLite: SiSqlite,
  SQLAlchemy: SiSqlalchemy,
  Drizzle: SiDrizzle,
  "Pydantic v2": SiPydantic,
  Docker: SiDocker,
  "GitHub Actions": SiGithubactions,
  Vercel: SiVercel,
  "Google OAuth2": SiGoogle,
  "Unreal Engine 5": SiUnrealengine,
  "Unreal Engine 5.7": SiUnrealengine,
  "C++": SiCplusplus,
  "OpenAI Embeddings": SiOpenai,
  ElevenLabs: SiElevenlabs,
};

// Stable sort that surfaces all iconned techs before any text-fallback chips.
// Same-category items keep their authored order so the data file is still the
// source of truth for sibling ordering.
export function sortByIconAvailability(techs: readonly string[]): string[] {
  return techs
    .map((name, i) => ({ name, hasIcon: name in TECH_ICONS, i }))
    .sort((a, b) => {
      if (a.hasIcon !== b.hasIcon) return a.hasIcon ? -1 : 1;
      return a.i - b.i;
    })
    .map((entry) => entry.name);
}
