from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from ..services.scanner.doc_scanner import process_document
import io

router = APIRouter(prefix="/scanner", tags=["scanner"])

@router.post("/process")
async def scan_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        # process_document returns jpeg bytes
        processed_data = process_document(contents)
        return Response(content=processed_data, media_type="image/jpeg")
    except Exception as e:
        print(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
