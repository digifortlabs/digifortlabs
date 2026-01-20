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
import queue
import logging
import numpy as np
from collections import deque
from typing import List, Optional, Tuple, Any

# =============================================================================
# CONFIGURATION & LOGGING
# =============================================================================

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DigifortScanner")

# Enable GPU Acceleration via OpenCL (Transparent API)
try:
    cv2.ocl.setUseOpenCL(True)
    if cv2.ocl.useOpenCL():
        logger.info(f"OpenCL Acceleration Enabled: {cv2.ocl.getDeviceName()}")
    else:
        logger.warning("OpenCL Acceleration Failed or Not Available")
except Exception as e:
    logger.warning(f"Failed to enable OpenCL: {e}")

COLORS = {
    "bg": "#f8f9fa",            # Light Grey/White Background
    "panel": "#ffffff",         # Pure White Panels
    "fg": "#1e293b",            # Slate 800 Text (Dark Blue-Grey)
    "accent": "#0ea5e9",        # Sky 500 (Medical Blue)
    "accent_hover": "#0284c7",  # Sky 600
    "border": "#e2e8f0",        # Slate 200
    "danger": "#ef4444",        # Red 500
    "success": "#22c55e"        # Green 500
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
        """Advanced document detection using OpenCV - optimized for speed (480p processing)"""
        try:
            # OPTIMIZATION: Downscale to 480p for ultra-fast detection (approx 10-30ms)
            h, w = frame.shape[:2]
            target_width = 480 
            scale = 1.0
            
            if w > target_width:
                scale = target_width / float(w)
                # Use INTER_NEAREST for speed during detection downscale
                small_frame = cv2.resize(frame, (target_width, int(h * scale)), interpolation=cv2.INTER_NEAREST)
            else:
                small_frame = frame

            # 1. Preprocessing (Fast Gaussian)
            gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)
            # Reduced blur kernel for smaller image
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # 2. Brightness-Based Detection
            ret, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # 3. Morphological Closing
            # Reduced kernel size to match 480p scale (was 21x21 for 1280p)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            
            # Erode slightly to remove noise
            erosion_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            closed = cv2.erode(closed, erosion_kernel, iterations=1)
            
            # 4. Contour Detection
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                return None
                
            # Sort by area and check the largest ones
            contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
            
            small_area = small_frame.shape[0] * small_frame.shape[1]
            
            found_approx = None
            
            for contour in contours:
                area = cv2.contourArea(contour)
                # Must be at least 15% of the frame to be a document
                if area < (small_area * 0.15):
                    continue
                
                # Approximate the contour to a polygon
                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.015 * peri, True)
                
                # If we found a quadrilateral, that's likely our document
                if len(approx) == 4:
                    found_approx = approx
                    break
                
                # If between 4 and 10 points, try to get the bounding box as fallback
                if 4 <= len(approx) <= 10:
                    x, y, bw, bh = cv2.boundingRect(contour)
                    if (bw * bh) > (small_area * 0.2):
                        # reshape to (4, 1, 2) to match approxPolyDP shape for consistent averaging
                        found_approx = np.array([[[x, y]], [[x+bw, y]], [[x+bw, y+bh]], [[x, y+bh]]], dtype=np.int32)
                        break

                
            # Scale back up to original resolution
            if found_approx is not None:
                if scale != 1.0:
                    found_approx = (found_approx.astype(float) / scale).astype(np.int32)
                
                # EXPAND: Add 2% padding per user request
                found_approx = ImageProcessor.scale_contour(found_approx, 1.02, h, w)

            return found_approx
        except:
            return None

    @staticmethod
    def scale_contour(cnt, scale, max_h, max_w):
        """Expands the contour from its center by scale factor"""
        try:
            M = cv2.moments(cnt)
            if M['m00'] == 0: return cnt
            
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])

            cnt_norm = cnt - [cx, cy]
            cnt_scaled = cnt_norm * scale
            cnt_final = cnt_scaled + [cx, cy]
            
            # Clamp to image bounds
            cnt_final = np.clip(cnt_final, 0, [max_w, max_h])
            
            return cnt_final.astype(np.int32)
        except:
            return cnt
            


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
    def __init__(self, parent, image_path, callback):
        super().__init__(parent)
        self.title(f"Editor - {os.path.basename(image_path)}")
        self.state('zoomed')
        self.configure(bg=COLORS["bg"])
        
        self.image_path = image_path
        self.callback = callback
        
        # Load from disk
        self.original = Image.open(self.image_path)
        if self.original.mode != 'RGB': self.original = self.original.convert('RGB')
        
        self.current = self.original.copy()
        
        self.brightness = tk.DoubleVar(value=1.0)
        self.contrast = tk.DoubleVar(value=1.0)
        self.mode = tk.StringVar(value="Color")
        self.rotation = 0
        
        self.crop_mode = False
        self.crop_points = [] # [(x,y), ...] in CANVAS coordinates
        self.selected_point = None
        self.active_image_rect = None # (x, y, w, h) of the image on canvas
        
        # Threaded Detection
        self.last_detection = None
        self.detection_busy = False
        
        self.setup_ui()
        # Delay initial preview to allow window to size
        self.after(100, self.update_preview)

    def setup_ui(self):
        # Toolbar (Left)
        tools = tk.Frame(self, width=300, bg=COLORS["panel"], highlightthickness=1, highlightbackground=COLORS["border"])
        tools.pack(side=tk.LEFT, fill=tk.Y)
        tools.pack_propagate(False)

        tk.Label(tools, text="IMAGE EDITOR", fg=COLORS["fg"], bg=COLORS["panel"], font=("Segoe UI", 12, "bold")).pack(pady=20)
        
        # Controls
        self.ctrl_frame = tk.Frame(tools, bg=COLORS["panel"], padx=15)
        self.ctrl_frame.pack(fill=tk.X)

        tk.Label(self.ctrl_frame, text="Brightness", fg=COLORS["fg"], bg=COLORS["panel"]).pack(anchor="w")
        tk.Scale(self.ctrl_frame, from_=0.5, to=1.5, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.brightness, command=lambda x: self.update_preview(), 
                 bg=COLORS["panel"], highlightthickness=0, troughcolor=COLORS["border"]).pack(fill=tk.X, pady=(0, 15))
        
        tk.Label(self.ctrl_frame, text="Contrast", fg=COLORS["fg"], bg=COLORS["panel"]).pack(anchor="w")
        tk.Scale(self.ctrl_frame, from_=0.5, to=1.5, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.contrast, command=lambda x: self.update_preview(), 
                 bg=COLORS["panel"], highlightthickness=0, troughcolor=COLORS["border"]).pack(fill=tk.X, pady=(0, 15))

        tk.Label(self.ctrl_frame, text="Color Mode", fg=COLORS["fg"], bg=COLORS["panel"]).pack(anchor="w")
        for m in ["Color", "Gray", "B&W"]:
            tk.Radiobutton(self.ctrl_frame, text=m, variable=self.mode, value=m, 
                          command=self.update_preview, bg=COLORS["panel"], fg=COLORS["fg"], selectcolor=COLORS["bg"]).pack(anchor="w", pady=2)

        ttk.Separator(tools, orient='horizontal').pack(fill=tk.X, pady=20, padx=15)

        self.btn_rot_r = tk.Button(tools, text="Rotate Right ⟳", command=lambda: self.rotate(90),
                 bg=COLORS["bg"], fg=COLORS["fg"], bd=1, relief="solid")
        self.btn_rot_r.pack(fill=tk.X, padx=20, pady=5)
                 
        self.btn_rot_l = tk.Button(tools, text="Rotate Left ⟲", command=lambda: self.rotate(-90),
                 bg=COLORS["bg"], fg=COLORS["fg"], bd=1, relief="solid")
        self.btn_rot_l.pack(fill=tk.X, padx=20, pady=5)
        
        # CROP BUTTON
        ttk.Separator(tools, orient='horizontal').pack(fill=tk.X, pady=20, padx=15)
        self.btn_crop = tk.Button(tools, text="✂ Manual Crop", command=self.toggle_crop,
                 bg=COLORS["accent"], fg="white", bd=0, font=("Segoe UI", 10))
        self.btn_crop.pack(fill=tk.X, padx=20, pady=5)

        # Save Actions
        tk.Button(tools, text="✔ SAVE CHANGES", bg=COLORS["success"], fg="white", 
                 font=("Segoe UI", 10, "bold"), bd=0, padx=10, pady=10,
                 command=self.save).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=10)
                 
        tk.Button(tools, text="✕ CANCEL", bg=COLORS["danger"], fg="white", 
                 font=("Segoe UI", 10, "bold"), bd=0, padx=10, pady=10,
                 command=self.destroy).pack(side=tk.BOTTOM, fill=tk.X, padx=20, pady=(0, 5))

        # Preview Area
        self.canvas = tk.Canvas(self, bg=COLORS["bg"], highlightthickness=0, cursor="crosshair")
        self.canvas.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        self.canvas.bind("<Configure>", lambda e: self.update_preview())
        
        # Mouse Bindings for Cropping
        self.canvas.bind("<ButtonPress-1>", self.on_canvas_click)
        self.canvas.bind("<B1-Motion>", self.on_canvas_drag)
        self.canvas.bind("<ButtonRelease-1>", self.on_canvas_release)

    def rotate(self, angle):
        if self.crop_mode: return
        self.rotation = (self.rotation + angle) % 360
        self.update_preview()

    def update_preview(self, event=None):
        if not self.original: return
        
        # Apply transforms logic
        # 1. Rotate
        img = self.original.rotate(-self.rotation, expand=True) if self.rotation != 0 else self.original.copy()
        
        # 2. Filters
        if not self.crop_mode: # Don't filter during crop for performance
            img = ImageProcessor.apply_pil_filters(img, self.mode.get(), self.brightness.get(), self.contrast.get())
        
        self.current = img # Update the 'current' state image
        
        # Display
        cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
        if cw < 50: return # Wait for layout
        
        ratio = min(cw/img.width, ch/img.height) * 0.9 # 90% fill
        nw, nh = int(img.width*ratio), int(img.height*ratio)
        
        self.active_image_rect = (cw//2 - nw//2, ch//2 - nh//2, nw, nh)
        
        if nw > 0 and nh > 0:
            disp = img.resize((nw, nh), Image.Resampling.NEAREST)
            self.photo = ImageTk.PhotoImage(disp)
            self.canvas.delete("all")
            self.canvas.create_image(cw//2, ch//2, image=self.photo, anchor=tk.CENTER)
            
            # Draw Crop Overlay if active
            if self.crop_mode and self.crop_points:
                # Helper to draw lines
                pts = self.crop_points + [self.crop_points[0]] # Close loop
                for i in range(len(pts)-1):
                    self.canvas.create_line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], fill=COLORS["accent"], width=2, tags="crop_ui")
                
                # Draw handles
                for i, (px, py) in enumerate(self.crop_points):
                    color = "red" if i == self.selected_point else COLORS["accent"]
                    self.canvas.create_oval(px-6, py-6, px+6, py+6, fill=color, outline="white", width=2, tags="crop_ui")

    def toggle_crop(self):
        if not self.crop_mode:
            # Start Crop Mode
            self.crop_mode = True
            self.btn_crop.config(text="✓ Apply Crop", bg=COLORS["success"])
            
            # Disable other controls
            # (Optional: disable buttons)
            
            # Initialize points: Corners of the image on canvas
            x, y, w, h = self.active_image_rect
            # Safety checks
            if w < 10: return 
            
            # Default to full image corners inset slightly
            self.crop_points = [
                (x, y),         # TL
                (x+w, y),       # TR
                (x+w, y+h),     # BR
                (x, y+h)        # BL
            ]
            self.update_preview()
            
        else:
            # Apply Crop
            self.apply_crop()
            self.crop_mode = False
            self.btn_crop.config(text="✂ Manual Crop", bg=COLORS["accent"])
            self.update_preview()

    def on_canvas_click(self, event):
        if not self.crop_mode or not self.crop_points: return
        
        # Check if clicking near a point
        x, y = event.x, event.y
        best_dist = 20 # Hit radius
        best_idx = None
        
        for i, (px, py) in enumerate(self.crop_points):
            dist = ((px-x)**2 + (py-y)**2)**0.5
            if dist < best_dist:
                best_dist = dist
                best_idx = i
        
        self.selected_point = best_idx
        if best_idx is not None:
            self.update_preview()

    def on_canvas_drag(self, event):
        if not self.crop_mode or self.selected_point is None: return
        
        # Update point position
        # Clamp to image rect? Optional, but user might want to drag outside slightly
        self.crop_points[self.selected_point] = (event.x, event.y)
        self.update_preview()

    def on_canvas_release(self, event):
        self.selected_point = None
        if self.crop_mode: self.update_preview()

    def apply_crop(self):
        # Convert canvas points -> Original Image coordinates
        if not self.active_image_rect: return
        
        ax, ay, aw, ah = self.active_image_rect
        orig_w, orig_h = self.current.size
        
        # Scale factor
        scale_x = orig_w / aw
        scale_y = orig_h / ah
        
        # Map points
        real_points = []
        for (cx, cy) in self.crop_points:
            rx = (cx - ax) * scale_x
            ry = (cy - ay) * scale_y
            real_points.append([rx, ry])
            
        real_points = np.array(real_points, dtype=np.float32)
        
        # Perform Perspective Transform using OpenCV
        # Ensure points are ordered TL, TR, BR, BL? They should be since we inited them that way and user drags them.
        # But we can reorder to be safe or assume user keeps them topological.
        
        # Convert PIL to CV2
        img_cv = cv2.cvtColor(np.array(self.current), cv2.COLOR_RGB2BGR)
        
        # Use ImageProcessor logic
        warped = ImageProcessor.transform_quad(img_cv, real_points)
        
        # Update self.original to the cropped version so further edits apply to this
        self.original = Image.fromarray(cv2.cvtColor(warped, cv2.COLOR_BGR2RGB))
        self.current = self.original.copy()
        
        # Reset rotation since we warped
        self.rotation = 0

    def save(self):
        # Overwrite the file on disk
        try:
            self.current.save(self.image_path, quality=65, optimize=True)
            self.callback() # Signal parent to refresh
            self.destroy()
        except Exception as e:
            messagebox.showerror("Error Saving", str(e))

