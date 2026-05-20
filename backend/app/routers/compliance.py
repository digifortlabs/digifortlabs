from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
import os
import markdown
from ..database import get_db
from ..models import User, UserRole
from .auth import get_current_user

router = APIRouter(
    prefix="/compliance",
    tags=["compliance"]
)

# Base path for documentation
DOCS_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../documentation"))

@router.get("/docs", response_model=List[Dict[str, str]])
async def list_docs(current_user: User = Depends(get_current_user)):
    """Lists available compliance documents."""
    docs = []
    if not os.path.exists(DOCS_BASE_PATH):
        return docs
        
    for file in os.listdir(DOCS_BASE_PATH):
        if file.endswith(".md"):
            docs.append({
                "filename": file,
                "title": file.replace(".md", "").replace("_", " "),
                "type": "policy"
            })
            
    # Also check consent_forms subdirectory
    consent_path = os.path.join(DOCS_BASE_PATH, "consent_forms")
    if os.path.exists(consent_path):
        for file in os.listdir(consent_path):
            if file.endswith(".md"):
                docs.append({
                    "filename": f"consent_forms/{file}",
                    "title": file.replace(".md", "").replace("_", " "),
                    "type": "consent"
                })
                
    return docs

@router.get("/docs/{path:path}")
async def get_doc_content(path: str, current_user: User = Depends(get_current_user)):
    """Returns the content of a specific compliance document."""
    # Security check: prevent path traversal
    safe_path = os.path.normpath(path).lstrip(os.sep).lstrip("/")
    full_path = os.path.join(DOCS_BASE_PATH, safe_path)
    
    if not full_path.startswith(os.path.abspath(DOCS_BASE_PATH)):
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
            return {
                "filename": path,
                "content": content,
                "html": markdown.markdown(content, extensions=['extra', 'toc'])
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
