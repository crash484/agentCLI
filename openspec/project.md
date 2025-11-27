# Project Context

## Purpose
An educational course teaching developers how to build AI agents from scratch. Students build a customer support agent for a fictional SaaS product, learning the fundamentals without relying on frameworks. The course emphasizes understanding over abstraction—students should know exactly how their agent works.

## The Agent
A customer support agent for a SaaS product. Handles user lookups, subscription management, ticket creation, refunds, and knowledge base searches.

**Core Tools:**
- `lookupUser(email)` - Find a customer by email
- `getSubscription(userId)` - Get subscription details
- `listTickets(userId)` - View ticket history
- `createTicket(userId, subject, description)` - Log a support issue
- `updateSubscription(userId, plan)` - Change subscription (HITL required)
- `issueRefund(userId, amount, reason)` - Process refund (HITL required)
- `searchKnowledgeBase(query)` - Search help articles
- `escalateToHuman(reason)` - Hand off to human support

## Tech Stack
- **Language:** TypeScript (strict mode)
- **Runtime:** Cloudflare Workers
- **Infrastructure:** Cloudflare Agents SDK + Durable Objects
- **AI Provider:** Vercel AI SDK (`ai` + `@ai-sdk/openai`) for streaming and model switching
- **Schema Validation:** Zod
- **Frontend:** Custom dark-themed chat UI in `src/client/` (built from scratch, not covered in course)
- **Communication:** WebSocket (via Agent `onConnect`, `onMessage`, `onClose` handlers)
- **Client-Server Sync:** `useAgent` hook from `agents/react`
- **Package Manager:** npm
- **Local Dev:** `wrangler dev` (same code runs locally and in prod)

## Infrastructure

### Cloudflare Agents SDK
Use the base `Agent` class from `agents` package—NOT `AIChatAgent`. The `AIChatAgent` class abstracts too much, which defeats the educational goal.

```typescript
import { Agent, type Connection, type ConnectionContext } from "agents";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export class SupportAgent extends Agent<Env, AgentState> {
  // Students build:
  // - onConnect: sync state on connection
  // - onMessage: handle chat messages, run agent loop
  // - Agent loop: call streamText, handle tools, stream responses via connection.send()
  // - State management: this.state, this.setState()
}
```

### Why Cloudflare Agent Class?
- **State persistence:** `this.state` / `this.setState()` automatically persists to Durable Objects
- **WebSocket handling:** Built-in `onConnect`, `onMessage`, `onClose`
- **SQL storage:** `this.sql` for structured data (users, tickets, etc.)
- **Routing:** `routeAgentRequest` handles agent addressing and WebSocket upgrades
- **React integration:** `useAgent` hook syncs state with frontend via WebSocket

### What Students Build vs. What Cloudflare Provides
| Students Build | Cloudflare Provides |
|----------------|---------------------|
| Tool definitions (Zod) | WebSocket connections |
| Agent loop (while loop) | State persistence |
| AI SDK streamText calls | Global routing |
| Streaming via connection.send() | Identity/addressing |
| HITL approval flow | SQL storage |

### Local Development
Run `wrangler dev` to start local server. Durable Objects work locally with full WebSocket support. No code changes between local and production.

### Deployment
Run `wrangler deploy` to push to Cloudflare's edge network. Students need a Cloudflare account (free tier + $5/mo for Durable Objects).

## Project Conventions

### Code Style
- ESM modules (`import`/`export`)
- `async`/`await` over raw promises
- Descriptive variable names, avoid abbreviations
- Keep functions small and focused
- Prefer explicit types over inference for function signatures

### Architecture Patterns
- Base `Agent` class from Cloudflare SDK (not `AIChatAgent`)
- Vercel AI SDK for LLM calls (`streamText`, `@ai-sdk/openai`)
- Tool definitions separate from execution logic
- Agent loop as a simple while loop, not abstracted
- Conversation state via `this.state` (Durable Objects)
- WebSocket communication with JSON message protocol
- Configuration via environment variables (`.dev.vars` locally, secrets in prod)

### File Structure
```
src/
  server/
    index.ts        # Worker entry point, routes to agent
    agent.ts        # Agent class extending Cloudflare Agent
    tools/          # Tool definitions and implementations
    db/             # Mock database seed data
    prompts/        # System prompts and templates
  client/           # Custom React chat UI (dark theme, not covered in course)
    App.tsx         # Root component with useAgent hook
    components/     # ChatContainer, MessageList, ChatMessage, ChatInput
    styles.css      # Dark theme CSS variables + Tailwind
    types.ts        # Client-side message types
  evals/            # Evaluation test cases
wrangler.toml       # Cloudflare configuration
```

### Testing Strategy
- Minimal test setup—evals are the primary quality gate
- Eval cases defined as input/expected-output pairs
- Manual testing via chat UI during development
- `wrangler dev` for local iteration

### Git Workflow
- Lessons organized by branch: `lesson-01`, `lesson-02`, etc.
- Each lesson branch contains the solution for the previous lesson
- `lesson-N+1` = starting point for lesson N + solution for lesson N
- Teacher stays on main branch during live coding
- Students checkout lesson branches if they fall behind

## Domain Context
- **Agent:** An autonomous system that uses an LLM to reason, plan, and take actions via tools
- **Tool:** A function the agent can invoke to interact with external systems (DB, APIs)
- **Agent Loop:** The cycle of prompt → LLM response → tool execution → repeat until done
- **HITL:** Human-in-the-loop—requiring human approval for high-stakes actions
- **Evals:** Test cases that verify agent behavior against expected outcomes
- **Guardrails:** Input/output validation to prevent bad behavior
- **Durable Object:** Cloudflare's persistent, globally-addressable compute primitive

## Important Constraints
- Code must be educational and readable over optimized
- No agent frameworks (LangChain, CrewAI)—build core logic from scratch
- Use base `Agent` class, not `AIChatAgent`
- Vercel AI SDK for LLM calls (streamText) but implement tool execution manually
- Examples should be self-contained and runnable
- Each lesson builds on the previous—no skipping ahead
- HITL required for any action involving money or account changes

## External Dependencies
- `agents` - Cloudflare Agents SDK (base `Agent` class, `useAgent` hook)
- `ai` - Vercel AI SDK core (streamText, CoreMessage types)
- `@ai-sdk/openai` - OpenAI provider for Vercel AI SDK
- `zod` - Schema validation and tool definitions
- `lucide-react` - Icon library for UI components
