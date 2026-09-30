"""Kanban board routes."""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import KanbanBoard, KanbanColumn, KanbanCard
from app.services.kanban_service import kanban_service

router = APIRouter()


@router.get("/kanban/boards", response_model=List[KanbanBoard])
async def get_all_boards():
    """Get all Kanban boards."""
    boards = await kanban_service.get_all_boards()
    return boards


@router.get("/kanban/boards/{board_id}", response_model=KanbanBoard)
async def get_board(board_id: str):
    """Get a specific Kanban board."""
    board = await kanban_service.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.get("/kanban/stats")
async def get_kanban_stats():
    """Get Kanban statistics."""
    stats = await kanban_service.get_board_stats()
    return stats


@router.get("/kanban/boards/{board_id}/columns", response_model=List[KanbanColumn])
async def get_board_columns(board_id: str):
    """Get columns for a specific board."""
    board = await kanban_service.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board.columns


@router.get("/kanban/boards/{board_id}/columns/{column_id}/cards", response_model=List[KanbanCard])
async def get_column_cards(board_id: str, column_id: str):
    """Get cards for a specific column."""
    board = await kanban_service.get_board_by_id(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    for column in board.columns:
        if column.id == column_id:
            return column.cards
    
    raise HTTPException(status_code=404, detail="Column not found")