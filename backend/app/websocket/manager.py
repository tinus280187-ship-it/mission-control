"""WebSocket connection manager for real-time updates."""

from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
from app.models.schemas import WSMessage
from datetime import datetime
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections and broadcasts."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.heartbeat_task = None
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")
        
        # Start heartbeat if this is the first connection
        if len(self.active_connections) == 1:
            self.start_heartbeat()
        
        try:
            # Send initial connection message
            await self.send_personal_message(websocket, {
                "type": "connection",
                "data": {"status": "connected", "client_count": len(self.active_connections)},
                "timestamp": datetime.now().isoformat()
            })
            
            # Keep connection alive
            while True:
                try:
                    # Wait for messages from client
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    await self.handle_client_message(websocket, message)
                except WebSocketDisconnect:
                    break
                except Exception as e:
                    logger.error(f"Error handling client message: {e}")
                    break
        except WebSocketDisconnect:
            pass
        finally:
            await self.disconnect(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
        
        # Stop heartbeat if no connections remain
        if len(self.active_connections) == 0:
            self.stop_heartbeat()
    
    async def send_personal_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send a message to a specific client."""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        if not self.active_connections:
            return
        
        message_text = json.dumps(message)
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_text)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def broadcast_update(self, update_type: str, data: Any):
        """Broadcast a typed update to all clients."""
        message = {
            "type": update_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        await self.broadcast(message)
    
    async def handle_client_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle incoming messages from clients."""
        message_type = message.get("type")
        
        if message_type == "ping":
            # Respond to ping with pong
            await self.send_personal_message(websocket, {
                "type": "pong",
                "data": {"timestamp": datetime.now().isoformat()},
                "timestamp": datetime.now().isoformat()
            })
        elif message_type == "subscribe":
            # Handle subscription requests
            topics = message.get("data", {}).get("topics", [])
            # TODO: Implement topic-based subscriptions
            logger.info(f"Client subscribed to topics: {topics}")
        else:
            logger.warning(f"Unknown message type: {message_type}")
    
    def start_heartbeat(self):
        """Start the heartbeat task."""
        if self.heartbeat_task is None or self.heartbeat_task.done():
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
    
    def stop_heartbeat(self):
        """Stop the heartbeat task."""
        if self.heartbeat_task and not self.heartbeat_task.done():
            self.heartbeat_task.cancel()
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeat messages to all clients."""
        try:
            while self.active_connections:
                await self.broadcast({
                    "type": "heartbeat",
                    "data": {
                        "timestamp": datetime.now().isoformat(),
                        "connections": len(self.active_connections)
                    },
                    "timestamp": datetime.now().isoformat()
                })
                await asyncio.sleep(30)  # Send heartbeat every 30 seconds
        except asyncio.CancelledError:
            logger.info("Heartbeat task cancelled")
        except Exception as e:
            logger.error(f"Error in heartbeat loop: {e}")


# Global WebSocket manager instance
websocket_manager = WebSocketManager()