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
import numpy as np
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
        
        # Try to force camera access with retry
        max_retries = 3
        for attempt in range(max_retries):
            try:
                self.cap = cv2.VideoCapture(index, self.backend)
                if not self.cap.isOpened():
                    if attempt < max_retries - 1:
                        time.sleep(0.5)
                        continue
                    return False
                break
            except:
                if attempt < max_retries - 1:
                    time.sleep(0.5)
                    continue
                return False

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Set minimum FPS to 5 (OpenCV sometimes struggles with 16MP)
        self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        
        self.is_running = True
        return True

    def set_light(self, level: int):
        """Cycle through 4 light levels: 0=Off, 1=Low, 2=Medium, 3=High"""
        if not self.cap: return
        light_values = [0, 33, 66, 100]
        try:
            self.cap.set(cv2.CAP_PROP_BRIGHTNESS, light_values[level % 4])
        except: pass

    def trigger_focus(self):
        """Manually triggers autofocus by toggling it off and on."""
        if self.cap and self.is_running:
            try:
                self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 0) # Off
                time.sleep(0.1)
                self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1) # On (Triggers search)
                return True
            except:
                return False
        return False

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
    def adjust_cv2(frame, brightness=1.0, contrast=1.0, mode="Color"):
        """Applies Brightness, Contrast and Color Mode to CV2 Frame."""
        try:
            # 1. Apply Brightness/Contrast
            alpha = contrast
            beta = (brightness - 1.0) * 127
            adjusted = cv2.convertScaleAbs(frame, alpha=alpha, beta=beta)
            
            # 2. Apply Color Mode
            if mode == "Gray":
                adjusted = cv2.cvtColor(cv2.cvtColor(adjusted, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
            elif mode == "B&W":
                gray = cv2.cvtColor(adjusted, cv2.COLOR_BGR2GRAY)
                # Professional Adaptive Thresholding for crisp text
                adjusted = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                               cv2.THRESH_BINARY, 15, 8)
                adjusted = cv2.cvtColor(adjusted, cv2.COLOR_GRAY2BGR)
                
            return adjusted
        except:
            return frame

    @staticmethod
    def apply_color_mode(frame, mode):
        # Deprecated: Merged into adjust_cv2 for performance
        return frame

    @staticmethod
    def get_document_rect(frame):
        """Advanced document detection using OpenCV - optimized for A3 scanners"""
        try:
            # 1. Preprocessing
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # Bilateral filter to reduce noise while keeping edges sharp
            blur = cv2.bilateralFilter(gray, 9, 75, 75)
            
            # 2. Edge Detection
            # Using adaptive threshold to handle lighting peaks
            thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                          cv2.THRESH_BINARY, 11, 2)
            
            # Detect edges using Canny on the thresholded image
            edges = cv2.Canny(thresh, 75, 200)
            
            # Dilate to close gaps in edges (stronger dilation for overhead scanners)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
            dilated = cv2.dilate(edges, kernel, iterations=1)
            
            # 3. Contour Detection
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return None
                
            # Sort by area and check the largest ones
            contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
            
            h, w = frame.shape[:2]
            frame_area = w * h
            
            for contour in contours:
                area = cv2.contourArea(contour)
                # Must be at least 15% of the frame to be a document
                if area < (frame_area * 0.15):
                    continue
                
                # Approximate the contour to a polygon
                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.015 * peri, True)
                
                # If we found a quadrilateral, that's likely our document
                if len(approx) == 4:
                    return approx
                
                # If between 4 and 10 points, try to get the bounding box as fallback
                if 4 <= len(approx) <= 10:
                    x, y, bw, bh = cv2.boundingRect(contour)
                    if (bw * bh) > (frame_area * 0.2):
                        return np.array([[x, y], [x+bw, y], [x+bw, y+bh], [x, y+bh]], dtype=np.int32)

            return None
        except: return None

    @staticmethod
    def order_points(pts):
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]
        rect[2] = pts[np.argmax(s)]
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]
        rect[3] = pts[np.argmax(diff)]
        return rect

    @staticmethod
    def transform_quad(image, quad):
        """Perform bird's-eye perspective transform (Dewarping)"""
        try:
            pts = quad.reshape(4, 2)
            rect = ImageProcessor.order_points(pts)
            (tl, tr, br, bl) = rect

            widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
            widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
            maxWidth = max(int(widthA), int(widthB))

            heightA = np.sqrt(((tr[1] - br[1]) ** 2) + ((tr[0] - br[0]) ** 2))
            heightB = np.sqrt(((tl[1] - bl[1]) ** 2) + ((tl[0] - bl[0]) ** 2))
            maxHeight = max(int(heightA), int(heightB))

            dst = np.array([
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1],
                [0, maxHeight - 1]], dtype="float32")

            M = cv2.getPerspectiveTransform(rect, dst)
            warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
            return warped
        except:
            return image

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
        self.light_level = 0
        self.is_autofocus = True
        
        # --- FIX: Define params before usage ---
        params = self.parse_args(args)
        
        self.token = params.get('token', '')
        self.patient_id = params.get('patient_id', 'demo')
        self.api_url = params.get('api_url', 'http://localhost:8000')
        
        self.live_brightness = tk.DoubleVar(value=1.0)
        self.live_contrast = tk.DoubleVar(value=1.0)
        self.color_mode = tk.StringVar(value="Color")

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
        s = ttk.Style()
        s.theme_use('clam')
        s.configure(".", background=COLORS["panel"], foreground=COLORS["fg"])
        s.configure("TLabel", background=COLORS["panel"], foreground=COLORS["fg"], font=("Segoe UI", 9))
        s.configure("TCombobox", fieldbackground="#333", background=COLORS["panel"])
        s.configure("Accent.TButton", background=COLORS["accent"], foreground="white", font=("Segoe UI", 10, "bold"))
        
        # Sidebar
        sb = tk.Frame(self.root, width=320, bg=COLORS["panel"])
        sb.pack(side=tk.LEFT, fill=tk.Y)
        sb.pack_propagate(False)

        ttk.Label(sb, text="DOCUMENT SCANNER", font=("Segoe UI", 14, "bold"), foreground="white").pack(pady=15)
        
        # Camera Control Group
        lf_cam = ttk.LabelFrame(sb, text="Hardware", padding=10)
        lf_cam.pack(fill=tk.X, padx=10, pady=5)
        
        self.cb_cam = ttk.Combobox(lf_cam, state="readonly")
        self.cb_cam.pack(fill=tk.X, pady=2)
        self.cb_cam.bind("<<ComboboxSelected>>", lambda e: self.start_live())

        self.cb_res = ttk.Combobox(lf_cam, values=["16MP (4:3)", "4K (16:9)", "1080p"], state="readonly")
        self.cb_res.current(0)
        self.cb_res.pack(fill=tk.X, pady=2)
        self.cb_res.bind("<<ComboboxSelected>>", lambda e: self.start_live())
        
        ttk.Button(lf_cam, text="🎯 Trigger Focus", command=self.trigger_focus).pack(fill=tk.X, pady=5)

        # Image Control Group
        lf_img = ttk.LabelFrame(sb, text="Enhancements", padding=10)
        lf_img.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Checkbutton(lf_img, text="Live Crop Guide (Green)", variable=self.auto_crop).pack(anchor="w")
        
        ttk.Label(lf_img, text="Brightness").pack(anchor="w", pady=(10,0))
        tk.Scale(lf_img, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.live_brightness, bg=COLORS["panel"], fg="white", highlightthickness=0).pack(fill=tk.X)
                 
        ttk.Label(lf_img, text="Contrast").pack(anchor="w", pady=(5,0))
        tk.Scale(lf_img, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.live_contrast, bg=COLORS["panel"], fg="white", highlightthickness=0).pack(fill=tk.X)

        self.size_lbl = ttk.Label(sb, text="PDF Size: 0.0 MB", font=("Segoe UI", 10, "bold"))
        self.size_lbl.pack(pady=5)

        self.list_frame = tk.Frame(sb, bg="#111")
        self.list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)

        ttk.Button(sb, text="UPLOAD PDF", style="Accent.TButton", command=self.upload).pack(fill=tk.X, padx=15, pady=20)

        # Center
        cnt = tk.Frame(self.root, bg="black")
        cnt.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Upper Toolbar
        top_bar = tk.Frame(cnt, bg=COLORS["panel"], height=40)
        top_bar.pack(side=tk.TOP, fill=tk.X)
        top_bar.pack_propagate(False)

        # Color Modes
        for m in ["Color", "Gray", "B&W"]:
            tk.Radiobutton(top_bar, text=m, variable=self.color_mode, value=m, 
                          bg=COLORS["panel"], fg="white", selectcolor="#444", font=("Arial", 9)).pack(side=tk.LEFT, padx=5)

        tk.Frame(top_bar, width=2, bg=COLORS["border"]).pack(side=tk.LEFT, fill=tk.Y, padx=10)

        self.btn_rot = tk.Button(top_bar, text="⟳ Rot", command=self.rotate_live, bg=COLORS["panel"], fg="white", bd=0, font=("Arial", 9))
        self.btn_rot.pack(side=tk.LEFT, padx=5)

        self.btn_fit = tk.Button(top_bar, text="⛶ Fit", command=self.toggle_fit, bg=COLORS["panel"], fg="white", bd=0, font=("Arial", 9))
        self.btn_fit.pack(side=tk.LEFT, padx=5)

        tk.Frame(top_bar, width=2, bg=COLORS["border"]).pack(side=tk.LEFT, fill=tk.Y, padx=10)

        self.btn_focus = tk.Button(top_bar, text="🎯 AF: ON", command=self.toggle_focus, bg=COLORS["panel"], fg="white", bd=0, font=("Segoe UI", 9))
        self.btn_focus.pack(side=tk.LEFT, padx=5)

        self.btn_light = tk.Button(top_bar, text="💡 Light", command=self.toggle_light, bg=COLORS["panel"], fg="white", bd=0, font=("Segoe UI", 9))
        self.btn_light.pack(side=tk.LEFT, padx=5)

        self.btn_restart = tk.Button(top_bar, text="Full Restart", bg=COLORS["danger"], fg="white", bd=0, font=("Segoe UI", 9, "bold"), command=self.restart_app)
        self.btn_restart.pack(side=tk.RIGHT, padx=10)

        self.canvas = tk.Canvas(cnt, bg="black", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        btn_cap = tk.Button(cnt, text="CAPTURE (Space)", bg="white", fg="black", font=("Arial", 14, "bold"), command=self.capture, height=2, width=20)
        btn_cap.place(relx=0.5, rely=0.9, anchor=tk.CENTER)
        
        self.root.bind("<space>", lambda e: self.capture())
        self.root.bind("<Escape>", lambda e: self.restart_app())
        self.root.bind("<Return>", lambda e: self.upload())

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
            # 1. Rotation
            if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
            elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
            elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
            
            # 2. Adjustments & Color Mode (Merged)
            frame = ImageProcessor.adjust_cv2(frame, self.live_brightness.get(), self.live_contrast.get(), self.color_mode.get())
            
            # 3. Live Guide - RESTORED BUT OPTIONAL
            if self.auto_crop.get():
                approx = ImageProcessor.get_document_rect(frame)
                if approx is not None:
                    cv2.drawContours(frame, [approx], -1, (0, 255, 0), 4)

            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
            if cw > 10:
                img_w, img_h = img.size
                if self.view_mode == "raw":
                    # Raw mode: show center portion
                    if img_w > cw or img_h > ch:
                        left = max(0, (img_w - cw) // 2)
                        top = max(0, (img_h - ch) // 2)
                        img = img.crop((left, top, left + cw, top + ch))
                else:
                    # Fit mode: aspect-ratio scaling
                    ratio = min(cw/img_w, ch/img_h)
                    img = img.resize((int(img_w*ratio), int(img_h*ratio)), Image.Resampling.LANCZOS)
                
                self.photo = ImageTk.PhotoImage(img)
                self.canvas.delete("all")
                self.canvas.create_image(cw//2, ch//2, image=self.photo)
        
        self.root.after(30, self.loop)

    def rotate_live(self):
        self.live_rotation = (self.live_rotation + 90) % 360

    def toggle_fit(self):
        self.view_mode = "raw" if self.view_mode == "fit" else "fit"

    def toggle_focus(self):
        self.is_autofocus = not self.is_autofocus
        if not self.is_autofocus:
            if self.camera.cap: self.camera.cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
        else:
            if self.camera.cap: self.camera.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        self.btn_focus.config(text=f"🎯 AF: {'ON' if self.is_autofocus else 'OFF'}")

    def trigger_focus(self):
        if self.camera.trigger_focus():
            orig_bg = self.canvas.cget("bg")
            self.canvas.configure(bg="#222")
            self.root.after(200, lambda: self.canvas.configure(bg=orig_bg))

    def toggle_light(self):
        self.light_level = (self.light_level + 1) % 4
        self.camera.set_light(self.light_level)
        levels = ["Off", "Low", "Med", "High"]
        self.btn_light.config(text=f"💡 {levels[self.light_level]}")

    def restart_app(self):
        self.camera.stop()
        os.execl(sys.executable, sys.executable, *sys.argv)

    def capture(self):
        ret, frame = self.camera.get_frame()
        if not ret: return
        
        # Internal processing based on live settings
        if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
        elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        
        if self.auto_crop.get():
            approx = ImageProcessor.get_document_rect(frame)
            if approx is not None:
                # Use Perspective Transform for professional straighten
                frame = ImageProcessor.transform_quad(frame, approx)
        
        # Apply enhancements (Mode + Brightness + Contrast)
        frame = ImageProcessor.adjust_cv2(frame, self.live_brightness.get(), self.live_contrast.get(), self.color_mode.get())
        
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # Aggressive internal compression for 16MP images
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=55, optimize=True)
        # Store as bytes for accurate size tracking and persistence
        self.captured_images.append(buf.getvalue())
        self.refresh_sidebar()

    def refresh_sidebar(self):
        for w in self.list_frame.winfo_children(): w.destroy()
        total_bytes = 0
        for i, img_data in enumerate(self.captured_images):
            total_bytes += len(img_data)
            
            row = tk.Frame(self.list_frame, bg=COLORS["panel"])
            row.pack(fill=tk.X, pady=2)
            
            img = Image.open(BytesIO(img_data))
            thumb = img.copy()
            thumb.thumbnail((60, 60))
            ph = ImageTk.PhotoImage(thumb)
            l = tk.Label(row, image=ph, bg="black")
            l.image = ph
            l.pack(side=tk.LEFT)
            
            tk.Label(row, text=f"P{i+1}", fg="white", bg=COLORS["panel"], font=("Arial", 8)).pack(side=tk.LEFT, padx=5)
            
            tk.Button(row, text="✕", fg="#ff4444", bg=COLORS["panel"], bd=0, command=lambda idx=i: self.delete(idx)).pack(side=tk.RIGHT, padx=2)
            tk.Button(row, text="✏️", fg="white", bg=COLORS["panel"], bd=0, command=lambda idx=i: self.edit(idx)).pack(side=tk.RIGHT, padx=2)
            
        self.size_lbl.config(text=f"PDF Size: ~{total_bytes / (1024*1024):.1f} MB")

    def delete(self, idx):
        del self.captured_images[idx]
        self.refresh_sidebar()

    def edit(self, idx):
        img = Image.open(BytesIO(self.captured_images[idx]))
        EditorWindow(self.root, img, lambda new_img: self.update_img(idx, new_img))

    def update_img(self, idx, img):
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=55, optimize=True)
        self.captured_images[idx] = buf.getvalue()
        self.refresh_sidebar()

    def upload(self):
        if not self.captured_images: return
        threading.Thread(target=self._upload_worker, daemon=True).start()

    def _upload_worker(self):
        try:
            buf = BytesIO()
            # Convert stored byte images back to PIL for PDF assembly
            pil_images = [Image.open(BytesIO(data)) for data in self.captured_images]
            
            # High compression for the PDF to ensure fast transmission
            pil_images[0].save(buf, format="PDF", save_all=True, append_images=pil_images[1:], quality=45, optimize=True)
            buf.seek(0)
            
            url = f"{self.api_url}/patients/{self.patient_id}/upload"
            headers = {'Authorization': f"Bearer {self.token}"}
            
            response = requests.post(url, headers=headers, files={'file': ('scan.pdf', buf)}, timeout=60)
            if response.status_code in [200, 201]:
                messagebox.showinfo("Success", "Professional Scan Uploaded Successfully")
                self.captured_images = []
                self.root.after(0, self.refresh_sidebar)
                self.root.after(0, self.root.destroy)
            else:
                messagebox.showerror("Error", f"Upload failed: {response.text}")
        except Exception as e:
            messagebox.showerror("Error", str(e))

if __name__ == "__main__":
    try: ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except: pass
    root = tk.Tk()
    ScannerApp(root, sys.argv)
    root.mainloop()