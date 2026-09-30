# Mission Control for Hermes AI Team

A unified dashboard to understand and manage your Hermes-based AI Team from one simple interface.

## Features

- **Dashboard Overview** - System health, gateway status, key metrics
- **Agents View** - All running processes with PID, CPU, memory, task info
- **Task Board** - Unified kanban across all 3 boards (default, disertasi, work-assistant)
- **Calendar** - Cron jobs timeline + Google Calendar placeholder
- **Activity Feed** - Real-time WebSocket feed of all system events
- **Memory / Knowledge** - Search Obsidian Vault + Literature Corpus + Hermes memory
- **2D Office** - Visual spatial layout with rooms for each profile/agent

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   Frontend      │────▶│    Backend       │
│   (React/Vite)  │     │   (FastAPI)      │
│   Port 3000     │     │   Port 8000      │
└─────────────────┘     └────────┬─────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Hermes APIs   │      │ Local Files     │      │ System Commands │
│ /api/status   │      │ Obsidian Vault  │      │ ps, hermes CLI  │
│ /api/kanban   │      │ Literature JSON │      │ cron list       │
│ /api/cron     │      │ Hermes configs  │      │                 │
└───────────────┘      └─────────────────┘      └─────────────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Hermes running with gateway on port 4860
- 9router on port 20128
- Obsidian Sync running

### Run with Docker
```bash
cd /opt/data/mission-control
docker-compose up -d --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Run Locally (Development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Data Sources (Real, Not Mocked)

| Feature | Data Source |
|---------|-------------|
| Gateway Status | `GET http://localhost:4860/api/status` |
| Kanban Boards | SQLite: `/opt/data/kanban.db`, `/opt/data/kanban/boards/*/kanban.db` |
| Cron Jobs | `hermes cron list` command output |
| Processes | `ps aux` + `/proc/<pid>/cmdline` |
| Obsidian Vault | `/opt/data/home/Documents/Obsidian Vault/` |
| Literature Corpus | `/opt/data/home/Documents/Disertasi/literature_corpus.json` |
| 9router Models | `GET http://localhost:20128/v1/models` |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/dashboard/overview` | System metrics + gateway status |
| `GET /api/gateway/status` | Gateway detailed status |
| `GET /api/kanban/boards` | All boards with columns & cards |
| `GET /api/kanban/boards/{id}` | Single board detail |
| `GET /api/cron/jobs` | All cron jobs |
| `GET /api/processes` | All system processes |
| `GET /api/memory/vault` | Obsidian Vault structure |
| `GET /api/memory/literature` | Literature corpus entries |
| `GET /api/memory/search?q=` | Full-text search |
| `WS /ws` | Real-time activity feed |

## Project Structure

```
mission-control/
├── backend/
│   ├── app/
│   │   ├── api/routes/       # API endpoints
│   │   ├── services/         # Data source integrations
│   │   ├── models/           # Pydantic schemas
│   │   ├── websocket/        # WebSocket manager
│   │   ├── config.py         # Settings
│   │   └── main.py           # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── types/            # TypeScript interfaces
│   │   └── styles/           # Tailwind CSS
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Key Implementation Notes

1. **No Mock Data** - All components fetch from real backend endpoints
2. **Read-Only** - Mission Control doesn't modify Hermes data
3. **Separate from Hermes Core** - No modifications to Hermes source
4. **Profile-Aware** - Understands multi-profile kanban, cron, configs
5. **Real-Time** - WebSocket for live activity updates
6. **Fallback Handling** - Shows "Not Available" when data inaccessible

## Known Limitations

- Google Calendar/Drive: Requires GWS OAuth completion (needs `gcloud` SDK or service account)
- Telegram History: Not accessible via API (only future messages via webhook)
- Dashboard API Auth: Most endpoints require auth (custom API uses public endpoints + CLI)
- Kanban Race Condition: Gateway dispatcher vs custom processor (read-only here)

## Development

### Adding a New Data Source
1. Create service in `backend/app/services/`
2. Add route in `backend/app/api/routes/`
3. Define schema in `backend/app/models/schemas.py`
4. Create frontend component in `frontend/src/components/`
5. Add route in `frontend/src/App.tsx`
6. Add nav item in `frontend/src/components/Navigation.tsx`

## License

MIT - Built for Hermes AI Team
