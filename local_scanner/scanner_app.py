import sys
import os
import cv2
import requests
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from PIL import Image, ImageTk, ImageEnhance
import urllib.parse
from io import BytesIO
import ctypes
import threading

# =============================================================================
# DIGIFORT SCANNER PRO - DARK THEME UI
# =============================================================================
COLORS = {
    "bg": "#1e1e1e",           # Main Background (Darkest)
    "panel": "#252526",        # Sidebars/Toolbars
    "fg": "#cccccc",           # Standard Text
    "accent": "#007acc",       # Blue Highlight
    "accent_hover": "#0098ff",
    "danger": "#d9534f",
    "success": "#5cb85c",
    "border": "#3e3e42"
}

class ScannerApp:
    def __init__(self, root, args):
        self.root = root
        self.root.title("Digifort Scanner Pro")
        self.root.geometry("1400x900")
        self.root.configure(bg=COLORS["bg"])
        
        # State Variables
        self.params = self.parse_arguments(args)
        self.token = self.params.get('token')
        self.api_url = self.params.get('api_url', 'http://localhost:8000')
        self.patient_id = self.params.get('patient_id')
        
        self.cap = None
        self.camera_active = False
        self.captured_images = []     # List of PIL Images
        self.original_images = []     # Keep originals for non-destructive edits
        self.selected_camera_index = 0
        self.available_cameras = self.get_available_cameras()
        self.current_preview_index = -1 # -1 is live camera, >=0 is captured image
        
        # Image Adjustments
        self.brightness_val = tk.DoubleVar(value=1.0)
        self.contrast_val = tk.DoubleVar(value=1.0)
        self.color_mode = tk.StringVar(value="Color") # Color, Gray, B&W
        self.auto_crop = tk.BooleanVar(value=True) # Auto-crop documents
        self.resolution_mode = tk.StringVar(value="4K (16MP)") # Resolution setting
        self.flash_enabled = False  # Flash/torch state
        self.focus_mode = "auto"  # auto or manual
        
        if not self.token or not self.patient_id:
             messagebox.showerror("Auth Error", "Please launch using the 'Desktop App' button on the Website.")
        
        self.setup_styles()
        self.setup_ui()
        self.start_camera()

    # -------------------------------------------------------------------------
    # UI SETUP
    # -------------------------------------------------------------------------
    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Default Look
        style.configure(".", background=COLORS["panel"], foreground=COLORS["fg"], borderwidth=0)
        style.configure("TFrame", background=COLORS["panel"])
        style.configure("Main.TFrame", background=COLORS["bg"])
        
        # Labels
        style.configure("TLabel", background=COLORS["panel"], foreground=COLORS["fg"], font=("Segoe UI", 10))
        style.configure("Header.TLabel", font=("Segoe UI", 12, "bold"), foreground="white")
        
        # Buttons
        style.configure("TButton", background="#3c3c3c", foreground="white", borderwidth=0, padding=6)
        style.map("TButton", background=[('active', '#505050')])
        
        # Accent Button (Blue)
        style.configure("Accent.TButton", background=COLORS["accent"], foreground="white", font=("Segoe UI", 10, "bold"))
        style.map("Accent.TButton", background=[('active', COLORS["accent_hover"])])
        
        # Danger Button (Red)
        style.configure("Danger.TButton", background=COLORS["danger"], foreground="white")
        style.map("Danger.TButton", background=[('active', "#c9302c")])

        # Combobox
        style.configure("TCombobox", fieldbackground="#333", background="#333", foreground="white", arrowcolor="white")
        style.map("TCombobox", fieldbackground=[('readonly', '#333')])

    def setup_ui(self):
        # MAIN LAYOUT: Left (Sidebar) | Center (Preview) | Bottom (Toolbar) is inside Center
        
        # 1. TOP HEADER (Optional, strictly functionality first)
        
        # 2. LEFT SIDEBAR
        sidebar = ttk.Frame(self.root, width=300)
        sidebar.pack(side=tk.LEFT, fill=tk.Y, padx=0, pady=0)
        sidebar.pack_propagate(False) # Fixed width
        
        # Pages List Header
        header_frame = ttk.Frame(sidebar)
        header_frame.pack(fill=tk.X, padx=10, pady=10)
        ttk.Label(header_frame, text="📄 Pages (0)", style="Header.TLabel").pack(side=tk.LEFT)
        self.pages_count_lbl = header_frame.winfo_children()[0]
        
        # Settings Group
        settings_frame = ttk.LabelFrame(sidebar, text="SETTINGS", padding=10)
        settings_frame.pack(fill=tk.X, padx=10, pady=5)
        settings_frame.pack(fill=tk.X, padx=10, pady=5)
        # settings_frame.configure(fg="gray") # Not supported in TTK
        
        ttk.Label(settings_frame, text="Camera Source").pack(anchor="w")
        cam_values = [f"Camera {i}" for i in self.available_cameras] if self.available_cameras else ["No Camera"]
        self.cb_camera = ttk.Combobox(settings_frame, values=cam_values, state="readonly")
        if self.available_cameras: self.cb_camera.current(0)
        self.cb_camera.pack(fill=tk.X, pady=(0, 10))
        self.cb_camera.bind("<<ComboboxSelected>>", self.change_camera)
        
        ttk.Label(settings_frame, text="Resolution").pack(anchor="w")
        self.cb_res = ttk.Combobox(settings_frame, values=["4K (16MP)", "1080p (FHD)", "720p (HD)"], state="readonly", textvariable=self.resolution_mode)
        self.cb_res.current(0)  # Default to 16MP
        self.cb_res.pack(fill=tk.X, pady=(0, 10))
        self.cb_res.bind("<<ComboboxSelected>>", self.change_resolution)
        
        ttk.Label(settings_frame, text="Document Type").pack(anchor="w")
        self.cb_dpi = ttk.Combobox(settings_frame, values=["Document (A4)", "ID Card", "Receipt"], state="readonly")
        self.cb_dpi.current(0)
        self.cb_dpi.pack(fill=tk.X, pady=(0, 10))
        
        # Auto-crop toggle
        self.chk_autocrop = ttk.Checkbutton(settings_frame, text="Auto-Crop Documents", variable=self.auto_crop)
        self.chk_autocrop.pack(anchor="w")

        # Thumbnails List (Custom Listbox look)
        self.list_frame = tk.Frame(sidebar, bg="#181818")
        self.list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Delete All Button at Bottom
        ttk.Button(sidebar, text="Delete ALL", style="Danger.TButton", command=self.clear_all).pack(side=tk.BOTTOM, fill=tk.X, padx=10, pady=10)


        # 3. RIGHT MAIN AREA
        main_area = ttk.Frame(self.root, style="Main.TFrame")
        main_area.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Top Toolbar (Image Tools)
        top_tools = ttk.Frame(main_area)
        top_tools.pack(fill=tk.X, padx=10, pady=10)
        
        # Mode Toggles
        self.btn_color = ttk.Button(top_tools, text="Color", command=lambda: self.set_mode("Color"))
        self.btn_color.pack(side=tk.LEFT, padx=2)
        
        self.btn_gray = ttk.Button(top_tools, text="Gray", command=lambda: self.set_mode("Gray"))
        self.btn_gray.pack(side=tk.LEFT, padx=2)
        
        self.btn_bw = ttk.Button(top_tools, text="B&W", command=lambda: self.set_mode("B&W"))
        self.btn_bw.pack(side=tk.LEFT, padx=2)
        
        ttk.Separator(top_tools, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=10)
        
        ttk.Button(top_tools, text="⟳ Rot", command=self.rotate_last_image).pack(side=tk.LEFT, padx=2)
        ttk.Button(top_tools, text="⛶ Fit", command=self.reset_zoom).pack(side=tk.LEFT, padx=2)
        
        ttk.Separator(top_tools, orient=tk.VERTICAL).pack(side=tk.LEFT, fill=tk.Y, padx=10)
        
        self.btn_focus = ttk.Button(top_tools, text="🎯 Focus", command=self.toggle_focus)
        self.btn_focus.pack(side=tk.LEFT, padx=2)
        
        self.btn_flash = ttk.Button(top_tools, text="💡 Light", command=self.toggle_flash)
        self.btn_flash.pack(side=tk.LEFT, padx=2)
        
        ttk.Button(top_tools, text="Full Restart", style="Danger.TButton", command=self.restart_app).pack(side=tk.RIGHT)


        # Canvas Area (Black Background)
        self.canvas_container = tk.Frame(main_area, bg="black")
        self.canvas_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        
        self.canvas = tk.Canvas(self.canvas_container, bg="black", highlightthickness=0)
        self.canvas.pack(fill=tk.BOTH, expand=True)

        # Bottom Control Bar
        bot_bar = ttk.Frame(main_area, padding=10)
        bot_bar.pack(fill=tk.X, side=tk.BOTTOM)
        
        # Sliders
        sliders_frame = ttk.Frame(bot_bar)
        sliders_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        ttk.Label(sliders_frame, text="Brightness").grid(row=0, column=0, padx=5)
        tk.Scale(sliders_frame, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.brightness_val, bg=COLORS["panel"], fg="white", 
                 highlightthickness=0).grid(row=0, column=1, sticky="ew")
                 
        ttk.Label(sliders_frame, text="Contrast").grid(row=1, column=0, padx=5)
        tk.Scale(sliders_frame, from_=0.5, to=2.0, resolution=0.1, orient=tk.HORIZONTAL, 
                 variable=self.contrast_val, bg=COLORS["panel"], fg="white", 
                 highlightthickness=0).grid(row=1, column=1, sticky="ew")

        # Capture Button (Big White Circle)
        self.btn_capture = tk.Button(bot_bar, text="⚫", font=("Arial", 24), bg="white", fg="black", 
                                     activebackground="#ddd", activeforeground="black",
                                     relief="flat", bd=0, command=self.capture_frame)
        self.btn_capture.config(height=1, width=3) # rough circle shape hack
        # Actually simple text button is safer for sizing
        self.btn_capture.config(text="CAPTURE", font=("Segoe UI", 12, "bold"))
        self.btn_capture.pack(side=tk.LEFT, padx=40)
        
        # Upload / Convert Button
        self.btn_upload = ttk.Button(bot_bar, text="✓ Convert to PDF", style="Accent.TButton", command=self.upload_all)
        self.btn_upload.pack(side=tk.RIGHT)

        # Keyboard
        self.root.bind('<space>', lambda e: self.capture_frame())


    # -------------------------------------------------------------------------
    # LOGIC
    # -------------------------------------------------------------------------
    def parse_arguments(self, args):
        params = {}
        if len(args) > 1:
            uri = args[1]
            try:
                # remove "digifort://"
                if uri.startswith("digifort://"):
                    # it might be digifort://upload?token=...
                    # standard urlparse might fail if scheme is weird, strip it manual
                    uri = uri.replace("digifort://", "http://dummy/")
                    
                parsed = urllib.parse.urlparse(uri)
                qs = urllib.parse.parse_qs(parsed.query)
                for k, v in qs.items():
                    params[k] = v[0]
            except: pass
        return params

    def get_available_cameras(self):
        arr = []
        for i in range(3):
            cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
            if cap.isOpened():
                arr.append(i)
                cap.release()
        return arr

    def start_camera(self):
        if self.camera_active: return
        self.cap = cv2.VideoCapture(self.selected_camera_index, cv2.CAP_DSHOW)
        
        # Set resolution based on user selection
        res_mode = self.resolution_mode.get()
        if "4K" in res_mode or "16MP" in res_mode:
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 3840)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 2160)
        elif "1080p" in res_mode:
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
        else:  # 720p
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # Enable autofocus by default
        try:
            self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
        except:
            pass  # Not all cameras support this
            
        self.camera_active = True
        self.update_feed()

    def change_camera(self, event):
        idx = self.cb_camera.current()
        new = self.available_cameras[idx]
        if new != self.selected_camera_index:
            self.selected_camera_index = new
            if self.cap:
                self.cap.release()
            self.camera_active = False
            self.start_camera()
    
    def change_resolution(self, event):
        # Restart camera with new resolution
        if self.cap:
            self.cap.release()
        self.camera_active = False
        self.start_camera()

    def update_feed(self):
        if not self.camera_active: return
        ret, frame = self.cap.read()
        if ret:
            # Apply processing to Live View (Brightness/Contrast only)
            # Doing extensive processing in Python loop is slow, keep it simple
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame)
            
            # Apply Filters (Fast)
            # 1. Resize to fit canvas
            cw = self.canvas.winfo_width()
            ch = self.canvas.winfo_height()
            if cw > 10 and ch > 10:
                img.thumbnail((cw, ch))
                self.photo = ImageTk.PhotoImage(image=img)
                self.canvas.delete("all")
                self.canvas.create_image(cw//2, ch//2, image=self.photo, anchor=tk.CENTER)
        
        self.root.after(30, self.update_feed)

    def set_mode(self, mode):
        self.color_mode.set(mode)
        # Update UI feedback (highlight button)
        self.btn_color.configure(style="TButton" if mode != "Color" else "Accent.TButton")
        self.btn_gray.configure(style="TButton" if mode != "Gray" else "Accent.TButton")
        self.btn_bw.configure(style="TButton" if mode != "B&W" else "Accent.TButton")

    def capture_frame(self):
        if not self.cap: return
        ret, frame = self.cap.read()
        if ret:
            # Auto-crop if enabled
            if self.auto_crop.get():
                frame = self.auto_crop_document(frame)
            
            # Process: Convert to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            self.captured_images.append(pil_img)
            self.original_images.append(pil_img)
            
            self.refresh_sidebar()
            self.flash_effect()
    
    def auto_crop_document(self, frame):
        """Detect document edges and crop automatically using OpenCV"""
        try:
            # Create a copy for processing
            orig = frame.copy()
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blur, 75, 200)
            
            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
            
            # Find the largest rectangular contour
            for contour in contours:
                peri = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
                
                if len(approx) == 4:
                    # Found a quadrilateral - likely the document
                    # Get bounding rectangle
                    x, y, w, h = cv2.boundingRect(approx)
                    
                    # Only crop if the detected area is significant (> 20% of frame)
                    if w * h > (frame.shape[0] * frame.shape[1] * 0.2):
                        return orig[y:y+h, x:x+w]
            
            # If no document found, return original
            return orig
        except:
            # On any error, return original frame
            return frame

    def flash_effect(self):
        self.canvas.configure(bg="white")
        self.root.after(50, lambda: self.canvas.configure(bg="black"))

    def refresh_sidebar(self):
        # Update count
        count = len(self.captured_images)
        self.pages_count_lbl.configure(text=f"📄 Pages ({count})")
        
        # Clear list
        for w in self.list_frame.winfo_children(): w.destroy()
        
        # Rebuild List (Thumbnails)
        for i, img in enumerate(self.captured_images):
            # Thumb
            thumb = img.copy()
            thumb.thumbnail((260, 200))
            
            # Apply B&W / Gray visual to thumbnail to match output
            mode = self.color_mode.get()
            if mode == "Gray":
                thumb = thumb.convert("L")
            elif mode == "B&W":
                thumb = thumb.convert("L").point(lambda p: 255 if p > 128 else 0)
            
            ph = ImageTk.PhotoImage(thumb)
            
            row = tk.Frame(self.list_frame, bg=COLORS["panel"], pady=2)
            row.pack(fill=tk.X, pady=2)
            
            lbl = tk.Label(row, image=ph, bg="#333")
            lbl.image = ph
            lbl.pack(side=tk.LEFT)
            
            # Info
            info = tk.Label(row, text=f"Page {i+1}", fg="white", bg=COLORS["panel"], font=("Arial", 9))
            info.pack(side=tk.LEFT, padx=10)
            
            # Delete X
            btn_del = tk.Button(row, text="✖", bg=COLORS["panel"], fg="red", bd=0, 
                                command=lambda idx=i: self.delete_page(idx))
            btn_del.pack(side=tk.RIGHT, padx=5)

    def delete_page(self, index):
        del self.captured_images[index]
        del self.original_images[index]
        self.refresh_sidebar()

    def clear_all(self):
        self.captured_images = []
        self.original_images = []
        self.refresh_sidebar()
    
    def rotate_last_image(self):
        """Rotate the most recently captured image by 90 degrees clockwise"""
        if not self.captured_images:
            return
        
        # Rotate the last image
        last_idx = len(self.captured_images) - 1
        img = self.captured_images[last_idx]
        rotated = img.rotate(-90, expand=True)  # -90 for clockwise
        
        self.captured_images[last_idx] = rotated
        self.original_images[last_idx] = rotated
        self.refresh_sidebar()
        
    def reset_zoom(self):
        """Reset camera view / refresh feed"""
        # Simply refresh the camera feed
        pass  # Live feed auto-updates
    
    def toggle_focus(self):
        """Toggle between auto-focus and manual focus"""
        if not self.cap:
            return
        
        try:
            if self.focus_mode == "auto":
                self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
                self.focus_mode = "manual"
                self.btn_focus.configure(text="🎯 Manual")
            else:
                self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 1)
                self.focus_mode = "auto"
                self.btn_focus.configure(text="🎯 Focus")
        except:
            messagebox.showinfo("Focus", "Your camera doesn't support focus control")
    
    def toggle_flash(self):
        """Toggle camera flash/torch (if supported)"""
        if not self.cap:
            return
        
        try:
            # Try to toggle flash/torch - not all cameras support this
            if self.flash_enabled:
                # Turn off
                self.cap.set(cv2.CAP_PROP_SETTINGS, 0)  # This is camera-specific
                self.flash_enabled = False
                self.btn_flash.configure(text="💡 Light")
            else:
                # Turn on
                self.cap.set(cv2.CAP_PROP_SETTINGS, 1)
                self.flash_enabled = True
                self.btn_flash.configure(text="💡 ON")
        except:
            messagebox.showinfo("Flash", "Your camera doesn't have a controllable light/flash")

    def restart_app(self):
        self.clear_all()
        # Reset settings
        self.brightness_val.set(1.0)
        self.contrast_val.set(1.0)
        
    def process_and_upload(self):
         pass

    def upload_all(self):
        if not self.captured_images: return
        threading.Thread(target=self._upload_thread).start()

    def _upload_thread(self):
        total = len(self.captured_images)
        success = 0
        
        # Mode settings
        mode = self.color_mode.get()
        bri = self.brightness_val.get()
        con = self.contrast_val.get()
        
        for i, img in enumerate(self.captured_images):
            # 1. Apply Filters
            proc_img = img.copy()
            
            if mode == "Gray":
                proc_img = proc_img.convert("L")
            elif mode == "B&W":
                proc_img = proc_img.convert("L").point( lambda p: 255 if p > 128 else 0 )
                
            enhancer = ImageEnhance.Brightness(proc_img)
            proc_img = enhancer.enhance(bri)
            enhancer = ImageEnhance.Contrast(proc_img)
            proc_img = enhancer.enhance(con)
            
            # 2. Compress to JPEG
            buffer = BytesIO()
            # If B&W, save as 1-bit PNG might be smaller, but JPEG universal
            proc_img = proc_img.convert("RGB") 
            proc_img.save(buffer, format="JPEG", quality=85, optimize=True)
            buffer.seek(0)
            
            # 3. Upload
            filename = f"scan_{self.patient_id}_{i+1}.jpg"
            files = {'file': (filename, buffer, 'image/jpeg')}
            headers = {'Authorization': f"Bearer {self.token}"}
            url = f"{self.api_url}/patients/{self.patient_id}/upload"
            
            try:
                res = requests.post(url, headers=headers, files=files)
                if res.status_code == 200: success += 1
            except Exception as e:
                print(e)
                
        self.root.after(0, lambda: messagebox.showinfo("Done", f"Uploaded {success}/{total} pages."))
        if success == total:
            self.captured_images = []
            self.original_images = []
            self.root.after(0, self.refresh_sidebar)

if __name__ == "__main__":
    try:
        if hasattr(ctypes.windll.shcore, 'SetProcessDpiAwareness'):
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
    except: pass
        
    root = tk.Tk()
    app = ScannerApp(root, sys.argv)
    root.mainloop()
