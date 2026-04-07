export type ProjectStatus = "live" | "coming-soon";

export interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  status: ProjectStatus;
  year: number;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  highlights: string[];
  architecture?: string;
}

export const projects: Project[] = [
  {
    id: "agentic-concierge",
    title: "Agentic Concierge",
    tagline: "Personal AI operations agent — research, draft, decide, act.",
    description:
      "A production-grade multi-agent orchestration system where an Opus-powered Conductor decomposes fuzzy user requests into structured task graphs and routes them to five specialist agents. Built to handle real personal operations: research, financial analysis, decision-making, document processing, and communications — with full human-in-the-loop approval gates.",
    status: "live",
    year: 2026,
    techStack: [
      "TypeScript",
      "Node.js",
      "Fastify",
      "Claude API",
      "PostgreSQL",
      "pgvector",
      "Redis",
      "BullMQ",
      "React",
      "Google OAuth2",
      "Docker",
      "GitHub Actions",
    ],
    githubUrl: "https://github.com/DankuJeff/agentic-concierge",
    highlights: [
      "Orchestrator + Specialists pattern: Conductor (Opus 4.6) decomposes requests into DAG task graphs; 5 specialists (Sonnet 4.6) execute in parallel where possible",
      "Real-time SSE task status streaming — live workflow visibility in the UI as tasks complete",
      "BullMQ job queue with crash recovery: server restart re-enqueues interrupted tasks with deduplication",
      "Google OAuth2 authentication (Arctic), manual cookie sessions, full multi-tenant data isolation",
      "AES-256-GCM encryption at rest for all document content and OAuth tokens",
      "Gmail REST + Google Calendar REST integrations with post-approval send",
      "Stripe billing (test mode) + Plaid financial data (sandbox) integrations",
      "Multi-stage Dockerfile + GitHub Actions CI/CD: build → type-check → test → deploy",
    ],
    architecture:
      "The Conductor uses Claude Opus 4.6 to convert a natural-language request into a DAG of typed tasks. Each task specifies its agent type, input references to prior task outputs, and a risk level (1–3) that determines whether it needs human approval before executing. The DAG executor (BullMQ) respects dependency ordering, handles approval gates, streams status via SSE, and recovers interrupted tasks on restart.",
  },
  {
    id: "claude-npc-guide",
    title: "In-Game Claude NPC Guide",
    tagline: "UE5 game characters powered by the Claude API.",
    description:
      "A Unreal Engine 5 project demonstrating how to integrate the Claude API into a game engine to power dynamic NPC characters — characters that respond to player behavior, remember context, and drive narrative branches in real time. Includes a full YouTube walkthrough of the architecture.",
    status: "coming-soon",
    year: 2026,
    techStack: [
      "Unreal Engine 5",
      "C++",
      "Blueprints",
      "Claude API",
      "TypeScript",
      "WebSockets",
    ],
    highlights: [
      "Claude API integration directly into a UE5 C++ game loop — real-time LLM inference within interactive frame constraints",
      "NPC memory and context management: conversation history, player state, world context passed to each API call",
      "Behavior tree integration — Claude response drives BT task completion, not just dialogue text",
      "Latency optimization: async API calls, streaming responses, fallback dialogue for slow connections",
    ],
  },
  {
    id: "rag-vector-showcase",
    title: "RAG + Vector DB Showcase",
    tagline: "Full RAG pipeline — from document ingestion to answer synthesis.",
    description:
      "A full-stack showcase of semantic search and retrieval-augmented generation using pgvector and the Claude API. Demonstrates document ingestion, embedding, chunking strategy, retrieval ranking, and final answer synthesis — end to end.",
    status: "coming-soon",
    year: 2026,
    techStack: [
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "pgvector",
      "Claude API",
      "React",
      "Next.js",
    ],
    highlights: [
      "Full RAG pipeline: document ingestion → chunking → embedding → pgvector storage → retrieval → synthesis",
      "Hybrid search: semantic similarity + keyword filtering for precision",
      "Chunk strategy comparison — fixed-size vs sentence-boundary vs semantic chunking with quality metrics",
      "Live query playground with source attribution and confidence scoring",
    ],
  },
];
