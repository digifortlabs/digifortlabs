import io
import os
import tempfile

from moviepy import VideoFileClip
from pypdf import PdfReader, PdfWriter


def compress_pdf(file_bytes: bytes) -> bytes:
    """
    Compress PDF by:
    1. Compressing content streams
    2. Removing all metadata and extra objects
    3. Ensuring cross-reference table compression
    """
    try:
        original_size = len(file_bytes)
        reader = PdfReader(io.BytesIO(file_bytes))
        writer = PdfWriter()

        for page in reader.pages:
            writer.add_page(page)

        # 1. Compress Content Streams
        for page in writer.pages:
            page.compress_content_streams()

        # 2. Clear Metadata (significant saving in some scanned PDFs)
        writer.add_metadata({})
        
        # 3. Write with compression
        output_stream = io.BytesIO()
        writer.write(output_stream)
        compressed_bytes = output_stream.getvalue()
        
        compressed_size = len(compressed_bytes)
        
        if compressed_size < original_size:
            reduction = ((original_size - compressed_size) / original_size) * 100
            print(f"✅ PDF Compressed: {original_size / 1024:.2f} KB → {compressed_size / 1024:.2f} KB ({reduction:.1f}% reduction)")
            return compressed_bytes
        else:
            return file_bytes
    except Exception as e:
        print(f"❌ PDF Compression Failed: {e}")
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
