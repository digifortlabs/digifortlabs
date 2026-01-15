import io
import os
import tempfile
import sys

# Try compression libs
try:
    from pdf2image import convert_from_bytes
    from PIL import Image
    HAS_IMG_TOOLS = True
except ImportError:
    HAS_IMG_TOOLS = False
    print("Warning: PDF Compression Tools missing (pdf2image/Pillow). Using lossless only.")

from moviepy import VideoFileClip
from pypdf import PdfReader, PdfWriter


def compress_pdf(file_bytes: bytes) -> bytes:
    """
    Compress PDF using two strategies:
    1. Strong: Convert to images, optimize JPEGs (Quality 60), Rebuild PDF. (Great for scans)
    2. Mild: Lossless structure compression via pypdf.
    """
    original_size = len(file_bytes)
    
    # STRATEGY 1: Image Optimization (Aggressive)
    if HAS_IMG_TOOLS and original_size > 500 * 1024: # Only for files > 500KB
        try:
            print("📉 Attempting Aggressive Image Compression...")
            # Convert to images
            images = convert_from_bytes(file_bytes, dpi=150, fmt='jpeg', grayscale=False, size=(1600, None))
            
            output_pdf_stream = io.BytesIO()
            
            # Save first image as PDF and append others
            if images:
                first_image = images[0]
                rest_images = images[1:]
                
                first_image.save(
                    output_pdf_stream, 
                    "PDF", 
                    resolution=150.0, 
                    save_all=True, 
                    append_images=rest_images,
                    optimize=True,
                    quality=60 # Aggressive compression
                )
                
                compressed_bytes = output_pdf_stream.getvalue()
                compressed_size = len(compressed_bytes)
                
                if compressed_size < original_size:
                     reduction = ((original_size - compressed_size) / original_size) * 100
                     print(f"✅ Aggressive Compression Success: {original_size/1024:.1f}KB → {compressed_size/1024:.1f}KB (-{reduction:.1f}%)")
                     return compressed_bytes
                else:
                    print(f"⚠️ Aggressive compression made file larger ({compressed_size/1024:.1f}KB). Discarding.")
        except Exception as e:
            print(f"⚠️ Aggressive Compression Failed: {e}")

    # STRATEGY 2: Lossless (Fallback)
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        writer = PdfWriter()

        for page in reader.pages:
            new_page = writer.add_page(page)
            # 1. Compress Content Streams
            new_page.compress_content_streams()

        # 2. Clear Metadata
        writer.add_metadata({})
        
        output_stream = io.BytesIO()
        writer.write(output_stream)
        lossless_bytes = output_stream.getvalue()
        
        if len(lossless_bytes) < original_size:
             return lossless_bytes
             
        return file_bytes
        
    except Exception as e:
        print(f"❌ Lossless Compression Failed: {e}")
        return file_bytes

def compress_video_to_mp4(file_path: str) -> str:
    """
    Compress video to 720p MP4 (H.264) using MoviePy.
    Returns path to compressed file.
    """
    try:
        temp_dir = tempfile.gettempdir()
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        output_path = os.path.join(temp_dir, f"{name}_compressed.mp4")

        clip = VideoFileClip(file_path)
        
        # Resize if height > 720p
        if clip.h > 720:
             clip = clip.resized(height=720)
        
        # Write to file with compression settings
        clip.write_videofile(
            output_path, 
            codec='libx264', 
            audio_codec='aac', 
            temp_audiofile=os.path.join(temp_dir, f"{name}_temp_audio.m4a"),
            remove_temp=True,
            preset='medium',
            ffmpeg_params=["-crf", "23"] # Constant Rate Factor (18-28 is good range)
        )
        
        clip.close()
        return output_path
    except Exception as e:
        print(f"Video Compression Failed: {e}")
        return file_path
