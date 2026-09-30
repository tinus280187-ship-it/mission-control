"""Memory and knowledge management routes."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.models.schemas import MemoryFolder, MemoryFile, LiteratureEntry
from app.services.memory_service import memory_service

router = APIRouter()


@router.get("/memory/vault", response_model=MemoryFolder)
async def get_obsidian_vault():
    """Get the Obsidian vault structure."""
    vault = await memory_service.get_obsidian_vault()
    if not vault:
        raise HTTPException(status_code=404, detail="Obsidian vault not found")
    return vault


@router.get("/memory/literature", response_model=List[LiteratureEntry])
async def get_literature_corpus():
    """Get the literature corpus."""
    literature = await memory_service.get_literature_corpus()
    return literature


@router.get("/memory/search", response_model=List[MemoryFile])
async def search_files(
    query: str = Query(..., description="Search query"),
    file_type: Optional[str] = Query(None, description="Filter by file type")
):
    """Search for files in the memory system."""
    results = await memory_service.search_files(query, file_type)
    return results


@router.get("/memory/stats")
async def get_memory_stats():
    """Get memory system statistics."""
    stats = await memory_service.get_memory_stats()
    return stats


@router.get("/memory/literature/search", response_model=List[LiteratureEntry])
async def search_literature(
    query: str = Query(..., description="Search query"),
    year: Optional[int] = Query(None, description="Filter by year"),
    author: Optional[str] = Query(None, description="Filter by author")
):
    """Search literature entries."""
    literature = await memory_service.get_literature_corpus()
    
    query_lower = query.lower()
    results = []
    
    for entry in literature:
        # Search in title, abstract, and keywords
        matches_query = (
            query_lower in entry.title.lower() or
            (entry.abstract and query_lower in entry.abstract.lower()) or
            any(query_lower in keyword.lower() for keyword in entry.keywords)
        )
        
        # Apply filters
        matches_year = year is None or entry.year == year
        matches_author = author is None or any(author.lower() in a.lower() for a in entry.authors)
        
        if matches_query and matches_year and matches_author:
            results.append(entry)
    
    return results


@router.get("/memory/literature/years")
async def get_literature_years():
    """Get available years in literature corpus."""
    literature = await memory_service.get_literature_corpus()
    years = sorted(set(entry.year for entry in literature if entry.year > 0), reverse=True)
    return {"years": years}


@router.get("/memory/literature/authors")
async def get_literature_authors():
    """Get available authors in literature corpus."""
    literature = await memory_service.get_literature_corpus()
    authors = set()
    for entry in literature:
        authors.update(entry.authors)
    return {"authors": sorted(list(authors))}


@router.get("/memory/file-types")
async def get_file_types():
    """Get available file types in the vault."""
    vault = await memory_service.get_obsidian_vault()
    if not vault:
        return {"file_types": []}
    
    file_types = set()
    
    def collect_types(folder: MemoryFolder):
        for file in folder.files:
            file_types.add(file.type)
        for subfolder in folder.folders:
            collect_types(subfolder)
    
    collect_types(vault)
    return {"file_types": sorted(list(file_types))}