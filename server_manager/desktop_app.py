import os
import re
import sys
import time
import socket
import asyncio
import threading
import subprocess
import webbrowser
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

# Ensure the server manager folder is in python import path for imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)

# Import backend variables and commands from server.py
from server import (
    app, 
    services_state, 
    log_buffers, 
    start_service, 
    stop_service, 
    get_local_ip,
    load_env_variables,
    terminate_process_tree
)

# Robust Windows System Tray conditional imports
try:
    import pystray
    from pystray import MenuItem as item
    from PIL import Image
    PYSSTRAY_AVAILABLE = True
except ImportError:
    PYSSTRAY_AVAILABLE = False
    print("pystray or PIL not found in python environment. Tray minimization will fallback to standard window state.")

# Colors Dictionary - Modern Premium Slate Theme
COLORS = {
    "bg": "#0a0c10",            # Deep Space Black
    "panel": "#121621",         # Dark Slate Card Backing
    "panel_inner": "#090b10",   # Terminal slate black
    "fg": "#f8fafc",            # Pure White
    "fg_dim": "#94a3b8",        # Muted Slate Gray
    "border": "#1e293b",        # Subtle Indigo-Slate border
    
    "ssh": "#06b6d4",           # Cyan
    "ssh_bg": "#083344",
    "backend": "#8b5cf6",       # Violet
    "backend_bg": "#2e1065",
    "frontend": "#ec4899",      # Pink
    "frontend_bg": "#500724",
    
    "success": "#10b981",       # Emerald
    "danger": "#ef4444",        # Crimson
    "warning": "#f59e0b",       # Amber
    "info": "#3b82f6"           # Royal Blue
}

class DesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Digifort Dev Command Center")
        self.root.geometry("1300x850")
        self.root.configure(bg=COLORS["bg"])
        self.tray_icon = None
        
        # Window icon configuration
        try:
            icon_path = os.path.join(CURRENT_DIR, "static", "icon.ico")
            if os.path.exists(icon_path):
                self.root.iconbitmap(icon_path)
            elif os.path.exists(os.path.join(CURRENT_DIR, "icon.ico")):
                self.root.iconbitmap(os.path.join(CURRENT_DIR, "icon.ico"))
        except Exception as e:
            print(f"Could not load icon: {e}")

        # State Variables
        self.current_tab = "all"
        self.rendered_counts = {"all": 0, "ssh": 0, "backend": 0, "frontend": 0, "live": 0}
        self.search_query = ""
        
        # 1. Start FastAPI server in a background thread
        print("Spawning FastAPI server on background thread...")
        threading.Thread(target=self.run_api_server, daemon=True).start()
        
        # 2. Build UI Layout
        self.setup_styles()
        self.setup_ui()
        
        # 3. Initialize System Tray if available
        if PYSSTRAY_AVAILABLE:
            self.setup_tray()
            # Bind Tkinter minimize state changes
            self.root.bind("<Unmap>", self.on_window_minimize)
        
        # 4. Synchronize periodic status & logs trackers
        self.root.after(100, self.update_clock)
        self.root.after(500, self.poll_services_status)
        self.root.after(100, self.poll_realtime_logs)
        
        # 5. AUTO-START LOCAL DEV SERVICES delay sequences to prevent port locks
        self.root.after(1200, self.auto_start_stack_services)
        
        # Intercept window closure for proper process termination
        self.root.protocol("WM_DELETE_WINDOW", self.on_close_app)

    def run_api_server(self):
        import uvicorn
        # Note: Reload is disabled here because uvicorn threads do not support file reloading
        uvicorn.run(app, host="0.0.0.0", port=8050, log_level="warning")

    def setup_styles(self):
        # Configure ttk visual parameters
        style = ttk.Style()
        style.theme_use("clam")
        
        style.configure(".", background=COLORS["bg"], foreground=COLORS["fg"])
        style.configure("TFrame", background=COLORS["bg"])
        
        # Combobox style
        style.configure("TCombobox", fieldbackground=COLORS["panel"], background=COLORS["panel"],
                        foreground=COLORS["fg"], arrowcolor=COLORS["ssh"], bordercolor=COLORS["border"])

    def setup_ui(self):
        # Header container
        header_frame = tk.Frame(self.root, bg=COLORS["panel"], height=80, highlightthickness=1, highlightbackground=COLORS["border"])
        header_frame.pack(fill=tk.X, padx=15, pady=(15, 10))
        header_frame.pack_propagate(False)
        
        # Brand info
        brand_frame = tk.Frame(header_frame, bg=COLORS["panel"])
        brand_frame.pack(side=tk.LEFT, padx=20, fill=tk.Y, pady=12)
        
        lbl_title = tk.Label(brand_frame, text="DIGIFORT LABS", font=("Segoe UI", 16, "bold"), fg=COLORS["fg"], bg=COLORS["panel"])
        lbl_title.pack(anchor="w")
        lbl_sub = tk.Label(brand_frame, text="LOCALHOST DEV COMMAND CENTER", font=("Segoe UI", 9, "bold"), fg=COLORS["ssh"], bg=COLORS["panel"])
        lbl_sub.pack(anchor="w")
        
        # Status indicators
        status_frame = tk.Frame(header_frame, bg=COLORS["panel"])
        status_frame.pack(side=tk.RIGHT, padx=20, fill=tk.Y, pady=15)
        
        self.lbl_clock = tk.Label(status_frame, text="00:00:00", font=("Consolas", 12), fg=COLORS["fg_dim"], bg=COLORS["panel"])
        self.lbl_clock.pack(side=tk.RIGHT, padx=(20, 0))
        
        self.badge_ip = tk.Label(
            status_frame, text=f"LAN IP: {get_local_ip()}", font=("Segoe UI", 10, "bold"), 
            fg=COLORS["fg"], bg=COLORS["border"], padx=12, pady=4
        )
        self.badge_ip.pack(side=tk.RIGHT)
        
        # Main layout panels
        main_paned = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, bg=COLORS["bg"], bd=0, sashwidth=4)
        main_paned.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 15))
        
        # Left Panel (Controls & Env)
        left_container = tk.Frame(main_paned, bg=COLORS["bg"])
        main_paned.add(left_container, width=400)
        
        # Service Cards Panel
        lbl_control = tk.Label(left_container, text="DEVELOPMENT CONTROLLERS", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg"])
        lbl_control.pack(anchor="w", pady=(0, 6), padx=2)
        
        cards_frame = tk.Frame(left_container, bg=COLORS["bg"])
        cards_frame.pack(fill=tk.BOTH, expand=True)
        
        # Build 4 service frames (SSH, Backend, Frontend, Live)
        self.service_widgets = {}
        
        services_list = [
            ("ssh", "SSH Tunnel", "Database Tunnel (Port 5433)", COLORS["ssh"], False),
            ("backend", "FastAPI Backend", "Uvicorn Server (Port 8000)", COLORS["backend"], False),
            ("frontend", "Next.js Frontend", "React Web Server (Port 3000)", COLORS["frontend"], False),
            ("live", "AWS Live Server", "Production PM2 Logs (digifortlabs.com)", COLORS["warning"], True)
        ]
        
        for key, name, desc, color, is_live_service in services_list:
            card = tk.Frame(cards_frame, bg=COLORS["panel"], highlightthickness=1, highlightbackground=COLORS["border"], bd=0)
            card.pack(fill=tk.X, pady=(0, 10))
            
            # Left vertical accent line
            accent_bar = tk.Frame(card, bg=COLORS["border"], width=4)
            accent_bar.pack(side=tk.LEFT, fill=tk.Y)
            
            body = tk.Frame(card, bg=COLORS["panel"], padx=15, pady=12)
            body.pack(fill=tk.BOTH, expand=True)
            
            # Header row inside card
            row_header = tk.Frame(body, bg=COLORS["panel"])
            row_header.pack(fill=tk.X)
            
            lbl_name = tk.Label(row_header, text=name, font=("Segoe UI", 12, "bold"), fg=COLORS["fg"], bg=COLORS["panel"])
            lbl_name.pack(side=tk.LEFT)
            
            badge_status = tk.Label(
                row_header, text="STOPPED", font=("Segoe UI", 8, "bold"), 
                fg=COLORS["fg_dim"], bg=COLORS["border"], padx=8, pady=2
            )
            badge_status.pack(side=tk.RIGHT)
            
            lbl_desc = tk.Label(body, text=desc, font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["panel"])
            lbl_desc.pack(anchor="w", pady=(2, 8))
            
            # Info block
            info_frame = tk.Frame(body, bg=COLORS["panel_inner"], highlightthickness=1, highlightbackground=COLORS["border"], padx=10, pady=6)
            info_frame.pack(fill=tk.X, pady=(0, 10))
            
            lbl_pid_label = tk.Label(info_frame, text="PID:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["panel_inner"])
            lbl_pid_label.grid(row=0, column=0, sticky="w")
            
            lbl_pid = tk.Label(info_frame, text="-", font=("Consolas", 9, "bold"), fg=COLORS["fg"], bg=COLORS["panel_inner"])
            lbl_pid.grid(row=0, column=1, sticky="w", padx=(10, 0))
            
            lbl_time_label = tk.Label(info_frame, text="Active:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["panel_inner"])
            lbl_time_label.grid(row=0, column=2, sticky="w", padx=(30, 0))
            
            lbl_time = tk.Label(info_frame, text="-", font=("Consolas", 9), fg=COLORS["fg"], bg=COLORS["panel_inner"])
            lbl_time.grid(row=0, column=3, sticky="w", padx=(10, 0))
            
            # Action controls
            actions_frame = tk.Frame(body, bg=COLORS["panel"])
            actions_frame.pack(fill=tk.X)
            
            if is_live_service:
                self.live_toggle_var = tk.BooleanVar(value=False)
                toggle_btn = tk.Checkbutton(
                    actions_frame, text="Stream Live Logs", variable=self.live_toggle_var,
                    font=("Segoe UI", 9, "bold"), bg=COLORS["panel"], fg=COLORS["warning"],
                    selectcolor=COLORS["panel_inner"], activebackground=COLORS["panel"],
                    activeforeground=COLORS["warning"], cursor="hand2",
                    command=self.toggle_live_logs
                )
                toggle_btn.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
                
                self.service_widgets[key] = {
                    "badge": badge_status,
                    "pid": lbl_pid,
                    "uptime": lbl_time,
                    "toggle_btn": toggle_btn,
                    "accent_bar": accent_bar,
                    "color": color
                }
            else:
                btn_start = tk.Button(
                    actions_frame, text="▶ Start", font=("Segoe UI", 9, "bold"), 
                    bg=COLORS["border"], fg=COLORS["success"], relief="flat", bd=0, padx=12, pady=6, cursor="hand2",
                    command=lambda k=key: self.trigger_service(k, "start")
                )
                btn_start.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
                
                btn_stop = tk.Button(
                    actions_frame, text="■ Stop", font=("Segoe UI", 9, "bold"), 
                    bg=COLORS["border"], fg=COLORS["danger"], relief="flat", bd=0, padx=12, pady=6, cursor="hand2",
                    command=lambda k=key: self.trigger_service(k, "stop")
                )
                btn_stop.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
                
                btn_restart = tk.Button(
                    actions_frame, text="⟳ Restart", font=("Segoe UI", 9, "bold"), 
                    bg=COLORS["border"], fg=COLORS["warning"], relief="flat", bd=0, padx=12, pady=6, cursor="hand2",
                    command=lambda k=key: self.trigger_service(k, "restart")
                )
                btn_restart.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=2)
                
                self.service_widgets[key] = {
                    "badge": badge_status,
                    "pid": lbl_pid,
                    "uptime": lbl_time,
                    "btn_start": btn_start,
                    "btn_stop": btn_stop,
                    "btn_restart": btn_restart,
                    "accent_bar": accent_bar,
                    "color": color
                }

        # Environment & Config section
        lbl_env = tk.Label(left_container, text="ENVIRONMENT VARIABLES", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg"])
        lbl_env.pack(anchor="w", pady=(5, 6), padx=2)
        
        env_frame = tk.Frame(left_container, bg=COLORS["panel"], highlightthickness=1, highlightbackground=COLORS["border"])
        env_frame.pack(fill=tk.X, pady=(0, 5))
        
        # Scrollable container for environment keys
        self.env_box = scrolledtext.ScrolledText(
            env_frame, bg=COLORS["panel"], fg=COLORS["fg"], font=("Consolas", 9),
            bd=0, highlightthickness=0, insertbackground="white", padx=10, pady=8, height=6
        )
        self.env_box.pack(fill=tk.BOTH, expand=True)
        self.load_env_display()

        # Right Panel (Console Terminal View)
        right_container = tk.Frame(main_paned, bg=COLORS["bg"])
        main_paned.add(right_container, width=880)
        
        lbl_term = tk.Label(right_container, text="LIVE CONSOLE TERMINAL MONITOR", font=("Segoe UI", 9, "bold"), fg=COLORS["fg_dim"], bg=COLORS["bg"])
        lbl_term.pack(anchor="w", pady=(0, 6), padx=2)
        
        term_frame = tk.Frame(right_container, bg=COLORS["panel_inner"], highlightthickness=1, highlightbackground=COLORS["border"])
        term_frame.pack(fill=tk.BOTH, expand=True)
        
        # Custom Title Bar
        titlebar = tk.Frame(term_frame, bg=COLORS["panel"], height=38)
        titlebar.pack(fill=tk.X)
        titlebar.pack_propagate(False)
        
        # Mock circles
        mock_dots = tk.Frame(titlebar, bg=COLORS["panel"])
        mock_dots.pack(side=tk.LEFT, padx=12)
        
        for c in [COLORS["danger"], COLORS["warning"], COLORS["success"]]:
            dot = tk.Frame(mock_dots, bg=c, width=10, height=10)
            dot.pack(side=tk.LEFT, padx=3)
            
        lbl_bar_title = tk.Label(titlebar, text="bash - log_streamer - digifort_monorepo", font=("Consolas", 9), fg=COLORS["fg_dim"], bg=COLORS["panel"])
        lbl_bar_title.pack(side=tk.LEFT, padx=15)
        
        # Quick launcher toolbar
        btn_open_gui = tk.Button(
            titlebar, text="Launch Web Console ↗", font=("Segoe UI", 8, "bold"),
            bg=COLORS["border"], fg=COLORS["ssh"], relief="flat", bd=0, padx=10, cursor="hand2",
            command=lambda: webbrowser.open("http://localhost:8050")
        )
        btn_open_gui.pack(side=tk.RIGHT, padx=10, pady=6)
        
        btn_open_fe = tk.Button(
            titlebar, text="Open WebApp ↗", font=("Segoe UI", 8, "bold"),
            bg=COLORS["border"], fg=COLORS["frontend"], relief="flat", bd=0, padx=10, cursor="hand2",
            command=lambda: webbrowser.open("http://localhost:3000")
        )
        btn_open_fe.pack(side=tk.RIGHT, padx=5, pady=6)
        
        # Tabs bar trigger
        tabs_frame = tk.Frame(term_frame, bg=COLORS["bg"], height=36)
        tabs_frame.pack(fill=tk.X)
        tabs_frame.pack_propagate(False)
        
        self.tab_buttons = {}
        tab_configs = [
            ("all", "All Outputs"),
            ("ssh", "SSH Tunnel"),
            ("backend", "Backend API"),
            ("frontend", "Frontend Web"),
            ("live", "Live Server")
        ]
        
        for tag, label in tab_configs:
            btn = tk.Button(
                tabs_frame, text=label, font=("Segoe UI", 9, "bold" if tag == "all" else "normal"),
                bg=COLORS["panel_inner"] if tag != "all" else COLORS["border"],
                fg=COLORS["ssh"] if tag == "all" else COLORS["fg_dim"],
                activebackground=COLORS["border"], activeforeground=COLORS["fg"],
                relief="flat", bd=0, padx=15, cursor="hand2",
                command=lambda t=tag: self.switch_console_tab(t)
            )
            btn.pack(side=tk.LEFT, fill=tk.Y)
            self.tab_buttons[tag] = btn
            
        # Toolbar below tabs
        toolbar = tk.Frame(term_frame, bg=COLORS["panel"], height=40)
        toolbar.pack(fill=tk.X)
        toolbar.pack_propagate(False)
        
        # Search Box
        search_lbl = tk.Label(toolbar, text="Search:", font=("Segoe UI", 9), fg=COLORS["fg_dim"], bg=COLORS["panel"])
        search_lbl.pack(side=tk.LEFT, padx=(12, 5))
        
        self.ent_search = tk.Entry(toolbar, width=25, bg=COLORS["panel_inner"], fg=COLORS["fg"], insertbackground="white", bd=1, relief="solid", highlightthickness=0)
        self.ent_search.config(highlightcolor=COLORS["border"])
        self.ent_search.pack(side=tk.LEFT, padx=5, fill=tk.Y, pady=8)
        self.ent_search.bind("<KeyRelease>", self.on_search_keypress)
        
        # Auto scroll checkbox
        self.auto_scroll_var = tk.BooleanVar(value=True)
        chk_scroll = tk.Checkbutton(
            toolbar, text="Auto-scroll", variable=self.auto_scroll_var, 
            bg=COLORS["panel"], fg=COLORS["fg_dim"], selectcolor=COLORS["panel_inner"],
            activebackground=COLORS["panel"], activeforeground=COLORS["fg"],
            font=("Segoe UI", 9), cursor="hand2"
        )
        chk_scroll.pack(side=tk.RIGHT, padx=12)
        
        btn_clear = tk.Button(
            toolbar, text="Clear Logs", font=("Segoe UI", 8, "bold"),
            bg=COLORS["panel_inner"], fg=COLORS["danger"], relief="flat", bd=0, padx=10, cursor="hand2",
            command=self.clear_logs_ui
        )
        btn_clear.pack(side=tk.RIGHT, padx=5, pady=8)
        
        btn_export = tk.Button(
            toolbar, text="Export Logs", font=("Segoe UI", 8, "bold"),
            bg=COLORS["panel_inner"], fg=COLORS["fg"], relief="flat", bd=0, padx=10, cursor="hand2",
            command=self.export_logs_ui
        )
        btn_export.pack(side=tk.RIGHT, padx=5, pady=8)
        
        # Monospace display textbox
        self.console = scrolledtext.ScrolledText(
            term_frame, bg=COLORS["panel_inner"], fg="#e2e8f0", font=("Fira Code", 10),
            bd=0, highlightthickness=0, insertbackground="white", padx=12, pady=12, state=tk.DISABLED
        )
        self.console.pack(fill=tk.BOTH, expand=True)
        
        # Configure tags for terminal colors mapping
        self.console.tag_config('ssh', foreground=COLORS["ssh"])
        self.console.tag_config('backend', foreground=COLORS["backend"])
        self.console.tag_config('frontend', foreground=COLORS["frontend"])
        self.console.tag_config('live', foreground=COLORS["warning"])
        self.console.tag_config('info', foreground="#34d399") # green
        self.console.tag_config('warn', foreground="#fbbf24") # yellow
        self.console.tag_config('error', foreground="#f87171") # red
        self.console.tag_config('blue', foreground="#60a5fa")
        self.console.tag_config('magenta', foreground="#f472b6")
        self.console.tag_config('time', foreground=COLORS["fg_dim"])
        
        # Badges tags inside terminal lines
        self.console.tag_config('ch_ssh', background=COLORS["ssh_bg"], foreground=COLORS["ssh"], font=("Consolas", 8, "bold"))
        self.console.tag_config('ch_backend', background=COLORS["backend_bg"], foreground=COLORS["backend"], font=("Consolas", 8, "bold"))
        self.console.tag_config('ch_frontend', background=COLORS["frontend_bg"], foreground=COLORS["frontend"], font=("Consolas", 8, "bold"))
        self.console.tag_config('ch_live', background="#78350f", foreground=COLORS["warning"], font=("Consolas", 8, "bold"))
        
        # Search highlight
        self.console.tag_config('search', background="#eab308", foreground="#000000")

    def toggle_live_logs(self):
        is_active = self.live_toggle_var.get()
        if is_active:
            # Auto start logging streaming via backend server triggers
            self.trigger_service("live", "start")
            # Automatically switch to the "live" tab so the user sees the stream starting!
            self.switch_console_tab("live")
        else:
            # Stop stream connection via backend server triggers
            self.trigger_service("live", "stop")
            # Switch back to the "all" outputs tab
            self.switch_console_tab("all")

    def auto_start_stack_services(self):
        print("Executing sequential auto-start on all development stack services...")
        self.trigger_service("ssh", "start")
        self.root.after(1000, lambda: self.trigger_service("backend", "start"))
        self.root.after(2200, lambda: self.trigger_service("frontend", "start"))

    def setup_tray(self):
        # Native pystray setup
        icon_image = None
        try:
            icon_path = os.path.join(CURRENT_DIR, "static", "icon.ico")
            if os.path.exists(icon_path):
                icon_image = Image.open(icon_path)
        except Exception as e:
            print(f"Could not load PIL image for tray: {e}")
            
        if not icon_image:
            # Create a simple backup image if static file omitted
            icon_image = Image.new('RGB', (64, 64), color='#06b6d4')
            
        # Define context menus
        menu = pystray.Menu(
            item('Restore Panel', self.restore_from_tray, default=True),
            item('Stop Servers & Exit App', self.exit_from_tray)
        )
        
        self.tray_icon = pystray.Icon(
            "DigifortDevCenter",
            icon_image,
            "Digifort Dev Center",
            menu
        )
        
        # Start tray listener in a background thread to prevent blocking
        threading.Thread(target=self.tray_icon.run, daemon=True).start()
        print("Windows System Tray Listener started.")

    def on_window_minimize(self, event):
        # Trigger withdraw to system tray on iconic triggers
        if event.widget == self.root and self.root.state() == "iconic":
            if PYSSTRAY_AVAILABLE and self.tray_icon:
                self.root.withdraw()
                self.tray_icon.visible = True
                print("App minimized to taskbar system tray.")

    def restore_from_tray(self, icon=None, item=None):
        # Invoke UI restore safely on the main thread loop
        self.root.after(0, self._restore_main_window_action)

    def _restore_main_window_action(self):
        self.root.deiconify()
        self.root.state("normal")
        self.root.focus_force()
        print("Panel restored from system tray.")

    def exit_from_tray(self, icon=None, item=None):
        # Exit triggered from system tray menu
        self.root.after(0, self.on_close_app)

    def load_env_display(self):
        env = load_env_variables()
        self.env_box.config(state=tk.NORMAL)
        self.env_box.delete("1.0", tk.END)
        
        display_keys = [
            "POSTGRES_USER", "POSTGRES_DB", "AWS_ACCESS_KEY_ID", 
            "AWS_REGION", "S3_BUCKET_NAME", "PROJECT_NAME", "ENVIRONMENT"
        ]
        
        for k in display_keys:
            if k in env:
                self.env_box.insert(tk.END, f"{k}:\n", "key")
                self.env_box.insert(tk.END, f"{env[k]}\n\n", "val")
                
        self.env_box.tag_config("key", foreground=COLORS["fg_dim"], font=("Consolas", 9, "bold"))
        self.env_box.tag_config("val", foreground=COLORS["ssh"])
        self.env_box.config(state=tk.DISABLED)

    def update_clock(self):
        now = datetime.now().strftime("%H:%M:%S")
        self.lbl_clock.config(text=now)
        self.root.after(1000, self.update_clock)

    def trigger_service(self, service: str, action: str):
        # Update badge to transitional state immediately
        widgets = self.service_widgets[service]
        widgets["badge"].config(text=f"{action.upper()}ING...", fg=COLORS["warning"], bg=COLORS["border"])
        
        # Run action in a separate background thread so GUI doesn't freeze!
        def run_action():
            try:
                # We can call python async endpoints directly
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                if action == "start":
                    loop.run_until_complete(start_service(service))
                elif action == "stop":
                    loop.run_until_complete(stop_service(service))
                elif action == "restart":
                    loop.run_until_complete(stop_service(service))
                    time.sleep(1.5)
                    loop.run_until_complete(start_service(service))
                loop.close()
            except Exception as e:
                print(f"Error executing desktop trigger on {service}: {e}")
            finally:
                # force status poll quickly
                self.root.after(100, self.poll_services_status)

        threading.Thread(target=run_action, daemon=True).start()

    def poll_services_status(self):
        for key, state in services_state.items():
            if key not in self.service_widgets:
                continue
            widgets = self.service_widgets[key]
            
            # Status Badge updates
            status = state["status"]
            widgets["badge"].config(text=status.upper())
            
            if status == "running":
                widgets["badge"].config(fg=COLORS["success"], bg=COLORS["border"])
                widgets["accent_bar"].config(bg=widgets["color"])
                
                # Uptime calculate
                if state["start_time"]:
                    start = datetime.fromisoformat(state["start_time"])
                    diff = int((datetime.now() - start).total_seconds())
                    widgets["uptime"].config(text=self.format_duration_hms(diff))
                
                if "btn_start" in widgets:
                    widgets["btn_start"].config(state=tk.DISABLED)
                    widgets["btn_stop"].config(state=tk.NORMAL)
                    widgets["btn_restart"].config(state=tk.NORMAL)
            elif status == "stopped":
                widgets["badge"].config(fg=COLORS["fg_dim"], bg=COLORS["border"])
                widgets["accent_bar"].config(bg=COLORS["border"])
                widgets["uptime"].config(text="-")
                
                if "btn_start" in widgets:
                    widgets["btn_start"].config(state=tk.NORMAL)
                    widgets["btn_stop"].config(state=tk.DISABLED)
                    widgets["btn_restart"].config(state=tk.DISABLED)
            elif status == "starting":
                widgets["badge"].config(fg=COLORS["warning"], bg=COLORS["border"])
                widgets["uptime"].config(text="Starting...")
                
                if "btn_start" in widgets:
                    widgets["btn_start"].config(state=tk.DISABLED)
                    widgets["btn_stop"].config(state=tk.DISABLED)
                    widgets["btn_restart"].config(state=tk.DISABLED)
            elif status == "error":
                widgets["badge"].config(fg=COLORS["danger"], bg=COLORS["border"])
                widgets["accent_bar"].config(bg=COLORS["danger"])
                widgets["uptime"].config(text="Error")
                
                if "btn_start" in widgets:
                    widgets["btn_start"].config(state=tk.NORMAL)
                    widgets["btn_stop"].config(state=tk.DISABLED)
                    widgets["btn_restart"].config(state=tk.DISABLED)
                
            widgets["pid"].config(text=str(state["pid"]) if state["pid"] else "-")
            
        self.root.after(1000, self.poll_services_status)

    def format_duration_hms(self, sec: int) -> str:
        if sec < 60: return f"{sec}s"
        m = sec // 60
        s = sec % 60
        if m < 60: return f"{m}m {s}s"
        h = m // 60
        rM = m % 60
        return f"{h}h {rM}m"

    def switch_console_tab(self, tab: str):
        self.current_tab = tab
        
        # Update tab visual button styles
        for tag, btn in self.tab_buttons.items():
            if tag == tab:
                btn.config(bg=COLORS["border"], fg=COLORS["ssh"], font=("Segoe UI", 9, "bold"))
            else:
                btn.config(bg=COLORS["panel_inner"], fg=COLORS["fg_dim"], font=("Segoe UI", 9, "normal"))
                
        # Clear log rendered tracker and reset UI terminal view
        self.rendered_counts[tab] = 0
        self.console.config(state=tk.NORMAL)
        self.console.delete("1.0", tk.END)
        self.console.config(state=tk.DISABLED)
        
        # Instantly poll log redraw
        self.poll_realtime_logs()

    def on_search_keypress(self, event):
        self.search_query = self.ent_search.get()
        # Reset counters to re-trigger complete matching filter insertion
        self.rendered_counts[self.current_tab] = 0
        self.console.config(state=tk.NORMAL)
        self.console.delete("1.0", tk.END)
        self.console.config(state=tk.DISABLED)
        
        self.poll_realtime_logs()

    def poll_realtime_logs(self):
        current_deque = log_buffers[self.current_tab]
        total_available = len(current_deque)
        rendered = self.rendered_counts[self.current_tab]
        
        if total_available < rendered:
            # Logs were cleared globally! Reset viewport
            self.console.config(state=tk.NORMAL)
            self.console.delete("1.0", tk.END)
            self.console.config(state=tk.DISABLED)
            rendered = 0
            self.rendered_counts[self.current_tab] = 0
            
        if total_available > rendered:
            self.console.config(state=tk.NORMAL)
            for i in range(rendered, total_available):
                entry = current_deque[i]
                
                # Filter text matches
                if not self.search_query or self.search_query.lower() in entry["line"].lower():
                    self.insert_log_line_with_ansi(entry["service"], entry["timestamp"], entry["line"])
                    
            self.console.config(state=tk.DISABLED)
            self.rendered_counts[self.current_tab] = total_available
            
            if self.auto_scroll_var.get():
                self.console.see(tk.END)
                
        # Fast 100ms real-time loop updates
        self.root.after(100, self.poll_realtime_logs)

    def insert_log_line_with_ansi(self, service: str, timestamp: str, line: str):
        # Monospace prefixing
        self.console.insert(tk.END, f"[{timestamp}] ", "time")
        
        ch_tag = f"ch_{service}"
        ch_label = "TUNNEL" if service == "ssh" else "LIVE" if service == "live" else service.upper()
        self.console.insert(tk.END, f"[{ch_label:8}] ", ch_tag)
        
        # Split line by ANSI color sequences using regex
        ansi_regex = re.compile(r'\x1b\[([0-9;]*)m')
        parts = ansi_regex.split(line)
        
        current_tag = service
        
        for idx, part in enumerate(parts):
            if idx % 2 == 1:
                # ANSI code part
                code = part
                if code == "0":
                    current_tag = service
                elif code in ["31", "1;31"]:
                    current_tag = "error" # Crimson red
                elif code in ["32", "1;32"]:
                    current_tag = "info"  # Emerald green
                elif code in ["33", "1;33"]:
                    current_tag = "warn"  # Amber yellow
                elif code in ["34", "1;34"]:
                    current_tag = "blue"
                elif code in ["35", "1;35"]:
                    current_tag = "magenta"
                elif code in ["36", "1;36"]:
                    current_tag = "ssh" if service == "ssh" else "info"
                elif code in ["90"]:
                    current_tag = "time"  # Muted gray
            else:
                # Text content part
                clean_text = part.replace("\x1b", "")
                
                # Keywords highlighting as secondary check
                tag_to_apply = current_tag
                if current_tag == service:
                    lower_text = clean_text.lower()
                    if "error" in lower_text or "exception" in lower_text or "failed" in lower_text:
                        tag_to_apply = "error"
                    elif "warning" in lower_text or "warn" in lower_text:
                        tag_to_apply = "warn"
                    elif "success" in lower_text or "running" in lower_text or "ready in" in lower_text:
                        tag_to_apply = "info"
                
                # Check for highlighted search match
                if self.search_query:
                    self.insert_text_with_search_highlights(clean_text, tag_to_apply)
                else:
                    self.console.insert(tk.END, clean_text, tag_to_apply)

    def insert_text_with_search_highlights(self, text: str, tag_to_apply: str):
        try:
            # Case insensitive match splits
            parts = re.split(f"({re.escape(self.search_query)})", text, flags=re.IGNORECASE)
            for part in parts:
                if part.lower() == self.search_query.lower():
                    self.console.insert(tk.END, part, "search")
                else:
                    self.console.insert(tk.END, part, tag_to_apply)
        except Exception:
            self.console.insert(tk.END, text, tag_to_apply)

    def clear_logs_ui(self):
        log_buffers["all"].clear()
        log_buffers["ssh"].clear()
        log_buffers["backend"].clear()
        log_buffers["frontend"].clear()
        log_buffers["live"].clear()
        
        self.console.config(state=tk.NORMAL)
        self.console.delete("1.0", tk.END)
        self.console.config(state=tk.DISABLED)
        
        for k in self.rendered_counts:
            self.rendered_counts[k] = 0

    def export_logs_ui(self):
        active_logs = list(log_buffers[self.current_tab])
        if not active_logs:
            messagebox.showinfo("Export Logs", "There are no log lines in this tab to export.")
            return
            
        try:
            # Save file automatically in root folder
            export_filename = f"digifort_desktop_logs_{self.current_tab}_{int(time.time())}.txt"
            export_path = os.path.join(os.path.dirname(CURRENT_DIR), export_filename)
            
            with open(export_path, "w", encoding="utf-8") as f:
                f.write(f"DIGIFORT NATIVE DESKTOP MANAGER CONSOLE LOGS - {self.current_tab.upper()}\n")
                f.write(f"EXPORTED AT: {datetime.now().isoformat()}\n")
                f.write("=========================================================================\n\n")
                
                for entry in active_logs:
                    # Strip ANSI sequence color codes for txt clean viewing
                    clean_line = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', entry["line"])
                    f.write(f"[{entry['timestamp']}] [{entry['service'].upper()}] {clean_line}")
                    
            messagebox.showinfo("Export Success", f"Logs successfully exported to:\n{export_path}")
        except Exception as e:
            messagebox.showerror("Export Failed", f"Could not export log files: {e}")

    def on_close_app(self):
        # Prompts verification or handles graceful kills of subprocesses
        confirm = messagebox.askyesno(
            "Close Server Manager", 
            "Are you sure you want to exit?\nThis will stop all running servers (SSH Tunnel, FastAPI, Next.js)."
        )
        if confirm:
            print("Shutting down active processes...")
            
            # Hide tray icon before exiting
            if self.tray_icon:
                self.tray_icon.stop()
                
            for service, state in services_state.items():
                pid = state["pid"]
                if pid:
                    print(f"Stopping subprocess tree for {service} (PID: {pid})...")
                    terminate_process_tree(pid)
            
            # Destroy TK context
            self.root.destroy()
            sys.exit(0)

if __name__ == "__main__":
    root = tk.Tk()
    app = DesktopApp(root)
    root.mainloop()
