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
  videoUrl?: string;
  thumbnailUrl?: string;
  architectureDiagramUrl?: string;
  architectureVideoUrl?: string;
  highlights: string[];
  architecture?: string;
  learnings?: string[];
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
    videoUrl: "/videos/agentic-concierge-demo-video.mp4",
    thumbnailUrl: "/images/agentic-concierge-thumbnail.png",
    architectureDiagramUrl: "/images/agentic-concierge-architecture-diagram.png",
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
    learnings: [
      "The in-process BullMQ worker is not a shortcut — it's the correct architecture when SSE and the job queue must share an EventEmitter. Extracting the worker to a separate process breaks SSE event delivery without Redis pub/sub as the bridge. Phase 4 can make that trade; Phase 1–3 should not.",
      "App-level AES-256-GCM beats pgcrypto SQL functions for Drizzle projects. pgcrypto requires bytea columns and raw SQL that breaks the ORM abstraction. Encrypting at the Node layer keeps columns as text, works transparently with Drizzle, and the enc:v1: prefix enables zero-downtime migration of existing plaintext rows.",
      "BullMQ concurrency is a rate-limit knob in disguise. Three parallel research tasks, each making 10–12 Claude API calls, saturates a 30K token/min org limit in under a minute. Dialing concurrency to 2 is a two-line fix that buys stability while the proper BullMQ rate limiter is plumbed in later.",
      "Stateless frontend clarification is underrated. Accumulating Q&A rounds on the client and resending the enriched message on each retry avoids backend session complexity entirely. A three-round cap with a [FORCE DECOMPOSE] escape hatch is all the state management the prototype needs.",
      "The Orchestrator + Specialists pattern is about context, not just parallelism. Each specialist agent runs with a clean, narrow context window focused on one task type. The Conductor's context stays clean because it only sees task summaries, not the full research or document content. This is what makes the system stable as workflow complexity scales.",
    ],
  },
  {
    id: "claude-npc-guide",
    title: "Claude-Powered NPC Tutorial Guide",
    tagline: "A UE5 tutorial NPC that watches what you do, builds context, and coaches you in real time — no scripted dialogue.",
    description:
      "Most tutorial NPCs say the same lines every run regardless of what the player actually did. This project replaces that pattern with a live Claude API agent. On each failure, UPlayerActionMonitor classifies the cause, assembles a structured context snapshot with attempt count and frustration level, and sends it to Claude. The response is voiced through ElevenLabs and displayed via an in-game subtitle widget. AXIOM, the NPC, reacts to what happened on that specific attempt — not a timer, not a script.",
    status: "live",
    year: 2026,
    techStack: [
      "Unreal Engine 5.7",
      "C++",
      "Blueprints",
      "Claude API",
      "ElevenLabs",
      "NavMesh",
      "USoundWaveProcedural",
    ],
    githubUrl: "https://github.com/DankuJeff/npc-ai-tutorial-guide",
    videoUrl: "/videos/npc-ai-tutorial-guide-highlight-reel.mp4",
    thumbnailUrl: "/images/npc-ai-tutorial-guide-thumbnail.png",
    architectureDiagramUrl: "/images/npc-ai-tutorial-guide-architecture-diagram.png",
    architectureVideoUrl: "/videos/npc-ai-tutorial-guide-architecture-walkthrough.mp4",
    highlights: [
      "UPlayerActionMonitor classifies each jump failure by cause (too early, no run-up, walked off edge) using launch velocity recorded via MovementModeChangedDelegate",
      "FNPCContext assembles attempt count, failure reason, and frustration level (0–10) into a structured snapshot per API call — tone escalation is injected context, not model-tracked state",
      "Sliding-window conversation history (10 messages) keeps calls cheap while preserving enough context for AXIOM to reference prior attempts",
      "Pending-request pattern: StartDemonstration() and MoveToPosition() check bIsSpeaking on entry, store deferred requests, and execute on OnSpeechFinished — AXIOM never walks mid-sentence",
      "PCM audio streamed from ElevenLabs into USoundWaveProcedural with no disk I/O; completion timed from byte count because OnAudioFinished is unreliable for procedural waves in UE5",
      "Stale-response guard: CurrentRequestId counter discards API responses that arrive out of order — slow failure coaching never interrupts a success line requested after it",
    ],
    architecture:
      "UPlayerActionMonitor (component on the player) records launch velocity at takeoff and classifies failures on landing. On each trigger event it builds FNPCContext — challenge name, attempt count, last failure reason, frustration level — and passes it to UClaudeNPCSubsystem, which POSTs to the Claude API with a sliding-window conversation history and the AXIOM persona prompt. The response routes to AClaudeNPCCharacter, which renders it to the subtitle widget and calls UElevenLabsSubsystem::SpeakText(). PCM audio feeds into USoundWaveProcedural. When the timer fires OnSpeechCompleted, any pending NPC movement executes.",
    learnings: [
      "Frustration escalation belongs in the context, not the model. Injecting FrustrationLevel as a numeric field and mapping it to tone in the system prompt is more reliable and cheaper than having the model track emotional state across a conversation window.",
      "Movement during speech was the hardest UX regression and the simplest fix. The pending-request pattern is about 30 lines of code. The feel difference to the player is substantial.",
      "OnAudioFinished does not fire reliably for USoundWaveProcedural in UE5. Calculating playback duration from PCM byte count and driving completion via a FTimerHandle is the correct approach.",
      "Stale responses need an explicit guard. Without CurrentRequestId, a slow coaching response from attempt 3 can arrive after the success line from attempt 4 has already fired, interrupting the congratulation mid-word.",
      "Scripted waypoint jumps beat NavMesh for demo quality. CalcJumpLaunchVelocity() gives the NPC a predictable, repeatable arc — NavMesh cannot traverse gaps.",
    ],
  },
  {
    id: "rag-vector-showcase",
    title: "AI Research Assistant",
    tagline: "Ask questions about landmark AI papers — grounded, cited answers via RAG.",
    description:
      "A full-stack RAG system built on 11 landmark AI research papers (Anthropic, OpenAI, Google, Meta, Stanford). Users ask natural language questions; the system embeds the query, retrieves the most relevant passages from Pinecone, and routes them to Claude Sonnet with prompt caching for a grounded, cited answer. Every response links citations directly to the source PDF at the exact page number.",
    status: "live",
    year: 2026,
    techStack: [
      "TypeScript",
      "Next.js 16",
      "Claude API",
      "Pinecone",
      "OpenAI Embeddings",
      "Python",
      "PyMuPDF",
      "react-markdown",
    ],
    githubUrl: "https://github.com/DankuJeff/ai-research-assistant",
    videoUrl: "/videos/ai-research-assistant-demo-video.mp4",
    thumbnailUrl: "/images/ai-research-assistant-image-corpus.png",
    architectureDiagramUrl: "/images/ai-research-assistant-ArchitectureDiagram.png",
    highlights: [
      "End-to-end RAG pipeline: 11 PDFs → PyMuPDF parsing → 512/64-token chunking → text-embedding-3-small → 1,220 Pinecone vectors with full citation metadata",
      "Multi-stage loading UX with real phase transitions: Searching (Pinecone retrieval) → Analyzing → Responding (Claude generation) — each tied to actual API calls, not timers",
      "Prompt caching on both system prompt and retrieved context block — reduces Claude API cost on repeated queries within the 5-minute cache window",
      "Retrieval eval: 10/10 recall@5 = 100% across all 11 papers using hand-written question/expected-source pairs",
      "Citation cards link directly to the source PDF at the exact cited page number via arXiv and Anthropic PDF URLs",
      "Idempotent ingestion script — re-runnable safely; wipes and re-upserts on each run with exponential backoff on embed calls",
    ],
    architecture:
      "PyMuPDF parses all 11 PDFs into per-page JSON with section heading detection. The ingest script chunks each paper at 512 tokens with 64-token overlap using cl100k_base (js-tiktoken), strips special tokens (the GPT-4 report embeds <|endofprompt|>), embeds with text-embedding-3-small, and upserts 1,220 vectors to Pinecone with full citation metadata. On query, the Next.js API uses two routes: /api/retrieve embeds the question and fetches top-5 Pinecone matches; /api/generate sends the retrieved chunks and question to Claude Sonnet with prompt caching on both the system prompt and context block. The UI shows real phase state — Searching, Analyzing, Responding — with each citation card linking to the source PDF at the cited page.",
    learnings: [
      "Chunking quality is the single biggest retrieval lever. 512-token chunks with 64-token paragraph-boundary overlap produce clean semantic units — character splitting without boundary awareness degrades recall significantly.",
      "Splitting retrieval and generation into separate API routes enables real UX stage transitions. A single POST gives no client visibility into what's happening; two routes let the UI show phase state tied to actual work.",
      "Prompt caching on the retrieved context block is architecturally correct even when chunks vary per query. System prompt cache hits are the immediate win; context caching pays off when the same question repeats within the TTL window.",
      "Special tokens in PDFs are a real ingestion gotcha. The GPT-4 Technical Report contains <|endofprompt|>, which tiktoken rejects by default. Strip <|...|> patterns before encoding — otherwise ingestion silently fails mid-corpus.",
      "A targeted retrieval eval (one question per paper, expected arxiv_id asserted) is the right quality gate before shipping. It caught a semantic overlap issue between the InstructGPT and DPO papers that required rewording to resolve.",
    ],
  },
];
