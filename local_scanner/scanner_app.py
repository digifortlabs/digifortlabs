import sys
import os
import cv2
import requests
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk, ImageEnhance
import urllib.parse
from io import BytesIO
import ctypes
import threading
import time
import platform
import logging
from typing import List, Optional, Tuple, Any

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DigifortScanner")

COLORS = {
    "bg": "#1e1e1e",
    "panel": "#252526",
    "fg": "#cccccc",
    "accent": "#007acc",
    "accent_hover": "#0098ff",
    "danger": "#d9534f",
    "success": "#5cb85c",
    "border": "#3e3e42"
}

# =============================================================================
# HARDWARE LAYER: CAMERA MANAGER
# =============================================================================
class CameraManager:
    def __init__(self):
        self.cap: Optional[cv2.VideoCapture] = None
        self.is_running = False
        self.backend = cv2.CAP_DSHOW if platform.system() == "Windows" else cv2.CAP_ANY

    def get_available_cameras(self) -> List[int]:
        available = []
        for i in range(3):
            try:
                temp_cap = cv2.VideoCapture(i, self.backend)
                if temp_cap.isOpened():
                    available.append(i)
                    temp_cap.release()
            except: pass
        return available

    def start(self, index: int, width: int, height: int) -> bool:
        if self.cap: self.stop()
        self.cap = cv2.VideoCapture(index, self.backend)
        if not self.cap.isOpened(): return False
        
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        
        self.is_running = True
        return True

    def get_frame(self):
        if self.cap and self.is_running:
            return self.cap.read()
        return False, None

    def stop(self):
        if self.cap:
            self.cap.release()
            self.cap = None
        self.is_running = False

# =============================================================================
# LOGIC LAYER: IMAGE PROCESSOR
# =============================================================================
class ImageProcessor:
    @staticmethod
    def adjust_cv2(frame, brightness=1.0, contrast=1.0):
        alpha = contrast
        beta = (brightness - 1.0) * 127
        return cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)

    @staticmethod
    def get_document_rect(frame):
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blur, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                largest = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest) > (frame.shape[0] * frame.shape[1] * 0.1):
                    return cv2.boundingRect(largest)
            return None
        except: return None

    @staticmethod
    def apply_pil_filters(img, mode="Color", brightness=1.0, contrast=1.0):
        if mode == "Gray": img = img.convert("L")
        elif mode == "B&W": img = img.convert("L").point(lambda p: 255 if p > 128 else 0)
        
        if mode != "B&W":
            if brightness != 1.0: img = ImageEnhance.Brightness(img).enhance(brightness)
            if contrast != 1.0: img = ImageEnhance.Contrast(img).enhance(contrast)
        return img

