import os
import sys
import subprocess
import logging
import shutil
from pathlib import Path
from app.core.config import settings

logger = logging.getLogger(__name__)

class CompressionService:
    @staticmethod
    def compress_pdf(input_path: Path, output_path: Path, level: str = "BALANCED") -> bool:
        """
        Compresses a PDF file. Only BALANCED (Ghostscript) is supported to reduce dependencies.
        Returns True if successful, False otherwise.
        """
        logger.info(f"Starting compression for {input_path}")
        
        gs_cmd = settings.GHOSTSCRIPT_CMD
        args = [
            gs_cmd,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dPDFSETTINGS=/ebook",  # 150 DPI
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_path}",
            str(input_path)
        ]
        
        try:
            subprocess.run(args, capture_output=True, text=True, check=True)
            return True
        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            # Fallback: Copy input to output if compression fails completely
            if input_path != output_path:
                shutil.copy2(input_path, output_path)
            return False

compression_service = CompressionService()
