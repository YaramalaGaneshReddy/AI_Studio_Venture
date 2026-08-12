# AI Venture Studio

Full-stack MERN application for generating investor-ready startup blueprints with an AI Agent team, Boardroom simulation, vector memory, and Admin Control Panel.

## Features
- **Venture Studio**: Input idea & domain to generate structured blueprints via 11 specialized AI agents.
- **Registration & Auth**: Multi-user registration with persistent JWT sessions and automatic fallback for local/in-memory Mongo.
- **Admin Panel**: Role-based access control (`user` vs `admin`), user management, user promotion/demotion, user deletion, system metrics KPI dashboard, and global venture blueprint analytics.
- **Boardroom Simulation**: Multi-role advisory board simulation (CEO, CTO, CFO, CMO, VC).
- **Analytics & Exports**: Export startup blueprints in PDF, Markdown, and JSON.

## Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Run full-stack dev server (Server on http://localhost:5001, Client on http://localhost:5174)
npm run dev
```

## Ollama Setup (Required for AI Agent Pipeline)

The agent pipeline calls a locally running [Ollama](https://ollama.com/) instance. Follow these steps exactly to get full performance.

### 1. Install Ollama

Download from https://ollama.com/download and install for your OS.

### 2. Pull the required models

```bash
# Primary model — used for synthesis-heavy agents (pitch deck, investor, financial forecast)
ollama pull llama3

# Fast model — used for lightweight extraction agents (market research, competitor analysis, etc.)
# Significantly faster; reduces total pipeline time by ~40-60% for those agents
ollama pull llama3.2:3b
```

> **Alternative fast model:** `ollama pull qwen2.5:3b` — then update `OLLAMA_FAST_MODEL=qwen2.5:3b` in `.env`

### 3. Start Ollama with parallelism enabled

By default, Ollama processes one generation request at a time. Because the DAG pipeline dispatches multiple agents in parallel via `Promise.allSettled()`, you **must** start Ollama with parallel slots enabled:

**macOS / Linux:**
```bash
OLLAMA_NUM_PARALLEL=4 OLLAMA_MAX_LOADED_MODELS=1 ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_NUM_PARALLEL = "4"
$env:OLLAMA_MAX_LOADED_MODELS = "1"
ollama serve
```

**Windows (Command Prompt):**
```cmd
set OLLAMA_NUM_PARALLEL=4
set OLLAMA_MAX_LOADED_MODELS=1
ollama serve
```

> Without these flags, all parallel agent calls queue behind each other and the full pipeline runs ~4–6× slower.

### 4. Verify Ollama is running

```bash
curl http://localhost:11434/api/tags
# Should return a JSON list of installed models
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama3` | Primary model for synthesis agents |
| `OLLAMA_FAST_MODEL` | `llama3.2:3b` | Fast model for extraction agents |
| `OLLAMA_NUM_PARALLEL` | `4` | Max concurrent Ollama generations |
| `OLLAMA_MAX_LOADED_MODELS` | `1` | Max models kept loaded in GPU/RAM |
| `TAVILY_API_KEY` | _(optional)_ | Enables real-time web search signals in market/competitor agents |

## Agent Pipeline Performance Guide

| Agent | Model Used | Approx. Time |
|---|---|---|
| market_research | fast (llama3.2:3b) | ~8–15s |
| competitor_analysis | fast (llama3.2:3b) | ~8–15s |
| opportunity_discovery | fast (llama3.2:3b) | ~6–12s |
| product_strategy | fast (llama3.2:3b) | ~6–12s |
| prd | fast (llama3.2:3b) | ~6–12s |
| technical_architect | primary (llama3) | ~20–40s |
| revenue_model | fast (llama3.2:3b) | ~6–12s |
| financial_forecast | primary (llama3) | ~20–40s |
| gtm | fast (llama3.2:3b) | ~6–12s |
| investor | primary (llama3) | ~20–40s |
| pitch_deck | primary (llama3) | ~25–50s |

> With `OLLAMA_NUM_PARALLEL=4`, the first parallel wave (all agents with no dependencies) runs concurrently — total wall-clock time approaches the slowest single agent, not the sum of all agents.