# =============================================================================
# MAIN SCANNER APP
# =============================================================================
import os
import tempfile
import shutil
import time
import glob

class ScannerApp:
    def __init__(self, root, args):
        self.root = root
        self.root.title("Digifort Medical Scanner") # Updated Title
        self.root.geometry("1400x900")
        self.root.state('zoomed')
        self.root.configure(bg=COLORS["bg"])

        # Set Window Icon
        try:
            icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icon.ico")
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
        except: pass
        
        # Disk-Based Storage (Unlimited Scanning)
        self.session_id = f"scan_session_{int(time.time())}"
        self.session_dir = os.path.join(tempfile.gettempdir(), "digifort_scanner", self.session_id)
        os.makedirs(self.session_dir, exist_ok=True)
        print(f"Session Directory: {self.session_dir}")
        
        self.image_paths = [] # List of absolute paths to saved JPEGs
        self.current_images = [] # Keeps track of valid images (paths)
        
        self.args = args
        self.camera = CameraManager()
        self.captured_images = [] # Deprecated: Used only for backward compat if needed, but we switch to self.image_paths
        
        self.auto_crop = tk.BooleanVar(value=True)
        self.view_mode = "fit"
        self.live_rotation = 180
        self.light_level = 0
        self.light_level = 0
        self.is_autofocus = True
        
        # Stabilization History
        self.rect_history = deque(maxlen=3)
        
        # --- FIX: Define params before usage ---
        params = self.parse_args(args)
        
        self.token = params.get('token', '')
        self.patient_id = params.get('patient_id', 'demo')
        self.api_url = params.get('api_url', 'http://localhost:8000')
        
        self.live_brightness = tk.DoubleVar(value=1.0)
        self.live_contrast = tk.DoubleVar(value=1.0)
        self.color_mode = tk.StringVar(value="Color")

        # Threaded Detection Queues (Prevent UI Freeze)
        self.detect_queue = queue.Queue(maxsize=1)
        self.detect_result = queue.Queue()
        self.frame_count = 0
        threading.Thread(target=self._detection_worker, daemon=True).start()

        self.setup_ui()
        
        # Async Camera Discovery (Fixes Slow Startup)
        self.cb_cam.set("Searching for cameras...")
        self.cb_cam['state'] = 'disabled'
        threading.Thread(target=self.discover_cameras, daemon=True).start()

    def discover_cameras(self):
        cams = self.camera.get_available_cameras()
        # Schedule UI update on main thread
        self.root.after(0, lambda: self.on_cameras_found(cams))

    def on_cameras_found(self, cams):
        self.cb_cam['state'] = 'readonly'
        if cams:
            self.cb_cam['values'] = [f"Camera {i}" for i in cams]
            self.cb_cam.current(0)
            self.start_live()
        else:
            self.cb_cam.set("No cameras found")

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
        
        # Medical Theme Styles
        s.configure(".", background=COLORS["bg"], foreground=COLORS["fg"])
        s.configure("TLabel", background=COLORS["bg"], foreground=COLORS["fg"], font=("Segoe UI", 9))
        s.configure("TCombobox", fieldbackground="#ffffff", background=COLORS["panel"])
        s.configure("Accent.TButton", background=COLORS["accent"], foreground="white", font=("Segoe UI", 10, "bold"), borderwidth=0)
        s.map("Accent.TButton", background=[("active", COLORS["accent_hover"])])
        
        s.configure("Danger.TButton", background=COLORS["danger"], foreground="white", font=("Segoe UI", 9, "bold"))
        
        # =====================================================================
        # LAYOUT: LEFT SIDEBAR | CENTER PREVIEW | BOTTOM FOOTER
        # =====================================================================
        
        # --- LEFT SIDEBAR (Settings & Pages) ---
        sb = tk.Frame(self.root, width=320, bg=COLORS["panel"], highlightthickness=1, highlightbackground=COLORS["border"])
        sb.pack(side=tk.LEFT, fill=tk.Y)
        sb.pack_propagate(False)

        # Header
        tk.Label(sb, text="DIGIFORT SCANNER", font=("Segoe UI", 14, "bold"), 
                 bg=COLORS["accent"], fg="white", pady=15).pack(fill=tk.X)
        
        # Settings Container
        settings_frame = tk.Frame(sb, bg=COLORS["panel"], padx=10, pady=10)
        settings_frame.pack(fill=tk.X)
        
        # Camera Select
        ttk.Label(settings_frame, text="Camera Source", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        self.cb_cam = ttk.Combobox(settings_frame, state="readonly")
        self.cb_cam.pack(fill=tk.X, pady=(2, 10))
        self.cb_cam.bind("<<ComboboxSelected>>", lambda e: self.start_live())

        # Resolution
        # ttk.Label(settings_frame, text="Resolution", font=("Segoe UI", 9, "bold")).pack(anchor="w")
        self.cb_res = ttk.Combobox(settings_frame, values=["16MP (4:3)", "4K (16:9)", "1080p"], state="readonly")
        self.cb_res.current(0)
        self.cb_res.pack(fill=tk.X, pady=(0, 10))
        self.cb_res.bind("<<ComboboxSelected>>", lambda e: self.start_live())
        
        ttk.Button(settings_frame, text="🎯 Trigger Focus", command=self.trigger_focus).pack(fill=tk.X)

        ttk.Separator(settings_frame, orient='horizontal').pack(fill=tk.X, pady=15)

        # Enhancements
        ttk.Label(settings_frame, text="Enhancements", font=("Segoe UI", 9, "bold")).pack(anchor="w", pady=(0, 5))
        
        ttk.Checkbutton(settings_frame, text="Live Crop Guide", variable=self.auto_crop).pack(anchor="w")
        
        tk.Label(settings_frame, text="Brightness", bg=COLORS["panel"], fg=COLORS["fg"]).pack(anchor="w", pady=(5,0))
        tk.Scale(settings_frame, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.live_brightness, bg=COLORS["panel"], highlightthickness=0, troughcolor=COLORS["border"]).pack(fill=tk.X)
                 
        tk.Label(settings_frame, text="Contrast", bg=COLORS["panel"], fg=COLORS["fg"]).pack(anchor="w")
        tk.Scale(settings_frame, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.live_contrast, bg=COLORS["panel"], highlightthickness=0, troughcolor=COLORS["border"]).pack(fill=tk.X)

        # Pages List Header
        list_header = tk.Frame(sb, bg=COLORS["accent"], height=30)
        list_header.pack(fill=tk.X, pady=(10, 0))
        tk.Label(list_header, text="SCANNED PAGES", bg=COLORS["accent"], fg="white", font=("Segoe UI", 9, "bold")).pack(pady=5)
        
        self.size_lbl = tk.Label(sb, text="Total: 0.0 MB", bg=COLORS["panel"], fg="#666", font=("Segoe UI", 8))
        self.size_lbl.pack(pady=(2, 5))

        # Scrollable Thumbnail List
        self.list_container = tk.Frame(sb, bg=COLORS["panel"])
        self.list_container.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.canvas_list = tk.Canvas(self.list_container, bg=COLORS["panel"], highlightthickness=0)
        self.scrollbar_list = ttk.Scrollbar(self.list_container, orient="vertical", command=self.canvas_list.yview)
        self.list_frame = tk.Frame(self.canvas_list, bg=COLORS["panel"])
        
        self.list_frame.bind(
            "<Configure>",
            lambda e: self.canvas_list.configure(scrollregion=self.canvas_list.bbox("all"))
        )
        
        self.canvas_window = self.canvas_list.create_window((0, 0), window=self.list_frame, anchor="nw")
        self.canvas_list.bind("<Configure>", lambda e: self.canvas_list.itemconfig(self.canvas_window, width=e.width))
        self.canvas_list.configure(yscrollcommand=self.scrollbar_list.set)
        
        self.canvas_list.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.scrollbar_list.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Bind Mousewheel
        def _on_mousewheel(event):
            self.canvas_list.yview_scroll(int(-1*(event.delta/120)), "units")
        self.canvas_list.bind_all("<MouseWheel>", _on_mousewheel)

        ttk.Button(sb, text="UPLOAD ALL PAGES", style="Accent.TButton", command=self.upload).pack(fill=tk.X, padx=15, pady=20)

        # --- CENTER \ BOTTOM LAYOUT ---
        right_panel = tk.Frame(self.root, bg=COLORS["bg"])
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Toolbar (Top)
        top_bar = tk.Frame(right_panel, bg="white", height=50, padx=10)
        top_bar.pack(side=tk.TOP, fill=tk.X)
        
        # Color Modes
        tk.Label(top_bar, text="Mode:", bg="white", fg="#888").pack(side=tk.LEFT, padx=(0, 5))
        for m in ["Color", "Gray", "B&W"]:
            tk.Radiobutton(top_bar, text=m, variable=self.color_mode, value=m, 
                          bg="white", fg=COLORS["fg"], selectcolor="#e6f7ff", font=("Segoe UI", 9)).pack(side=tk.LEFT, padx=5)

        tk.Frame(top_bar, width=1, bg=COLORS["border"]).pack(side=tk.LEFT, fill=tk.Y, padx=15, pady=10)

        tk.Button(top_bar, text="⟳ Rotate", command=self.rotate_live, bg="white", bd=1, relief="solid", fg=COLORS["fg"]).pack(side=tk.LEFT, padx=5)
        tk.Button(top_bar, text="⛶ Fit/Fill", command=self.toggle_fit, bg="white", bd=1, relief="solid", fg=COLORS["fg"]).pack(side=tk.LEFT, padx=5)
        
        tk.Frame(top_bar, width=1, bg=COLORS["border"]).pack(side=tk.LEFT, fill=tk.Y, padx=15, pady=10)
        
        self.btn_focus = tk.Button(top_bar, text="🎯 AF: ON", command=self.toggle_focus, bg="white", bd=1, relief="solid").pack(side=tk.LEFT, padx=5)
        self.btn_light = tk.Button(top_bar, text="💡 Light", command=self.toggle_light, bg="white", bd=1, relief="solid").pack(side=tk.LEFT, padx=5)

        # Main Canvas (Preview)
        self.canvas = tk.Canvas(right_panel, bg="#333", highlightthickness=0) # Grey background for contrast with paper
        self.canvas.pack(fill=tk.BOTH, expand=True)
        
        # --- FOOTER BAR (Capture Button) ---
        footer = tk.Frame(right_panel, bg="white", height=80, padx=20, pady=10)
        footer.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Center the Capture Button
        btn_container = tk.Frame(footer, bg="white")
        btn_container.pack(side=tk.TOP, fill=tk.Y)
        
        self.btn_cap = tk.Button(btn_container, text="CAPTURE PAGE (Space)", 
                                 bg=COLORS["accent"], fg="white", 
                                 font=("Segoe UI", 12, "bold"), 
                                 command=self.capture, 
                                 relief="flat", padx=30, pady=10)
        self.btn_cap.pack(side=tk.LEFT, padx=20)
        
        
        # Keybinds
        self.root.bind("<space>", lambda e: self.capture())
        self.root.bind("<Escape>", lambda e: self.restart_app())
        self.root.bind("<Return>", lambda e: self.upload())

    def loop(self):
        if self.camera.is_running:
            try:
                ret, frame = self.camera.get_frame()
                if ret:
                    # FPS Throttled processing logic ... (Keep existing optimization)
                    if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                    elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
                    elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
                    
                    # Store original frame for capture
                    self.current_frame = frame.copy()
                    
                    # Process for Preview (Resize for speed)
                    # ... (Display Logic)
                    
                    # 1. Resize for UI Performance
                    h, w = frame.shape[:2]
                    # Calculate new size to fit canvas, maintaining aspect ratio
                    canvas_w = self.canvas.winfo_width()
                    canvas_h = self.canvas.winfo_height()
                        
                    if canvas_w > 1 and canvas_h > 1:
                        scale = min(canvas_w/w, canvas_h/h)
                        # If "Fill" mode, use max scale
                        if self.view_mode == "fill":
                            scale = max(canvas_w/w, canvas_h/h)
                            
                        new_w, new_h = int(w*scale), int(h*scale)
                        
                        # Only resize if necessary (optimization)
                        if new_w != w or new_h != h:
                            frame_small = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_NEAREST)
                        else:
                            frame_small = frame
                            
                        # Detection (Stabilized)
                        # Skip Frames for Detection to save CPU
                        self.frame_count += 1
                        if self.frame_count % 5 == 0 and self.auto_crop.get():
                            # Detect on smaller frame for speed? No, detect on original then scale?
                            # Actually better to detect on medium size (width=800) for consistency
                            # Using existing logic:
                            approx = ImageProcessor.get_document_rect(frame) # Using full res for accuracy
                            
                            if approx is not None:
                                self.rect_history.append(approx)
                            else:
                                if self.rect_history: self.rect_history.popleft()
                        
                        # Draw Stabilization
                        if len(self.rect_history) > 0:
                            try:
                                avg_approx = np.mean(self.rect_history, axis=0).astype(np.int32)
                                # Scale avg_approx to preview size
                                # Since get_document_rect uses internal scaling (800w), and returns 800w coords,
                                # We need to know get_document_rect's output scale. 
                                # Wait, get_document_rect scales input to 800, finds contours, then SCALES BACK UP to input size.
                                # So avg_approx is in 'frame' coordinates.
                                # We need to scale it to 'frame_small' coordinates.
                                
                                scale_x = new_w / w
                                scale_y = new_h / h
                                
                                # Draw on frame_small
                                # We need to reshape for transformation
                                pts = avg_approx.reshape(-1, 2)
                                pts_small = pts * [scale_x, scale_y]
                                pts_small = pts_small.astype(np.int32)
                                
                                cv2.polylines(frame_small, [pts_small], True, (0, 255, 0), 2)
                            except: pass

                        # Convert to ImageTk
                        frame_small = ImageProcessor.adjust_cv2(frame_small, self.live_brightness.get(), self.live_contrast.get(), self.color_mode.get())
                        frame_small = cv2.cvtColor(frame_small, cv2.COLOR_BGR2RGB)
                        img = Image.fromarray(frame_small)
                        imgtk = ImageTk.PhotoImage(image=img)
                        self.canvas.create_image(canvas_w//2, canvas_h//2, image=imgtk, anchor=tk.CENTER)
                        self.canvas.image = imgtk

            except Exception as e:
                pass
                
        self.root.after(15, self.loop)

    def start_live(self):
        idx = int(self.cb_cam.get().split()[-1]) if self.cb_cam.get() else 0
        res = self.cb_res.get()
        w, h = (4608, 3456) if "4:3" in res else (3840, 2160) if "4K" in res else (1920, 1080)
        
        if self.camera.start(idx, w, h):
            self.loop()

    def loop(self):
        if not self.camera.is_running: 
            self.root.after(30, self.loop)
            return

        ret, frame = self.camera.get_frame()
        if ret:
            # 1. Rotation (Use OpenCL UMat if possible for rotation, but rotate is fast enough on CPU for 1080p usually)
            if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
            elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
            elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
            
            # 2. Adjustments & Color Mode
            frame = ImageProcessor.adjust_cv2(frame, self.live_brightness.get(), self.live_contrast.get(), self.color_mode.get())
            
            # 3. Live Guide (Optimized & Stabilized)
            # Run detection only every 5 frames to prevent UI freeze
            if self.auto_crop.get():
                if not hasattr(self, 'frame_count'): self.frame_count = 0
                self.frame_count += 1
                
                if self.frame_count % 5 == 0:
                    approx = ImageProcessor.get_document_rect(frame)
                    
                    # Stabilization Logic
                    if approx is not None:
                        self.rect_history.append(approx)
                    else:
                        # Decay: pop one old result if detection fails (prevents infinite stuck)
                        if self.rect_history:
                            self.rect_history.popleft()

                if len(self.rect_history) > 0:
                    try:
                        # Average the points in history
                        avg_approx = np.mean(self.rect_history, axis=0).astype(np.int32)
                        # Draw on the original frame
                        cv2.drawContours(frame, [avg_approx], -1, (0, 255, 0), 4)
                    except: pass # Ignore averaging errors if shapes mismatch momentarily

            # OPTIMIZATION: Resize using OpenCV (much faster than PIL) for display
            cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
            if cw > 10 and ch > 10:
                h, w = frame.shape[:2]
                
                if self.view_mode == "raw":
                    # Raw mode: Center Crop Logic
                    # We can't easily crop raw bytes, but we can crop the numpy array
                    if w > cw or h > ch:
                        left = max(0, (w - cw) // 2)
                        top = max(0, (h - ch) // 2)
                        frame = frame[top:top+ch, left:left+cw]
                else:
                    # Fit mode: Aspect Ratio Resize
                    ratio = min(cw/w, ch/h)
                    new_w, new_h = int(w * ratio), int(h * ratio)
                    # Use Linear for speed in preview
                    frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

                # Convert to RGB and then PIL (only for the already resized small image)
                img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                
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
        try:
            self.camera.stop()
        except: pass
        
        python = sys.executable
        os.execl(python, python, *sys.argv)

    def _detection_worker(self):
        while True:
            try:
                frame = self.detect_queue.get()
                approx = ImageProcessor.get_document_rect(frame)
                self.detect_result.put(approx)
            except Exception as e:
                pass
            
    def capture(self):
        ret, frame = self.camera.get_frame()
        if not ret: return
        
        # Internal processing based on live settings
        if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
        elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
        elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
        
        # Apply Auto Crop if enabled
        if self.auto_crop.get():
            if len(self.rect_history) > 0:
                approx = np.mean(self.rect_history, axis=0).astype(np.int32)
                try:
                    warped = ImageProcessor.transform_quad(frame, approx.reshape(4, 2))
                    frame = warped
                except: pass

        # Apply enhancements (Mode + Brightness + Contrast)
        frame = ImageProcessor.adjust_cv2(frame, self.live_brightness.get(), self.live_contrast.get(), self.color_mode.get())
        
        # Convert to PIL
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        # DISK STORAGE: Save to temp session folder
        filename = f"scan_{int(time.time() * 1000)}.jpg"
        filepath = os.path.join(self.session_dir, filename)
        
        # Save high quality JPEG (Compressed)
        img.save(filepath, format="JPEG", quality=65, optimize=True)
        
        self.image_paths.append(filepath)
        self.refresh_sidebar()

    def loop(self):
        if self.camera.is_running:
            try:
                ret, frame = self.camera.get_frame()
                if ret:
                    # Apply Rotation
                    if self.live_rotation == 90: frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
                    elif self.live_rotation == 180: frame = cv2.rotate(frame, cv2.ROTATE_180)
                    elif self.live_rotation == 270: frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
                    
                    # Apply Brightness/Contrast (CV2)
                    frame = ImageProcessor.adjust_cv2(frame, self.live_brightness.get(), 
                                                    self.live_contrast.get(), self.color_mode.get())
                    
                    # Detection (Threaded)
                    self.frame_count += 1
                    if self.auto_crop.get():
                        # Check for results
                        try:
                            while not self.detect_result.empty():
                                approx = self.detect_result.get_nowait()
                                if approx is not None:
                                    self.rect_history.append(approx)
                                else:
                                    if self.rect_history: self.rect_history.popleft()
                        except: pass
                        
                        # Trigger new detection if queue empty
                        if self.frame_count % 2 == 0 and self.detect_queue.empty():
                             # Use copy for thread safety
                             self.detect_queue.put(frame.copy())

                    if len(self.rect_history) > 0 and self.auto_crop.get():
                        try:
                            avg_approx = np.mean(self.rect_history, axis=0).astype(np.int32)
                            cv2.drawContours(frame, [avg_approx], -1, (0, 255, 0), 2)
                        except: pass

                    # Resize for display
                    cw, ch = self.canvas.winfo_width(), self.canvas.winfo_height()
                    if cw > 10 and ch > 10:
                        h, w = frame.shape[:2]
                        if self.view_mode == "raw": 
                            # Center Crop for Raw View
                            if w > cw or h > ch:
                                left, top = max(0, (w - cw) // 2), max(0, (h - ch) // 2)
                                frame = frame[top:top+ch, left:left+cw]
                        else:
                            # Fit View
                            ratio = min(cw/w, ch/h)
                            new_w, new_h = int(w * ratio), int(h * ratio)
                            frame = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

                        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                        self.photo = ImageTk.PhotoImage(img)
                        self.canvas.delete("all")
                        self.canvas.create_image(cw//2, ch//2, image=self.photo)
            except Exception as e:
                logger.error(f"Loop Error: {e}")
                pass
        
        self.root.after(30, self.loop)

    def refresh_sidebar(self):
        for w in self.list_frame.winfo_children(): w.destroy()
        
        total_size_mb = 0.0
        
        for i, filepath in enumerate(self.image_paths):
            if not os.path.exists(filepath): continue
            
            size_mb = os.path.getsize(filepath) / (1024 * 1024)
            total_size_mb += size_mb
            
            row = tk.Frame(self.list_frame, bg=COLORS["panel"],  highlightthickness=1, highlightbackground=COLORS["border"])
            row.pack(fill=tk.X, pady=2, padx=2)
            
            try:
                img = Image.open(filepath)
                thumb = img.copy()
                thumb.thumbnail((60, 60))
                ph = ImageTk.PhotoImage(thumb)
                
                # Image Label
                l = tk.Label(row, image=ph, bg=COLORS["bg"])
                l.image = ph
                l.pack(side=tk.LEFT, padx=2, pady=2)
                
                # Info Group
                info_frame = tk.Frame(row, bg=COLORS["panel"])
                info_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
                
                tk.Label(info_frame, text=f"Page {i+1}", fg=COLORS["fg"], bg=COLORS["panel"], font=("Segoe UI", 9, "bold")).pack(anchor="w")
                tk.Label(info_frame, text=f"{size_mb:.1f} MB", fg="#64748b", bg=COLORS["panel"], font=("Segoe UI", 8)).pack(anchor="w")

                # Actions
                btn_frame = tk.Frame(row, bg=COLORS["panel"])
                btn_frame.pack(side=tk.RIGHT, padx=5)
                
                # Edit Button
                tk.Button(btn_frame, text="✏️", fg=COLORS["accent"], bg=COLORS["panel"], bd=0, font=("Segoe UI", 10), cursor="hand2",
                         command=lambda idx=i: self.edit(idx)).pack(side=tk.LEFT, padx=1)

                # Up/Down Ordering
                if i > 0:
                    tk.Button(btn_frame, text="↑", fg=COLORS["fg"], bg=COLORS["panel"], bd=0, font=("Segoe UI", 9, "bold"), cursor="hand2",
                             command=lambda idx=i: self.move_up(idx)).pack(side=tk.LEFT, padx=1)
                
                if i < len(self.image_paths) - 1:
                    tk.Button(btn_frame, text="↓", fg=COLORS["fg"], bg=COLORS["panel"], bd=0, font=("Segoe UI", 9, "bold"), cursor="hand2",
                             command=lambda idx=i: self.move_down(idx)).pack(side=tk.LEFT, padx=1)

                tk.Button(btn_frame, text="✕", fg=COLORS["danger"], bg=COLORS["panel"], bd=0, font=("Segoe UI", 10), cursor="hand2",
                         command=lambda idx=i: self.delete(idx)).pack(side=tk.LEFT, padx=5)
                
            except Exception as e:
                logger.error(f"Error loading thumb {filepath}: {e}")
        
        self.size_lbl.config(text=f"Total: {total_size_mb:.1f} MB ({len(self.image_paths)} pgs)")

    def move_up(self, idx):
        if idx > 0:
            self.image_paths[idx], self.image_paths[idx-1] = self.image_paths[idx-1], self.image_paths[idx]
            self.refresh_sidebar()

    def move_down(self, idx):
        if idx < len(self.image_paths) - 1:
            self.image_paths[idx], self.image_paths[idx+1] = self.image_paths[idx+1], self.image_paths[idx]
            self.refresh_sidebar()

    def delete(self, idx):
        try:
            # Remove file from disk to free space
            path = self.image_paths[idx]
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            
        del self.image_paths[idx]
        self.refresh_sidebar()

    def edit(self, idx):
        path = self.image_paths[idx]
        if os.path.exists(path):
            EditorWindow(self.root, path, lambda: self.refresh_sidebar())

    def update_img(self, idx, img):
        pass

    def upload(self):
        if not self.image_paths: return
        threading.Thread(target=self._upload_worker, daemon=True).start()

    def _upload_worker(self):
        try:
            buf = BytesIO()
            # Convert stored disk images back to PIL for PDF assembly
            # We open them one by one to avoid loading all into RAM at once if possible, 
            # but PDF saves require a list. 
            # For 300 pages, we might need a more streaming-friendly approach, 
            # but PIL's save_all usually handles lists of opened images okay if they are lazy.
            # However, opening 300 images might hit file handle limits.
            # Safe approach: Open, append, close? PIL doesn't support append easily without keeping objects open.
            # We will try loading them as images. If memory is an issue, we'd need a different PDF lib.
            
            # Loading all into list
            pil_images = []
            for path in self.image_paths:
                try:
                    img = Image.open(path)
                    if img.mode != 'RGB': img = img.convert('RGB')
                    pil_images.append(img)
                except Exception as e:
                    logger.error(f"Skipping bad file {path}: {e}")

            if not pil_images: return

            # High compression for the PDF (Quality 40)
            pil_images[0].save(buf, format="PDF", save_all=True, append_images=pil_images[1:], quality=40, optimize=True)
            buf.seek(0)
            
            # LOCAL SAVE (User Request: output/scan.pdf)
            try:
                output_dir = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), "output")
                os.makedirs(output_dir, exist_ok=True)
                
                # Check for existing file and rename to prevent overwrite
                base_name = "scan"
                ext = ".pdf"
                counter = 0
                
                local_path = os.path.join(output_dir, f"{base_name}{ext}")
                while os.path.exists(local_path):
                    counter += 1
                    local_path = os.path.join(output_dir, f"{base_name}_{counter:02d}{ext}")

                with open(local_path, "wb") as f:
                    f.write(buf.getvalue())
                logger.info(f"PDF saved locally to: {local_path}")
            except Exception as e:
                logger.error(f"Failed to save local PDF: {e}")

            url = f"{self.api_url}/patients/{self.patient_id}/upload"
            headers = {'Authorization': f"Bearer {self.token}"}
            
            # Re-seek buffer for upload reading
            buf.seek(0)
            response = requests.post(url, headers=headers, files={'file': ('scan.pdf', buf)}, timeout=300) # Increased timeout for large files
            
            if response.status_code in [200, 201]:
                # Success message removed for auto-close
                logger.info("Upload successful, closing app...")
                
                # Cleanup Session
                try:
                    shutil.rmtree(self.session_dir)
                except: pass
                
                self.image_paths = []
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