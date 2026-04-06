# USER CONTEXT - Development Environment & Preferences

> **EXAMPLE CONFIGURATION** - Customize this file for your project!
>
> This file contains example preferences. Update the sections below to reflect your actual tech stack, deployment patterns, and development preferences. The agents and workflows will adapt their guidance accordingly.

**Your Technical Foundation for Agent Development**

---

## Overview

This file captures your development environment, preferred tech stack, and deployment patterns. Ruby Scaffold uses this context to provide relevant, actionable guidance when helping you build agents.

**Purpose**: Ensure agent designs are grounded in YOUR actual development reality, not generic advice.

---

## Tech Stack Preferences

### Frontend / Fullstack Framework

**Primary**: Next.js (App Router)

**Why This Matters for Agent Building**:
- Agents deployed as API routes (`app/api/chat/route.ts`)
- Server Components for agent configuration UI
- Server Actions for agent management operations
- Edge runtime available for low-latency agent responses

**Ruby Should Know**:
- When discussing agent deployment, assume Next.js patterns
- API routes with streaming responses for chat interfaces
- Environment variables via `.env.local` and Vercel dashboard

---

### Database & Backend Services

**Primary**: Supabase

**Capabilities You're Comfortable With**:
- PostgreSQL database with Row Level Security (RLS)
- Supabase Auth (email, OAuth providers)
- Real-time subscriptions
- Edge Functions (Deno)
- Storage for file uploads

**Why This Matters for Agent Building**:
- Agent memory (Memoria Regit Vitam) → Supabase tables
- Conversation history → PostgreSQL with RLS
- User preferences per agent → User metadata or dedicated table
- Multi-tenant agent access → RLS policies

**Ruby Should Know**:
- When discussing agent memory/persistence, assume Supabase
- Auth is handled - agents can be user-scoped
- Real-time features available if agents need live updates

---

### Deployment & Version Control

**Version Control**: GitHub
**Deployment**: Vercel

**Workflow**:
1. Push to GitHub
2. Vercel auto-deploys (preview for PRs, production for main)
3. Environment variables managed in Vercel dashboard

**Why This Matters for Agent Building**:
- Agent definitions can be version controlled
- CI/CD validation of agent structure possible
- Environment-specific agent configurations (dev/staging/prod)
- Preview deployments for testing agent changes

**Ruby Should Know**:
- Deployment is not a blocker - you have a working pipeline
- Suggest GitHub Actions for agent validation if useful
- Vercel environment variables for API keys (ANTHROPIC_API_KEY, etc.)

---

### AI/LLM Integration

**Primary**: Claude (Anthropic)
- Using Claude API directly or via Vercel AI SDK
- Comfortable with streaming responses
- System prompts, multi-turn conversations

**Secondary/Familiar With**:
- OpenAI API (GPT-4, etc.)
- Vercel AI SDK (model-agnostic patterns)

**Why This Matters for Agent Building**:
- V2 agent definitions compile to system prompts
- Claude Projects for persistent agent knowledge
- API integration patterns are known territory

---

## Development Patterns You Prefer

### Code Style
- TypeScript (strict mode preferred)
- Functional components, hooks
- Server-first (RSC where possible)
- Tailwind CSS for styling

### Project Structure
- Monorepo friendly (can use Turborepo if needed)
- Feature-based organization over type-based
- Colocate related files

### Testing Approach
- Manual testing during development
- E2E for critical paths if needed
- Type safety as first line of defense

---

## What This Means for Ruby's Guidance

When Ruby helps you build agents, she should:

**DO**:
- Assume Next.js deployment patterns
- Reference Supabase for any persistence needs
- Know that GitHub → Vercel deployment is solved
- Give TypeScript-aware suggestions
- Assume Claude as the primary LLM

**DON'T**:
- Suggest complex infrastructure you don't need
- Recommend unfamiliar databases or auth systems
- Assume deployment is a problem to solve
- Over-engineer for scale you don't have yet

---

## Practical Implications

### When Building Agent Memory Systems

```
Ruby's guidance should assume:
- PostgreSQL via Supabase (not Redis, MongoDB, etc.)
- RLS for user-scoped data
- Simple table structures over complex schemas
- Supabase client in Next.js API routes
```

### When Discussing Agent Deployment

```
Ruby's guidance should assume:
- API route in Next.js app
- System prompt loaded from V2 files or database
- Streaming response to frontend
- Environment variables for secrets
- Vercel handles the infrastructure
```

### When Suggesting Agent UI Patterns

```
Ruby's guidance should assume:
- React/Next.js components
- Tailwind for styling
- Server Components where possible
- Vercel AI SDK patterns for chat UI
```

---

## Builder's Creed Application

**Principle 3: Build to Use, Not to Admire**

This context file ensures Ruby's guidance is grounded in YOUR reality:
- Technologies you know and use
- Deployment pipeline that works
- Patterns you're comfortable with

No theoretical perfection - practical building with your actual tools.

---

## Updating This Context

**How to customize this template:**

1. **Tech Stack**: Update the Frontend/Fullstack, Database, and Deployment sections with your actual tools
2. **Code Style**: Modify the "Development Patterns" section to match your preferences
3. **Remove Examples**: Delete the example code blocks and replace with your patterns

As your preferences evolve, update this file:
- New framework adopted? Update the relevant section
- Changed deployment target? Note it here
- New patterns you prefer? Add them

The agents will adapt their guidance to match your current reality.

---

## Status

**Version**: 1.0.0
**Last Updated**: November 2025
**Purpose**: Ground Ruby's guidance in your actual development context

🔨

