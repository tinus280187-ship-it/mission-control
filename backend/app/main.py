"""FastAPI application entry point."""

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import health, gateway, kanban, cron, processes, memory, dashboard
from app.websocket.manager import websocket_manager
import uvicorn


# Create FastAPI app
app = FastAPI(
    title=settings.title,
    version=settings.version,
    description=settings.description
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(gateway.router, prefix="/api", tags=["gateway"])
app.include_router(kanban.router, prefix="/api", tags=["kanban"])
app.include_router(cron.router, prefix="/api", tags=["cron"])
app.include_router(processes.router, prefix="/api", tags=["processes"])
app.include_router(memory.router, prefix="/api", tags=["memory"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket_manager.connect(websocket)


@app.on_event("startup")
async def startup_event():
    """Application startup event."""
    print(f"Mission Control API v{settings.version} starting up...")
    print(f"Allowed origins: {settings.allowed_origins}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event."""
    print("Mission Control API shutting down...")


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )