import sys
import os
import cv2
import requests
import json
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import re
import urllib.parse
from io import BytesIO
import threading

class ScannerApp:
    def __init__(self, root, args):
        self.root = root
        self.root.title("Digifort Desktop Scanner")
        self.root.geometry("1000x700")
        
        # Parse Arguments
        self.params = self.parse_arguments(args)
        
        # State
        self.token = self.params.get('token')
        self.api_url = self.params.get('api_url', 'http://localhost:8000')
        self.patient_id = self.params.get('patient_id')
        self.cap = None
        self.camera_active = False
        self.captured_images = [] # List of PIL Images
        self.selected_camera_index = 0
        self.available_cameras = self.get_available_cameras()
        
        if not self.token or not self.patient_id:
            messagebox.showerror("Launch Error", "Missing authentication tokens. Please launch from the Web Dashboard.")
            # In dev mode, we might want to allow start? No, strict.
            # self.root.destroy()
            # return

        self.setup_ui()
        self.start_camera()

    def parse_arguments(self, args):
        params = {}
        if len(args) > 1:
            uri = args[1]
            try:
                # Format: digifort://upload?token=...
                parsed = urllib.parse.urlparse(uri)
                qs = urllib.parse.parse_qs(parsed.query)
                for k, v in qs.items():
                    params[k] = v[0]
            except Exception as e:
                print(f"Error parsing URI: {e}")
        return params

    def get_available_cameras(self):
        # Naive check for first 5 indexes
        available = []
        for i in range(5):
            cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
            if cap.isOpened():
                available.append(i)
                cap.release()
        return available

    def setup_ui(self):
        # Main Layout: Split (Left Camera, Right Gallery)
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Left Side: Camera Feed
        left_panel = ttk.Frame(main_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # Header Info
        info_str = f"Patient: {self.params.get('patient_name', 'Unknown')} ({self.params.get('mrd', 'N/A')})"
        ttk.Label(left_panel, text=info_str, font=("Arial", 12, "bold")).pack(pady=5)
        
        # Canvas for Camera
        self.cam_canvas = tk.Canvas(left_panel, bg="black")
        self.cam_canvas.pack(fill=tk.BOTH, expand=True)
        
        # Camera Controls
        controls = ttk.Frame(left_panel)
        controls.pack(fill=tk.X, pady=10)
        
        ttk.Button(controls, text="Capture (Space)", command=self.capture_frame).pack(side=tk.LEFT, padx=5)
        
        # Camera Selector
        if len(self.available_cameras) > 1:
            self.cam_combo = ttk.Combobox(controls, values=[f"Camera {i}" for i in self.available_cameras], state="readonly")
            self.cam_combo.current(0)
            self.cam_combo.pack(side=tk.LEFT, padx=5)
            self.cam_combo.bind("<<ComboboxSelected>>", self.change_camera)
            
        # Right Side: Gallery
        right_panel = ttk.Frame(main_frame, width=250)
        right_panel.pack(side=tk.RIGHT, fill=tk.Y, padx=(10, 0))
        
        ttk.Label(right_panel, text="Scanned Pages", font=("Arial", 10, "bold")).pack(pady=5)
        
        self.gallery_frame = ttk.Frame(right_panel)
        self.gallery_frame.pack(fill=tk.BOTH, expand=True)
        # Add scrollbar logic later if needed
        
        upload_btn = ttk.Button(right_panel, text="Upload All", command=self.upload_all)
        upload_btn.pack(pady=10, fill=tk.X)

        # Keyboard Bindings
        self.root.bind('<space>', lambda e: self.capture_frame())

    def start_camera(self):
        if self.camera_active: return
        self.cap = cv2.VideoCapture(self.selected_camera_index, cv2.CAP_DSHOW)
        
        # Set high res 
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        
        self.camera_active = True
        self.update_feed()

    def change_camera(self, event):
        idx = self.cam_combo.current()
        new_cam = self.available_cameras[idx]
        if new_cam != self.selected_camera_index:
            self.selected_camera_index = new_cam
            if self.cap:
                self.cap.release()
            self.camera_active = False
            self.start_camera()

    def update_feed(self):
        if not self.camera_active: return
        
        ret, frame = self.cap.read()
        if ret:
            # Resize for display (canvas size)
            canvas_w = self.cam_canvas.winfo_width()
            canvas_h = self.cam_canvas.winfo_height()
            
            if canvas_w > 1 and canvas_h > 1:
                # Maintain aspect ratio logic could go here
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(rgb_frame)
                img.thumbnail((canvas_w, canvas_h))
                self.photo = ImageTk.PhotoImage(image=img)
                self.cam_canvas.create_image(canvas_w//2, canvas_h//2, image=self.photo, anchor=tk.CENTER)
            
        self.root.after(30, self.update_feed)

    def capture_frame(self):
        if not self.cap: return
        ret, frame = self.cap.read()
        if ret:
            # Process: Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            self.captured_images.append(pil_img)
            self.update_gallery()
            
            # Visual Flash effect
            self.cam_canvas.config(bg="white")
            self.root.after(100, lambda: self.cam_canvas.config(bg="black"))

    def update_gallery(self):
        # Clear current gallery widgets
        for widget in self.gallery_frame.winfo_children():
            widget.destroy()
            
        for i, img in enumerate(self.captured_images):
            # Create thumbnail
            thumb = img.copy()
            thumb.thumbnail((100, 100))
            photo = ImageTk.PhotoImage(thumb)
            
            lbl = ttk.Label(self.gallery_frame, image=photo)
            lbl.image = photo # Keep reference
            lbl.pack(pady=2)
            
            # Delete button logic could go here
            
    def compress_image(self, pil_img):
        # Convert to JPEG bytes with optimization
        buffer = BytesIO()
        pil_img.save(buffer, format="JPEG", quality=85, optimize=True)
        buffer.seek(0)
        return buffer

    def upload_all(self):
        if not self.captured_images:
            return
            
        threading.Thread(target=self._upload_thread).start()

    def _upload_thread(self):
        # Lock UI?
        success_count = 0
        total = len(self.captured_images)
        
        for i, img in enumerate(self.captured_images):
            try:
                # Prepare File
                img_buffer = self.compress_image(img)
                filename = f"scan_{self.patient_id}_{i}_{threading.get_ident()}.jpg"
                
                # Upload to API
                files = {'file': (filename, img_buffer, 'image/jpeg')}
                headers = {'Authorization': f"Bearer {self.token}"}
                
                url = f"{self.api_url}/patients/{self.patient_id}/upload"
                print(f"Uploading to {url}")
                
                res = requests.post(url, headers=headers, files=files)
                if res.status_code == 200:
                    success_count += 1
                else:
                    print(f"Failed to upload {filename}: {res.text}")
                    
            except Exception as e:
                print(f"Exception during upload: {e}")
        
        self.root.after(0, lambda: messagebox.showinfo("Upload Complete", f"Uploaded {success_count}/{total} images."))
        # Clear gallery if all success
        if success_count == total:
            self.captured_images = []
            self.root.after(0, self.update_gallery)

    def on_close(self):
        if self.cap:
            self.cap.release()
        self.root.destroy()

if __name__ == "__main__":
    if hasattr(ctypes.windll.shcore, 'SetProcessDpiAwareness'):
        ctypes.windll.shcore.SetProcessDpiAwareness(1) # HiDPI
        
    root = tk.Tk()
    app = ScannerApp(root, sys.argv)
    root.protocol("WM_DELETE_WINDOW", app.on_close)
    root.mainloop()
