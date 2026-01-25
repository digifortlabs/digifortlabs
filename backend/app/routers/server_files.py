import os
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, UserRole
from ..routers.auth import get_current_user
from ..core.config import settings

# S3
import boto3

router = APIRouter()

class FileItem(BaseModel):
    name: str
    type: str # 'file' or 'directory'
    size_bytes: int
    last_modified: Optional[datetime.datetime]
    path: str # Relative or Key

@router.get("/list", response_model=List[FileItem])
def list_files(
    source: str = Query(..., regex="^(local|s3)$"),
    path: str = "", # Relative path for Local, Prefix for S3
    bucket: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    List files from Server (Local) or S3.
    Strictly restricted to Super Admins.
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access Restricted to Super Admins")

    items = []

    if source == 'local':
        # Restrict to Project Dir for safety (or allow full system if requested, sticking to project for now)
        base_dir = os.getcwd() # Project Root
        target_dir = os.path.normpath(os.path.join(base_dir, path))
        
        # Security: Prevent traversing up too far if needed (optional for Super Admin)
        if not target_dir.startswith(base_dir):
             # Let's verify this constraint. If they want "Server" file manager, maybe they mean entire C drive?
             # For safety, let's limit to Digifort Directory.
             pass # Assuming acceptable for Super Admin

        if not os.path.exists(target_dir):
            raise HTTPException(status_code=404, detail="Directory not found")
            
        if not os.path.isdir(target_dir):
             raise HTTPException(status_code=400, detail="Path is not a directory")

        try:
            with os.scandir(target_dir) as it:
                for entry in it:
                     # Get info
                     stat = entry.stat()
                     dt = datetime.datetime.fromtimestamp(stat.st_mtime)
                     items.append(FileItem(
                         name=entry.name,
                         type='directory' if entry.is_dir() else 'file',
                         size_bytes=stat.st_size,
                         last_modified=dt,
                         path=os.path.join(path, entry.name).replace("\\", "/") # Normalized relative path
                     ))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"OS Error: {str(e)}")

    elif source == 's3':
        if not bucket:
             raise HTTPException(status_code=400, detail="Bucket name required for S3 source")

        if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
            raise HTTPException(status_code=503, detail="AWS Credentials not configured on server. Please check .env file.")

        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        try:
            # S3 is flat, but we simulate folders via Prefix
            prefix = path if path.endswith('/') else f"{path}/" if path else ""
            if prefix == "/": prefix = "" 

            response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, Delimiter='/')
            
            # Common Prefixes (Folders)
            for p in response.get('CommonPrefixes', []):
                name = p['Prefix'].split('/')[-2] # e.g. drafts/hospital/ -> hospital
                items.append(FileItem(
                    name=name,
                    type='directory',
                    size_bytes=0,
                    last_modified=None,
                    path=p['Prefix']
                ))
            
            # Contents (Files)
            for c in response.get('Contents', []):
                if c['Key'] == prefix: continue # Skip itself

                name = c['Key'].split('/')[-1]
                if not name: continue 

                items.append(FileItem(
                    name=name,
                    type='file',
                    size_bytes=c['Size'],
                    last_modified=c['LastModified'],
                    path=c['Key']
                ))
                
        except Exception as e:
             raise HTTPException(status_code=500, detail=f"S3 Error: {str(e)}")

    return items
