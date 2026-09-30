"""Kanban service for managing boards and cards."""

import sqlite3
import os
import json
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.config import settings
from app.models.schemas import KanbanBoard, KanbanColumn, KanbanCard
import logging

logger = logging.getLogger(__name__)


class KanbanService:
    """Service for managing Kanban boards."""
    
    def __init__(self):
        self.main_db_path = settings.kanban_main_db
        self.boards_path = settings.kanban_boards_path
    
    async def get_all_boards(self) -> List[KanbanBoard]:
        """Get all Kanban boards."""
        boards = []
        
        # Get boards from main database
        if os.path.exists(self.main_db_path):
            boards.extend(await self._get_boards_from_db(self.main_db_path))
        
        # Get boards from individual board databases
        if os.path.exists(self.boards_path):
            for board_dir in os.listdir(self.boards_path):
                board_db_path = os.path.join(self.boards_path, board_dir, "kanban.db")
                if os.path.exists(board_db_path):
                    boards.extend(await self._get_boards_from_db(board_db_path, board_dir))
        
        return boards
    
    async def get_board_by_id(self, board_id: str) -> Optional[KanbanBoard]:
        """Get a specific board by ID."""
        boards = await self.get_all_boards()
        for board in boards:
            if board.id == board_id:
                return board
        return None
    
    async def _get_boards_from_db(self, db_path: str, board_name: Optional[str] = None) -> List[KanbanBoard]:
        """Extract boards from a SQLite database."""
        boards = []
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check if tables exist
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            
            if 'boards' in tables:
                # Modern schema with boards table
                cursor.execute("SELECT * FROM boards")
                board_rows = cursor.fetchall()
                
                for row in board_rows:
                    board_id = str(row[0])
                    board = KanbanBoard(
                        id=board_id,
                        name=row[1],
                        description=row[2] if len(row) > 2 else None,
                        columns=await self._get_columns_for_board(cursor, board_id),
                        created_at=datetime.fromisoformat(row[3]) if len(row) > 3 else datetime.now(),
                        updated_at=datetime.fromisoformat(row[4]) if len(row) > 4 else datetime.now()
                    )
                    boards.append(board)
            
            elif 'columns' in tables:
                # Legacy schema - create a default board
                board_id = board_name or "default"
                board = KanbanBoard(
                    id=board_id,
                    name=board_name or "Default Board",
                    description="Legacy Kanban board",
                    columns=await self._get_columns_for_board(cursor, None),
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                boards.append(board)
            
            conn.close()
        except Exception as e:
            logger.error(f"Error reading Kanban database {db_path}: {e}")
        
        return boards
    
    async def _get_columns_for_board(self, cursor, board_id: Optional[str]) -> List[KanbanColumn]:
        """Get columns for a specific board."""
        columns = []
        
        try:
            # Query columns
            if board_id:
                cursor.execute("SELECT * FROM columns WHERE board_id = ?", (board_id,))
            else:
                cursor.execute("SELECT * FROM columns")
            
            column_rows = cursor.fetchall()
            
            for row in column_rows:
                column_id = str(row[0])
                column = KanbanColumn(
                    id=column_id,
                    title=row[1] if len(row) > 1 else "Untitled",
                    position=row[2] if len(row) > 2 else 0,
                    cards=await self._get_cards_for_column(cursor, column_id)
                )
                columns.append(column)
            
            # Sort by position
            columns.sort(key=lambda x: x.position)
        except Exception as e:
            logger.error(f"Error getting columns: {e}")
        
        return columns
    
    async def _get_cards_for_column(self, cursor, column_id: str) -> List[KanbanCard]:
        """Get cards for a specific column."""
        cards = []
        
        try:
            cursor.execute("SELECT * FROM cards WHERE column_id = ?", (column_id,))
            card_rows = cursor.fetchall()
            
            for row in card_rows:
                card = KanbanCard(
                    id=str(row[0]),
                    title=row[1] if len(row) > 1 else "Untitled",
                    description=row[2] if len(row) > 2 else None,
                    column_id=column_id,
                    position=row[3] if len(row) > 3 else 0,
                    created_at=datetime.fromisoformat(row[4]) if len(row) > 4 else datetime.now(),
                    updated_at=datetime.fromisoformat(row[5]) if len(row) > 5 else datetime.now(),
                    tags=json.loads(row[6]) if len(row) > 6 and row[6] else [],
                    assignee=row[7] if len(row) > 7 else None
                )
                cards.append(card)
            
            # Sort by position
            cards.sort(key=lambda x: x.position)
        except Exception as e:
            logger.error(f"Error getting cards for column {column_id}: {e}")
        
        return cards
    
    async def get_board_stats(self) -> Dict[str, Any]:
        """Get statistics about all boards."""
        boards = await self.get_all_boards()
        
        total_boards = len(boards)
        total_columns = sum(len(board.columns) for board in boards)
        total_cards = sum(len(col.cards) for board in boards for col in board.columns)
        
        return {
            "total_boards": total_boards,
            "total_columns": total_columns,
            "total_cards": total_cards,
            "boards": [{"id": board.id, "name": board.name, "cards": len([card for col in board.columns for card in col.cards])} for board in boards]
        }


# Global service instance
kanban_service = KanbanService()