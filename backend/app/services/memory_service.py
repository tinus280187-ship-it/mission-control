"""Memory service for managing knowledge files and literature."""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
from app.config import settings
from app.models.schemas import MemoryFile, MemoryFolder, LiteratureEntry
import logging

logger = logging.getLogger(__name__)


class MemoryService:
    """Service for managing memory files and literature corpus."""
    
    def __init__(self):
        self.obsidian_path = settings.obsidian_vault_path
        self.literature_path = settings.literature_corpus_path
    
    async def get_obsidian_vault(self) -> Optional[MemoryFolder]:
        """Get the Obsidian vault structure."""
        if not os.path.exists(self.obsidian_path):
            logger.warning(f"Obsidian vault path does not exist: {self.obsidian_path}")
            return None
        
        return await self._scan_directory(self.obsidian_path, max_depth=3)
    
    async def _scan_directory(self, path: str, max_depth: int = 2, current_depth: int = 0) -> MemoryFolder:
        """Recursively scan a directory and build a MemoryFolder structure."""
        folder_path = Path(path)
        files = []
        folders = []
        total_files = 0
        total_size = 0
        
        try:
            if current_depth >= max_depth:
                # Just count files without scanning subdirectories
                for item in folder_path.iterdir():
                    if item.is_file():
                        total_files += 1
                        total_size += item.stat().st_size
                    elif item.is_dir():
                        # Count files in subdirectory without full scan
                        subdir_count, subdir_size = await self._count_files_in_directory(item)
                        total_files += subdir_count
                        total_size += subdir_size
            else:
                for item in folder_path.iterdir():
                    try:
                        if item.is_file():
                            # Skip hidden files and system files
                            if item.name.startswith('.'):
                                continue
                            
                            stat_info = item.stat()
                            file_info = MemoryFile(
                                path=str(item),
                                name=item.name,
                                size=stat_info.st_size,
                                modified=datetime.fromtimestamp(stat_info.st_mtime),
                                type=self._get_file_type(item.name),
                                content_preview=await self._get_content_preview(item)
                            )
                            files.append(file_info)
                            total_files += 1
                            total_size += stat_info.st_size
                        
                        elif item.is_dir():
                            # Skip hidden directories
                            if item.name.startswith('.'):
                                continue
                            
                            subfolder = await self._scan_directory(str(item), max_depth, current_depth + 1)
                            folders.append(subfolder)
                            total_files += subfolder.total_files
                            total_size += subfolder.total_size
                    
                    except (PermissionError, OSError) as e:
                        logger.debug(f"Cannot access {item}: {e}")
                        continue
        
        except (PermissionError, OSError) as e:
            logger.error(f"Cannot scan directory {path}: {e}")
        
        return MemoryFolder(
            path=str(folder_path),
            name=folder_path.name,
            files=files,
            folders=folders,
            total_files=total_files,
            total_size=total_size
        )
    
    async def _count_files_in_directory(self, path: Path) -> tuple[int, int]:
        """Count files and total size in a directory without full scanning."""
        count = 0
        size = 0
        
        try:
            for item in path.rglob('*'):
                if item.is_file() and not item.name.startswith('.'):
                    count += 1
                    try:
                        size += item.stat().st_size
                    except OSError:
                        pass
        except (PermissionError, OSError):
            pass
        
        return count, size
    
    def _get_file_type(self, filename: str) -> str:
        """Determine the file type based on extension."""
        extension = Path(filename).suffix.lower()
        
        type_map = {
            '.md': 'markdown',
            '.txt': 'text',
            '.pdf': 'pdf',
            '.docx': 'document',
            '.doc': 'document',
            '.xlsx': 'spreadsheet',
            '.xls': 'spreadsheet',
            '.csv': 'csv',
            '.json': 'json',
            '.xml': 'xml',
            '.html': 'html',
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.gif': 'image',
            '.svg': 'image',
        }
        
        return type_map.get(extension, 'unknown')
    
    async def _get_content_preview(self, file_path: Path, max_chars: int = 200) -> Optional[str]:
        """Get a preview of the file content."""
        try:
            # Only preview text-based files
            if self._get_file_type(file_path.name) not in ['markdown', 'text', 'json', 'csv', 'html', 'python', 'javascript', 'typescript']:
                return None
            
            # Check file size - don't preview large files
            if file_path.stat().st_size > 1024 * 1024:  # 1MB limit
                return None
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(max_chars)
                return content[:max_chars] + "..." if len(content) == max_chars else content
        
        except Exception as e:
            logger.debug(f"Cannot preview {file_path}: {e}")
            return None
    
    async def get_literature_corpus(self) -> List[LiteratureEntry]:
        """Get the literature corpus data."""
        if not os.path.exists(self.literature_path):
            logger.warning(f"Literature corpus file does not exist: {self.literature_path}")
            return []
        
        try:
            with open(self.literature_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            entries = []
            
            # Handle different JSON structures
            if isinstance(data, list):
                corpus_data = data
            elif isinstance(data, dict) and 'entries' in data:
                corpus_data = data['entries']
            elif isinstance(data, dict) and 'literature' in data:
                corpus_data = data['literature']
            else:
                corpus_data = [data]  # Single entry
            
            for item in corpus_data:
                if isinstance(item, dict):
                    entry = LiteratureEntry(
                        id=item.get('id', str(hash(item.get('title', '')))),
                        title=item.get('title', 'Untitled'),
                        authors=item.get('authors', []) if isinstance(item.get('authors'), list) else [item.get('authors', '')],
                        year=item.get('year', 0),
                        abstract=item.get('abstract'),
                        keywords=item.get('keywords', []) if isinstance(item.get('keywords'), list) else [],
                        url=item.get('url')
                    )
                    entries.append(entry)
            
            return entries
        
        except Exception as e:
            logger.error(f"Error loading literature corpus: {e}")
            return []
    
    async def search_files(self, query: str, file_type: Optional[str] = None) -> List[MemoryFile]:
        """Search for files in the Obsidian vault."""
        vault = await self.get_obsidian_vault()
        if not vault:
            return []
        
        results = []
        query_lower = query.lower()
        
        def search_in_folder(folder: MemoryFolder):
            # Search files in current folder
            for file in folder.files:
                if (query_lower in file.name.lower() or 
                    (file.content_preview and query_lower in file.content_preview.lower())):
                    if not file_type or file.type == file_type:
                        results.append(file)
            
            # Recursively search subfolders
            for subfolder in folder.folders:
                search_in_folder(subfolder)
        
        search_in_folder(vault)
        return results
    
    async def get_memory_stats(self) -> Dict[str, Any]:
        """Get statistics about memory files and literature."""
        vault = await self.get_obsidian_vault()
        literature = await self.get_literature_corpus()
        
        vault_stats = {
            "total_files": vault.total_files if vault else 0,
            "total_size": vault.total_size if vault else 0,
            "folders": len(vault.folders) if vault else 0
        }
        
        # Count files by type
        file_types = {}
        if vault:
            def count_types(folder: MemoryFolder):
                for file in folder.files:
                    file_types[file.type] = file_types.get(file.type, 0) + 1
                for subfolder in folder.folders:
                    count_types(subfolder)
            count_types(vault)
        
        literature_stats = {
            "total_entries": len(literature),
            "years": list(set(entry.year for entry in literature if entry.year > 0)),
            "authors": list(set(author for entry in literature for author in entry.authors))
        }
        
        return {
            "obsidian_vault": vault_stats,
            "file_types": file_types,
            "literature_corpus": literature_stats
        }


# Global service instance
memory_service = MemoryService()