# =============================================================================
# EDITOR WINDOW
# =============================================================================
class EditorWindow(tk.Toplevel):
    def __init__(self, parent, pil_img, callback):
        super().__init__(parent)
        self.title("Edit Page")
        self.state('zoomed')
        self.configure(bg=COLORS["bg"])
        self.original = pil_img
        self.current = pil_img
        self.callback = callback
        
        self.brightness = tk.DoubleVar(value=1.0)
        self.contrast = tk.DoubleVar(value=1.0)
        self.mode = tk.StringVar(value="Color")
        self.rotation = 0
        
        self.setup_ui()
        self.update_preview()

    def setup_ui(self):
        tools = tk.Frame(self, width=250, bg=COLORS["panel"])
        tools.pack(side=tk.LEFT, fill=tk.Y)
        tools.pack_propagate(False)

        tk.Label(tools, text="ADJUSTMENTS", fg="white", bg=COLORS["panel"], font=("Arial", 10, "bold")).pack(pady=20)
        
        tk.Label(tools, text="Brightness", fg="white", bg=COLORS["panel"]).pack()
        tk.Scale(tools, from_=0.5, to=1.5, resolution=0.1, orient=tk.HORIZONTAL, variable=self.brightness, command=lambda x: self.update_preview(), bg=COLORS["panel"], fg="white", highlightthickness=0).pack(fill=tk.X, padx=20)
        
        tk.Label(tools, text="Contrast", fg="white", bg=COLORS["panel"]).pack(pady=(10,0))
        tk.Scale(tools, from_=0.5, to=1.5, resolution=0.1, orient=tk.HORIZONTAL, variable=self.contrast, command=lambda x: self.update_preview(), bg=COLORS["panel"], fg="white", highlightthickness=0).pack(fill=tk.X, padx=20)

        for m in ["Color", "Gray", "B&W"]:
            tk.Radiobutton(tools, text=m, variable=self.mode, value=m, command=self.update_preview, bg=COLORS["panel"], fg="white", selectcolor="#444").pack(anchor="w", padx=30, pady=5)

        tk.Button(tools, text="Rotate ⟳", command=lambda: self.rotate(90)).pack(fill=tk.X, padx=20, pady=10)
        tk.Button(tools, text="SAVE", bg=COLORS["accent"], fg="white", command=self.save).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=10)

        self.canvas = tk.Canvas(self, bg="black", highlightthickness=0)
        self.canvas.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

    def rotate(self, angle):
        self.rotation = (self.rotation + angle) % 360
        self.update_preview()

    def update_preview(self):
        img = self.original.rotate(-self.rotation, expand=True)
        img = ImageProcessor.apply_pil_filters(img, self.mode.get(), self.brightness.get(), self.contrast.get())
        self.current = img
        
        cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
        if cw < 10: cw, ch = 800, 600
        
        ratio = min(cw/img.width, ch/img.height)
        nw, nh = int(img.width*ratio), int(img.height*ratio)
        disp = img.resize((nw, nh), Image.Resampling.LANCZOS)
        
        self.photo = ImageTk.PhotoImage(disp)
        self.canvas.delete("all")
        self.canvas.create_image(cw//2, ch//2, image=self.photo)

    def save(self):
        self.callback(self.current)
        self.destroy()

# =============================================================================
# MAIN SCANNER APP
# =============================================================================
class ScannerApp:
    def __init__(self, root, args):
        self.root = root
        self.root.title("Digifort Scanner Pro")
        self.root.state('zoomed')
        self.root.configure(bg=COLORS["bg"])
        
        self.camera = CameraManager()
        self.captured_images = []
        
        self.auto_crop = tk.BooleanVar(value=True)
        self.view_mode = "fit"
        self.live_rotation = 180
        
        params = self.parse_args(args)
        self.token = params.get('token', '')
        self.patient_id = params.get('patient_id', 'demo')
        self.api_url = params.get('api_url', 'http://localhost:8000')

        self.setup_ui()
        
        cams = self.camera.get_available_cameras()
        if cams:
            self.cb_cam['values'] = [f"Camera {i}" for i in cams]
            self.cb_cam.current(0)
            self.start_live()

    def parse_args(self, args):
        p = {}
        if len(args) > 1:
            try:
                uri = args[1].replace("digifort://", "http://d/")
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(uri).query)
                p = {k: v[0] for k, v in qs.items()}
            except: pass
        return p

    def setup_ui(self):
        # Sidebar
        sb = tk.Frame(self.root, width=300, bg=COLORS["panel"])
        sb.pack(side=tk.LEFT, fill=tk.Y)
        sb.pack_propagate(False)

        tk.Label(sb, text="SETTINGS", fg="white", bg=COLORS["panel"], font=("Arial", 12, "bold")).pack(pady=10)
        
        self.cb_cam = ttk.Combobox(sb, state="readonly")
        self.cb_cam.pack(fill=tk.X, padx=10, pady=5)
        self.cb_cam.bind("<<ComboboxSelected>>", lambda e: self.start_live())

        self.cb_res = ttk.Combobox(sb, values=["16MP (4:3)", "4K (16:9)", "1080p"], state="readonly")
        self.cb_res.current(0)
        self.cb_res.pack(fill=tk.X, padx=10, pady=5)
        self.cb_res.bind("<<ComboboxSelected>>", lambda e: self.start_live())

        tk.Checkbutton(sb, text="Auto-Crop", variable=self.auto_crop, bg=COLORS["panel"], fg="white", selectcolor="#333").pack(anchor="w", padx=10)
        
        self.size_lbl = tk.Label(sb, text="PDF Size: 0 MB", fg="white", bg=COLORS["panel"])
        self.size_lbl.pack(pady=10)

        self.list_frame = tk.Frame(sb, bg="#111")
        self.list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        ttk.Button(sb, text="UPLOAD PDF", command=self.upload).pack(fill=tk.X, padx=10, pady=10)

        # Center
        cnt = tk.Frame(self.root, bg="black")
        cnt.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        self.canvas = tk.Canvas(cnt, bg="black", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        btn_cap = tk.Button(cnt, text="CAPTURE", bg="white", fg="black", font=("Arial", 14, "bold"), command=self.capture, height=2, width=20)
        btn_cap.place(relx=0.5, rely=0.9, anchor=tk.CENTER)
        
        self.root.bind("<space>", lambda e: self.capture())

    def start_live(self):
        idx = int(self.cb_cam.get().split()[-1]) if self.cb_cam.get() else 0
        res = self.cb_res.get()
        w, h = (4608, 3456) if "4:3" in res else (3840, 2160) if "4K" in res else (1920, 1080)
        
        if self.camera.start(idx, w, h):
            self.loop()

    def loop(self):
        if not self.camera.is_running: return
        ret, frame = self.camera.get_frame()
        if ret:
            if self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
            
            if self.auto_crop.get():
                rect = ImageProcessor.get_document_rect(frame)
                if rect:
                    x, y, w, h = rect
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 3)

            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
            if cw > 10:
                ratio = min(cw/img.width, ch/img.height)
                img = img.resize((int(img.width*ratio), int(img.height*ratio)), Image.Resampling.LANCZOS)
                self.photo = ImageTk.PhotoImage(img)
                self.canvas.delete("all")
                self.canvas.create_image(cw//2, ch//2, image=self.photo)
        
        self.root.after(30, self.loop)

    def capture(self):
        ret, frame = self.camera.get_frame()
        if not ret: return
        
        if self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
        if self.auto_crop.get():
            rect = ImageProcessor.get_document_rect(frame)
            if rect:
                x, y, w, h = rect
                frame = frame[y:y+h, x:x+w]
        
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        # Internal compression
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85)
        self.captured_images.append(Image.open(buf))
        self.refresh_sidebar()

    def refresh_sidebar(self):
        for w in self.list_frame.winfo_children(): w.destroy()
        total_mb = 0
        for i, img in enumerate(self.captured_images):
            row = tk.Frame(self.list_frame, bg=COLORS["panel"])
            row.pack(fill=tk.X, pady=2)
            
            thumb = img.copy()
            thumb.thumbnail((60, 60))
            ph = ImageTk.PhotoImage(thumb)
            l = tk.Label(row, image=ph, bg="black")
            l.image = ph
            l.pack(side=tk.LEFT)
            
            tk.Label(row, text=f"P{i+1}", fg="white", bg=COLORS["panel"]).pack(side=tk.LEFT, padx=5)
            
            tk.Button(row, text="✕", fg="red", bg=COLORS["panel"], bd=0, command=lambda idx=i: self.delete(idx)).pack(side=tk.RIGHT)
            tk.Button(row, text="✏️", fg="white", bg=COLORS["panel"], bd=0, command=lambda idx=i: self.edit(idx)).pack(side=tk.RIGHT)
            
            total_mb += (img.size[0] * img.size[1] * 3 * 0.1) / (1024*1024)
            
        self.size_lbl.config(text=f"PDF Size: ~{total_mb:.1f} MB")

    def delete(self, idx):
        del self.captured_images[idx]
        self.refresh_sidebar()

    def edit(self, idx):
        EditorWindow(self.root, self.captured_images[idx], lambda img: self.update_img(idx, img))

    def update_img(self, idx, img):
        self.captured_images[idx] = img
        self.refresh_sidebar()

    def upload(self):
        if not self.captured_images: return
        threading.Thread(target=self._upload_worker, daemon=True).start()

    def _upload_worker(self):
        buf = BytesIO()
        self.captured_images[0].save(buf, format="PDF", save_all=True, append_images=self.captured_images[1:], quality=75, optimize=True)
        buf.seek(0)
        
        url = f"{self.api_url}/patients/{self.patient_id}/upload"
        headers = {'Authorization': f"Bearer {self.token}"}
        try:
            requests.post(url, headers=headers, files={'file': ('scan.pdf', buf)}, timeout=60)
            messagebox.showinfo("Success", "Upload complete")
            self.captured_images = []
            self.root.after(0, self.refresh_sidebar)
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    try: ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except: pass
    root = tk.Tk()
    ScannerApp(root, sys.argv)
    root.mainloop()
