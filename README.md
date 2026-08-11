# AI Venture Studio

Full-stack MERN application for generating investor-ready startup blueprints with an AI Agent team, Boardroom simulation, vector memory, and Admin Control Panel.

## Features
- **Venture Studio**: Input idea & domain to generate structured blueprints via 6 specialized AI agents.
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
