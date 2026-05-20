import os
import sys
import subprocess
import logging
import shutil
from pathlib import Path
from typing import Optional
import pikepdf
from app.core.config import settings

logger = logging.getLogger(__name__)

class CompressionService:
    @staticmethod
    def compress_pdf(input_path: Path, output_path: Path, level: str = "BALANCED") -> bool:
        """
        Compresses a PDF file using the specified level/strategy.
        Returns True if successful, False otherwise.
        """
        level = level.upper()
        logger.info(f"Starting {level} compression for {input_path}")
        
        try:
            if level == "FAST":
                return CompressionService._compress_fast(input_path, output_path)
            elif level == "BALANCED":
                return CompressionService._compress_balanced(input_path, output_path)
            elif level == "ULTRA":
                return CompressionService._compress_ultra(input_path, output_path)
            else:
                logger.warning(f"Unknown compression level '{level}', falling back to BALANCED")
                return CompressionService._compress_balanced(input_path, output_path)
        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            # Fallback: Copy input to output if compression fails completely
            if input_path != output_path:
                shutil.copy2(input_path, output_path)
            return False

    @staticmethod
    def _compress_fast(input_path: Path, output_path: Path) -> bool:
        """Uses pikepdf for metadata stripping and basic object optimization."""
        try:
            with pikepdf.open(input_path) as pdf:
                pdf.save(output_path, object_stream_mode=pikepdf.ObjectStreamMode.generate)
            return True
        except Exception as e:
            logger.error(f"Fast compression failed: {str(e)}")
            return False

    @staticmethod
    def _compress_balanced(input_path: Path, output_path: Path) -> bool:
        """Uses Ghostscript for downsampling images to 150 DPI."""
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
            result = subprocess.run(args, capture_output=True, text=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Ghostscript failed: {e.stderr}")
            return False

    @staticmethod
    def _compress_ultra(input_path: Path, output_path: Path) -> bool:
        """Uses OCRmyPDF for ultimate optimization (monochrome text, deskew)."""
        python_exe = sys.executable if hasattr(sys, 'executable') else "python"
        
        # Check if pngquant is available for higher optimization levels
        has_pngquant = shutil.which("pngquant") is not None
        opt_level = "3" if has_pngquant else "1"
        
        if not has_pngquant:
            logger.info("pngquant not found, using --optimize 1 for ULTRA strategy")
        
        args = [
            python_exe, "-m", "ocrmypdf",
            "--optimize", opt_level,
            "--deskew",
            "--skip-text", 
            "--output-type", "pdf",
            str(input_path),
            str(output_path)
        ]
        
        try:
            subprocess.run(args, capture_output=True, text=True, check=True, timeout=300)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"OCRmyPDF failed: {e.stderr}")
            return CompressionService._compress_balanced(input_path, output_path)
        except Exception as e:
            logger.error(f"Ultra compression error: {str(e)}")
            return False

compression_service = CompressionService()
