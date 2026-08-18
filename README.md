# Methodz AI Core

Persistent multi-provider AI workspace. Built from the manifesto.

## Agents

- **Taru** (`agent:tartus`) — Methodz Tartus catboy surface on the agent dashboard (`/ziddy-secret`).
  - Chat API: `POST /api/agent`
  - Emotion/action contract drives stage (tail, glow, smirk)
  - Brain: `XAI_API_KEY` or `OPENAI_API_KEY` (offline persona if unset)

## Dev

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Canon

Before any work, read `.nexus-canon/` and `AGENTS.md`.

This repo is shared Methodz AI infrastructure. Taru is an agent surface here; it is not a replacement for Nexus World3D or prismatic-convergence.
