import os
import sys
from pathlib import Path
import time

# Add backend to path so we can import app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.services.compression import CompressionService

def run_benchmarks(input_file: str):
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"Error: Input file {input_file} not found.")
        return

    levels = ["FAST", "BALANCED", "ULTRA"]
    results = []

    print(f"\n[BENCHMARK] Starting compression tests for: {input_path.name}")
    print(f"Original Size: {os.path.getsize(input_path) / 1024:.2f} KB\n")
    
    print(f"{'Level':<10} | {'Status':<8} | {'Final Size':<12} | {'Ratio':<6} | {'Time (s)':<8}")
    print("-" * 55)

    for level in levels:
        output_path = Path(f"bench_{level}_{input_path.name}")
        
        start_time = time.time()
        success = CompressionService.compress_pdf(input_path, output_path, level=level)
        duration = time.time() - start_time
        
        if success and output_path.exists():
            final_size = os.path.getsize(output_path)
            ratio = (final_size / os.path.getsize(input_path)) * 100
            print(f"{level:<10} | {'SUCCESS':<8} | {final_size/1024:>8.2f} KB | {ratio:>5.1f}% | {duration:>7.2f}s")
            # Cleanup
            # os.remove(output_path)
        else:
            print(f"{level:<10} | {'FAILED':<8} | {'N/A':<12} | {'N/A':<6} | {duration:>7.2f}s")

if __name__ == "__main__":
    # If a file is provided as argument, use it. Otherwise use a test input if available.
    test_file = sys.argv[1] if len(sys.argv) > 1 else "test_input.pdf"
    run_benchmarks(test_file)
