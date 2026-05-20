import pikepdf
import os

pdf_path = r"E:\Digifort_Decrypted_Raw\Dixit_Hospital\2025\02\D756268_3bdba0ec.pdf"
with pikepdf.open(pdf_path) as pdf:
    print(f"Pages: {len(pdf.pages)}")
    img_count = 0
    for page in pdf.pages:
        for name, image in page.images.items():
            img_count += 1
    print(f"Total Images: {img_count}")
    
    # Check for large objects
    objs = []
    for obj in pdf.objects:
        try:
            size = len(obj.read_raw_bytes())
            if size > 100000: # > 100KB
                objs.append((str(obj), size))
        except:
            pass
    
    objs.sort(key=lambda x: x[1], reverse=True)
    print(f"Top 5 large objects:")
    for o, s in objs[:5]:
        print(f"  {o}: {s/1024:.2f} KB")
