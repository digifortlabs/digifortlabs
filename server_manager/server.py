import os
import sys
import json
import socket
import asyncio
import threading
import subprocess
import time
import psutil
from datetime import datetime
from typing import Dict, List, Optional
from collections import deque
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Initialize FastAPI App
app = FastAPI(title="Digifort Localhost Server Manager")

# CORS Middleware to support access from local network
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
ENV_FILE = os.path.join(BACKEND_DIR, ".env")
KEY_FILE = os.path.join(BASE_DIR, "digifort-prod-key.pem")

# State Management
services_state: Dict[str, Dict] = {
    "ssh": {
        "name": "SSH Database Tunnel",
        "status": "stopped",
        "pid": None,
        "port": 5433,
        "process": None,
        "start_time": None,
        "command": "",
        "health": "offline"
    },
    "backend": {
        "name": "FastAPI Backend",
        "status": "stopped",
        "pid": None,
        "port": 8000,
        "process": None,
        "start_time": None,
        "command": "",
        "health": "offline"
    },
    "frontend": {
        "name": "Next.js Frontend",
        "status": "stopped",
        "pid": None,
        "port": 3000,
        "process": None,
        "start_time": None,
        "command": "",
        "health": "offline"
    },
    "live": {
        "name": "AWS Live Server",
        "status": "stopped",
        "pid": None,
        "port": None,
        "process": None,
        "start_time": None,
        "command": "",
        "health": "offline"
    },
    "ocr_worker": {
        "name": "Distributed OCR Worker",
        "status": "stopped",
        "pid": None,
        "port": None,
        "process": None,
        "start_time": None,
        "command": "",
        "health": "offline"
    }
}

# Metrics State Management
metrics_state: Dict[str, Dict] = {
    "local": {"cpu": 0, "ram": 0, "total_ram": 0},
    "ssh": {"cpu": 0, "ram": 0},
    "backend": {"cpu": 0, "ram": 0},
    "frontend": {"cpu": 0, "ram": 0},
    "live": {"cpu": 0, "ram": 0, "total_ram": 0, "status": "offline"},
    "ocr_worker": {"cpu": 0, "ram": 0}
}

aws_metrics_process = None

def start_aws_metrics_thread(target_ip: str):
    global aws_metrics_process
    if aws_metrics_process:
        try:
            aws_metrics_process.kill()
        except:
            pass
            
    cmd_args = [
        "ssh", "-i", KEY_FILE, 
        "-o", "StrictHostKeyChecking=no", 
        f"ec2-user@{target_ip}",
        "while true; do echo '---METRICS---'; top -b -n 1 | grep 'Cpu(s)'; free -m | grep Mem; sleep 5; done"
    ]
    
    aws_metrics_process = subprocess.Popen(
        cmd_args,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        bufsize=1,
        text=True,
        cwd=BASE_DIR,
        creationflags=subprocess.CREATE_NO_WINDOW
    )
    
    def reader():
        try:
            for line in iter(aws_metrics_process.stdout.readline, ""):
                if "Cpu(s):" in line:
                    parts = line.split(",")
                    try:
                        us_part = parts[0].split(":")[1].strip().split()[0]
                        sy_part = parts[1].strip().split()[0]
                        metrics_state["live"]["cpu"] = round(float(us_part) + float(sy_part), 1)
                    except:
                        pass
                elif "Mem:" in line:
                    parts = line.split()
                    try:
                        total = float(parts[1])
                        used = float(parts[2])
                        metrics_state["live"]["total_ram"] = round(total / 1024, 2)
                        metrics_state["live"]["ram"] = round(used / 1024, 2)
                        metrics_state["live"]["status"] = "online"
                    except:
                        pass
        except Exception:
            pass
            
    t = threading.Thread(target=reader, daemon=True)
    t.start()

def stop_aws_metrics_thread():
    global aws_metrics_process
    if aws_metrics_process:
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(aws_metrics_process.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass
        aws_metrics_process = None
        metrics_state["live"]["status"] = "offline"

# Deque logs buffer (Ring buffers)
log_buffers = {
    "ssh": deque(maxlen=5000),
    "backend": deque(maxlen=5000),
    "frontend": deque(maxlen=5000),
    "live": deque(maxlen=5000),
    "ocr_worker": deque(maxlen=5000),
    "backup": deque(maxlen=5000),
    "all": deque(maxlen=20000)
}

backup_jobs_state = {
    "ec2-db": {"status": "idle"},
    "ec2-files": {"status": "idle"},
    "s3-pull": {"status": "idle"}
}

# Persistent log file path
LOGS_DIR = os.path.join(BASE_DIR, "server_manager", "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOGS_DIR, f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

active_connections: List[WebSocket] = []
main_loop = None

# Helper: Get Local LAN IP Address
def get_local_ip() -> str:
    try:
        # Connect to a dummy external address to find the interface ip
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# Helper: Get AWS EC2 Public IP dynamically, matching start_dev.ps1 logic
def fetch_ec2_ip() -> str:
    default_ip = "digifortlabs.com"
    instance_id = "i-0c5834fb0e0fe22e6"
    region = "ap-south-1"
    
    print("Fetching EC2 Public IP from AWS CLI...")
    try:
        result = subprocess.run(
            ["aws", "ec2", "describe-instances", "--instance-ids", instance_id, "--region", region, 
             "--query", "Reservations[0].Instances[0].PublicIpAddress", "--output", "text"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )
        ip = result.stdout.strip()
        if ip and ip != "None" and not ip.startswith("An error"):
            print(f"Discovered EC2 Public IP: {ip}")
            return ip
    except Exception as e:
        print(f"Could not fetch EC2 IP dynamically, using default. Details: {e}")
    
    print(f"Using default IP: {default_ip}")
    return default_ip

# Helper: Load env variables from backend/.env
def load_env_variables() -> Dict[str, str]:
    env_vars = os.environ.copy()
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    parts = line.split("=", 1)
                    key = parts[0].strip()
                    val = parts[1].strip().strip('"').strip("'")
                    env_vars[key] = val
    return env_vars

def sync_broadcast_log_entry(service: str, line: str):
    log_entry = {
        "service": service,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "line": line
    }

    # Store in history
    log_buffers[service].append(log_entry)
    log_buffers["all"].append(log_entry)

    # Persist to session log file (strip ANSI for readability)
    try:
        import re as _re
        clean = _re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', line)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{log_entry['timestamp']}] [{service.upper()}] {clean}")
    except Exception:
        pass
    return log_entry

async def broadcast_log_entry(service: str, line: str):
    log_entry = sync_broadcast_log_entry(service, line)
    await broadcast_websockets_only(log_entry)

# Broadcast logs to websocket clients
async def broadcast_websockets_only(log_entry: dict):
    
    # Broadcast log entry + running counts to live WebSockets
    count_update = {
        "type": "counts",
        "counts": {k: len(v) for k, v in log_buffers.items()}
    }
    if active_connections:
        dead_connections = []
        for ws in active_connections:
            try:
                await ws.send_json(log_entry)
                await ws.send_json(count_update)
            except Exception:
                dead_connections.append(ws)

        # Clean up dead sockets
        for ws in dead_connections:
            if ws in active_connections:
                active_connections.remove(ws)

# Log reader loop for standard output/error pipes (runs in background threads)
def log_reader_thread(process: subprocess.Popen, service: str, pipe):
    global main_loop
    try:
        # Read line-by-line as it flushes in real-time
        for raw_line in iter(pipe.readline, b""):
            try:
                line = raw_line.decode("utf-8", errors="replace")
            except Exception:
                line = raw_line.decode("latin-1", errors="replace")
            decoded_line = line.replace("\r", "")
            if decoded_line.strip():
                log_entry = sync_broadcast_log_entry(service, decoded_line)
                if main_loop:
                    try:
                        asyncio.run_coroutine_threadsafe(
                            broadcast_websockets_only(log_entry),
                            main_loop
                        )
                    except Exception:
                        pass
    except Exception as e:
        import traceback
        err_msg = f"Log reader thread for {service} encountered exception:\n{traceback.format_exc()}"
        print(err_msg)
        if main_loop:
            asyncio.run_coroutine_threadsafe(
                broadcast_log_entry(service, f"ERROR: {err_msg}\n"),
                main_loop
            )
    finally:
        process.poll()
        if process.returncode is not None:
            if main_loop:
                asyncio.run_coroutine_threadsafe(
                    handle_service_exit(service, process.returncode),
                    main_loop
                )



# Async Helper: Handle Process Exits
async def handle_service_exit(service: str, exit_code: int):
    state = services_state[service]
    if state["status"] == "running":
        if exit_code != 0:
            state["status"] = "error"
        else:
            state["status"] = "stopped"
        state["pid"] = None
        state["process"] = None
        state["start_time"] = None
        if exit_code != 0:
            exit_msg = f"\n>>> [PROCESS CRASHED] Service '{state['name']}' exited with error code {exit_code}\n"
        else:
            exit_msg = f"\n>>> [PROCESS TERMINATED] Service '{state['name']}' exited with code {exit_code}\n"
        await broadcast_log_entry(service, exit_msg)# Clean process termination tree on Windows
def terminate_process_tree(pid: int):
    try:
        # Force terminate process and all child processes recursively
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except Exception as e:
        print(f"Error terminating process tree for PID {pid}: {e}")

# Service Launcher Methods
async def start_service(service: str) -> bool:
    state = services_state[service]
    if state["status"] == "running" or state["status"] == "starting":
        return True

    state["status"] = "starting"
    env = load_env_variables()
    local_db_port = 5433

    try:
        if service == "ssh":
            target_ip = fetch_ec2_ip()
            cmd_args = [
                "ssh", "-i", KEY_FILE, "-N", 
                "-L", f"{local_db_port}:localhost:5432", 
                "-L", "8080:localhost:8080",
                f"ec2-user@{target_ip}", 
                "-o", "StrictHostKeyChecking=no", 
                "-o", "ServerAliveInterval=60"
            ]
            state["command"] = " ".join(cmd_args)
            
            # Start process
            p = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
                cwd=BASE_DIR,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            state["process"] = p
            state["pid"] = p.pid
            state["status"] = "running"
            state["start_time"] = datetime.now().isoformat()

            # Launch log scanner thread
            t = threading.Thread(target=log_reader_thread, args=(p, "ssh", p.stdout), daemon=True)
            t.start()

            await broadcast_log_entry("ssh", f">>> Starting SSH Database Tunnel with PID {p.pid} to {target_ip}...\n")

        elif service == "backend":
            # Set up virtual environment python path
            venv_paths = [
                os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe"),
                os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe"),
                os.path.join(BACKEND_DIR, "env", "Scripts", "python.exe"),
            ]
            python_exe = "python"
            for vp in venv_paths:
                if os.path.exists(vp):
                    python_exe = vp
                    break
            
            db_user = env.get("POSTGRES_USER", "digifort_admin")
            db_pass = env.get("POSTGRES_PASSWORD", "Digif0rtlab$")
            db_name = env.get("POSTGRES_DB", "digifort_db")
            
            # Bind to 0.0.0.0 so the network can access it
            env["DATABASE_URL"] = f"postgresql://{db_user}:{db_pass}@localhost:{local_db_port}/{db_name}"
            
            cmd_args = [
                python_exe, "-u", "-m", "uvicorn", "app.main:app", 
                "--reload", "--host", "0.0.0.0", "--port", "8000"
            ]
            state["command"] = " ".join(cmd_args)
            
            # Force Python unbuffered output
            env["PYTHONUNBUFFERED"] = "1"

            p = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
                cwd=BACKEND_DIR,
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            state["process"] = p
            state["pid"] = p.pid
            state["status"] = "running"
            state["start_time"] = datetime.now().isoformat()

            t = threading.Thread(target=log_reader_thread, args=(p, "backend", p.stdout), daemon=True)
            t.start()

            await broadcast_log_entry("backend", f">>> Starting Backend Server with PID {p.pid} (access at port 8000)...\n")

        elif service == "frontend":
            # Use node directly to avoid cmd.exe wrapper swallowing stdout
            node_exe = "node"
            next_script = os.path.join(FRONTEND_DIR, "node_modules", ".bin", "next")
            if os.name == 'nt':
                next_script = os.path.join(FRONTEND_DIR, "node_modules", "next", "dist", "bin", "next")

            cmd_args = [node_exe, next_script, "dev", "-H", "0.0.0.0", "-p", "3000"]
            state["command"] = " ".join(cmd_args)

            # Force Node.js to flush stdout immediately
            fe_env = load_env_variables()
            fe_env["NODE_NO_WARNINGS"] = "1"
            fe_env["NEXT_TELEMETRY_DISABLED"] = "1"
            fe_env["FORCE_COLOR"] = "0"

            p = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
                cwd=FRONTEND_DIR,
                env=fe_env,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            state["process"] = p
            state["pid"] = p.pid
            state["status"] = "running"
            state["start_time"] = datetime.now().isoformat()

            t = threading.Thread(target=log_reader_thread, args=(p, "frontend", p.stdout), daemon=True)
            t.start()

            await broadcast_log_entry("frontend", f">>> Starting Frontend Server with PID {p.pid} (access at port 3000)...\n")
        
        elif service == "live":
            target_ip = fetch_ec2_ip()
            cmd_args = [
                "ssh", "-i", KEY_FILE, 
                "-o", "StrictHostKeyChecking=no", 
                "-o", "ServerAliveInterval=60",
                f"ec2-user@{target_ip}",
                "pm2 logs --raw"
            ]
            state["command"] = " ".join(cmd_args)
            
            # Start background metrics stream
            start_aws_metrics_thread(target_ip)
            
            p = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
                cwd=BASE_DIR,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            state["process"] = p
            state["pid"] = p.pid
            state["status"] = "running"
            state["start_time"] = datetime.now().isoformat()

            t = threading.Thread(target=log_reader_thread, args=(p, "live", p.stdout), daemon=True)
            t.start()

            await broadcast_log_entry("live", f">>> Streaming Live Server PM2 logs from {target_ip}...\n")
        elif service == "ocr_worker":
            worker_script = os.path.join(BACKEND_DIR, "local_ocr_worker.py")
            python_bin = os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe") if os.name == 'nt' else os.path.join(BACKEND_DIR, ".venv", "bin", "python")
            cmd_args = [python_bin, worker_script]
            state["command"] = " ".join(cmd_args)
            
            # Smart Desktop App: Force OCR to be active if started manually from the UI
            env = load_env_variables()
            env["OCR_FORCE_ACTIVE"] = "1"
            
            p = subprocess.Popen(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                bufsize=0,
                cwd=BACKEND_DIR,
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            state["process"] = p
            state["pid"] = p.pid
            state["status"] = "running"
            state["start_time"] = datetime.now().isoformat()
            
            t = threading.Thread(target=log_reader_thread, args=(p, "ocr_worker", p.stdout), daemon=True)
            t.start()
            
            await broadcast_log_entry("ocr_worker", f">>> Starting Distributed OCR Worker (PID {p.pid})...\n")
        
        return True
    except Exception as e:
        state["status"] = "error"
        error_msg = f">>> [ERROR] Failed to start service '{service}': {str(e)}\n"
        await broadcast_log_entry(service, error_msg)
        return False

async def stop_service(service: str) -> bool:
    state = services_state[service]
    if state["status"] == "stopped" or not state["pid"]:
        state["status"] = "stopped"
        state["pid"] = None
        state["process"] = None
        state["start_time"] = None
        return True

    pid = state["pid"]
    await broadcast_log_entry(service, f">>> Stopping service '{state['name']}' (PID: {pid})...\n")
    
    # Use robust tree killer to kill the shell + children
    terminate_process_tree(pid)
    
    # Mark as stopped
    state["status"] = "stopped"
    state["pid"] = None
    state["process"] = None
    state["start_time"] = None
    
    if service == "live":
        stop_aws_metrics_thread()
    
    await broadcast_log_entry(service, f">>> Service '{state['name']}' stopped successfully.\n")
    return True

def health_checker_worker():
    import time
    import socket
    import urllib.request

    while True:
        # 1. Check SSH Tunnel (local port 5433 open?)
        ssh_health = "offline"
        if services_state["ssh"]["status"] == "running":
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                s.connect(("127.0.0.1", 5433))
                s.close()
                ssh_health = "online"
            except Exception:
                ssh_health = "offline"
        
        # 2. Check Backend (http://localhost:8000/health)
        backend_health = "offline"
        if services_state["backend"]["status"] == "running":
            try:
                req = urllib.request.Request("http://localhost:8000/health")
                with urllib.request.urlopen(req, timeout=0.8) as response:
                    if response.status == 200:
                        backend_health = "online"
            except Exception:
                backend_health = "offline"

        # 3. Check Frontend (http://localhost:3000)
        frontend_health = "offline"
        if services_state["frontend"]["status"] == "running":
            try:
                req = urllib.request.Request("http://localhost:3000")
                with urllib.request.urlopen(req, timeout=0.8) as response:
                    if response.status == 200:
                        frontend_health = "online"
            except Exception:
                frontend_health = "offline"

        # 4. Check AWS Live Server (https://digifortlabs.com/api/platform/health)
        live_health = "offline"
        if services_state["live"]["status"] == "running":
            try:
                req = urllib.request.Request("https://digifortlabs.com/api/platform/health")
                with urllib.request.urlopen(req, timeout=1.5) as response:
                    if response.status == 200:
                        live_health = "online"
            except Exception:
                live_health = "offline"

        # 5. Check OCR Worker (simply online if status is running)
        ocr_health = "offline"
        if services_state["ocr_worker"]["status"] == "running":
            ocr_health = "online"

        # Update health states in real-time
        services_state["ssh"]["health"] = ssh_health
        services_state["backend"]["health"] = backend_health
        services_state["frontend"]["health"] = frontend_health
        services_state["live"]["health"] = live_health
        services_state["ocr_worker"]["health"] = ocr_health

        time.sleep(3)

def metrics_checker_worker():
    while True:
        try:
            # Overall local CPU / RAM
            metrics_state["local"]["cpu"] = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory()
            metrics_state["local"]["ram"] = round(mem.used / (1024*1024*1024), 2)
            metrics_state["local"]["total_ram"] = round(mem.total / (1024*1024*1024), 2)
            
            # Per-service CPU/RAM
            for s_name in ["ssh", "backend", "frontend", "ocr_worker"]:
                pid = services_state[s_name].get("pid")
                if pid:
                    try:
                        p = psutil.Process(pid)
                        cpu = p.cpu_percent(interval=None)
                        mem_info = p.memory_info().rss
                        for child in p.children(recursive=True):
                            try:
                                cpu += child.cpu_percent(interval=None)
                                mem_info += child.memory_info().rss
                            except psutil.NoSuchProcess:
                                pass
                        metrics_state[s_name]["cpu"] = round(cpu, 1)
                        metrics_state[s_name]["ram"] = round(mem_info / (1024*1024), 1)
                    except psutil.NoSuchProcess:
                        metrics_state[s_name]["cpu"] = 0
                        metrics_state[s_name]["ram"] = 0
                else:
                    metrics_state[s_name]["cpu"] = 0
                    metrics_state[s_name]["ram"] = 0
        except Exception:
            pass
        time.sleep(2)

# API Endpoints
@app.get("/api/metrics")
async def get_metrics():
    return JSONResponse(content=metrics_state)

@app.get("/api/status")
async def get_status():
    local_ip = get_local_ip()
    status_data = {}
    for k, v in services_state.items():
        status_data[k] = {
            "name": v["name"],
            "status": v["status"],
            "pid": v["pid"],
            "port": v["port"],
            "start_time": v["start_time"],
            "command": v["command"],
            "health": v.get("health", "offline"),
            "local_url": f"http://localhost:{v['port']}" if k != "ssh" else "N/A",
            "lan_url": f"http://{local_ip}:{v['port']}" if k != "ssh" else "N/A"
        }
    return JSONResponse(content={
        "services": status_data,
        "local_ip": local_ip,
        "manager_url": f"http://{local_ip}:8050"
    })

@app.post("/api/start/{service}")
async def start_endpoint(service: str):
    if service not in services_state:
        return JSONResponse(status_code=400, content={"error": f"Unknown service: {service}"})
    
    success = await start_service(service)
    return JSONResponse(content={"success": success, "status": services_state[service]["status"]})

@app.post("/api/stop/{service}")
async def stop_endpoint(service: str):
    if service not in services_state:
        return JSONResponse(status_code=400, content={"error": f"Unknown service: {service}"})
    
    success = await stop_service(service)
    return JSONResponse(content={"success": success, "status": services_state[service]["status"]})

@app.post("/api/restart/{service}")
async def restart_endpoint(service: str):
    if service not in services_state:
        return JSONResponse(status_code=400, content={"error": f"Unknown service: {service}"})
    
    await stop_service(service)
    # small delay to release port
    await asyncio.sleep(1.5)
    success = await start_service(service)
    return JSONResponse(content={"success": success, "status": services_state[service]["status"]})

@app.get("/api/logs/{service}")
async def get_historical_logs(service: str):
    if service not in log_buffers:
        return JSONResponse(status_code=400, content={"error": f"Unknown log service: {service}"})
    return JSONResponse(content=list(log_buffers[service]))

@app.get("/api/logs/counts")
async def get_log_counts():
    return JSONResponse(content={k: len(v) for k, v in log_buffers.items()})

@app.get("/api/logs/file")
async def get_log_file_path():
    return JSONResponse(content={"path": LOG_FILE, "exists": os.path.exists(LOG_FILE)})

@app.get("/api/config")
async def get_config():
    env = load_env_variables()
    display_keys = [
        "POSTGRES_USER", "POSTGRES_DB", "AWS_ACCESS_KEY_ID", 
        "AWS_REGION", "S3_BUCKET_NAME", "PROJECT_NAME", "ENVIRONMENT"
    ]
    safe_config = {}
    for key in display_keys:
        if key in env:
            safe_config[key] = env[key]
    return JSONResponse(content=safe_config)

@app.get("/api/backup/status")
async def get_backup_status():
    return JSONResponse(content=backup_jobs_state)

def run_backup_task_sync(task_id: str, cmd_lists: List[List[str]], cwd: str):
    backup_jobs_state[task_id]["status"] = "running"
    def log_sync(msg):
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(broadcast_log_entry("backup", msg))
            loop.close()
        except: pass

    log_sync(f">>> Starting Backup Task: {task_id}\n")
    try:
        for cmd_list in cmd_lists:
            p = subprocess.Popen(
                cmd_list,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                cwd=cwd,
                text=True,
                bufsize=1,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            for line in iter(p.stdout.readline, ""):
                log_sync(line)
            p.wait()
            if p.returncode != 0:
                log_sync(f"\x1b[31m>>> Task {task_id} failed with exit code {p.returncode}\x1b[0m\n")
                backup_jobs_state[task_id]["status"] = "idle"
                return
        log_sync(f">>> Task {task_id} completed successfully.\n")
    except Exception as e:
        log_sync(f"\x1b[31m>>> Error executing {task_id}: {str(e)}\x1b[0m\n")
    backup_jobs_state[task_id]["status"] = "idle"

@app.post("/api/backup/{task_id}")
async def trigger_backup(task_id: str, target_dir: str = None):
    if task_id not in backup_jobs_state:
        return JSONResponse(status_code=400, content={"error": "Invalid task ID"})
    if backup_jobs_state[task_id]["status"] == "running":
        return JSONResponse(status_code=400, content={"error": "Task already running"})
        
    if target_dir:
        backup_dir = target_dir
    else:
        now_str = datetime.now().strftime("%Y-%m-%d")
        backup_dir = os.path.join("E:\\", f"Backup_{now_str}")
        
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir, exist_ok=True)
        
    pem_file = os.path.join(BASE_DIR, "digifort-prod-key.pem")
    ec2_user = "ec2-user@15.206.86.130"
    
    cmd_lists = []
    if task_id == "ec2-db":
        cmd_lists = [
            [
                "ssh", "-i", pem_file, "-o", "StrictHostKeyChecking=no", ec2_user, 
                "pg_dump postgresql://digifort_admin:'Digif0rtlab$'@127.0.0.1:5432/digifort_db > digifort_db_backup.sql"
            ],
            [
                "scp", "-i", pem_file, "-o", "StrictHostKeyChecking=no", 
                f"{ec2_user}:/home/ec2-user/digifort_db_backup.sql", os.path.join(backup_dir, "digifort_db_backup.sql")
            ]
        ]
    elif task_id == "ec2-files":
        cmd_lists = [
            [
                "ssh", "-i", pem_file, "-o", "StrictHostKeyChecking=no", ec2_user, 
                "tar -czf digifortlabs_code_backup.tar.gz digifortlabs/"
            ],
            [
                "scp", "-i", pem_file, "-o", "StrictHostKeyChecking=no", 
                f"{ec2_user}:/home/ec2-user/digifortlabs_code_backup.tar.gz", os.path.join(backup_dir, "digifortlabs_code_backup.tar.gz")
            ]
        ]
    elif task_id == "s3-pull":
        s3_dir = os.path.join(backup_dir, "S3_Decrypted")
        if not os.path.exists(s3_dir):
            os.makedirs(s3_dir, exist_ok=True)
        py_exe = os.path.join(BASE_DIR, "backend", ".venv", "Scripts", "python.exe")
        s3_script = os.path.join(BASE_DIR, "backend", "s3_backup.py")
        cmd_lists = [
            [py_exe, s3_script, s3_dir, "a1z-3mNXYRp0yKAcP6xVpX6pjK6O38h039zisZMjE1U="]
        ]
        
    threading.Thread(target=run_backup_task_sync, args=(task_id, cmd_lists, BASE_DIR), daemon=True).start()
    return JSONResponse(content={"status": "started"})

# WebSocket Endpoint for streaming logs in real time
@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print("WebSocket client connected to logs stream.")
    
    # Send historical logs first to hydrate the terminal panel
    hist_logs = list(log_buffers["all"])
    for entry in hist_logs:
        try:
            await websocket.send_json(entry)
        except Exception:
            break
            
    try:
        while True:
            # Keep socket alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)

# Serve Static GUI
static_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)

app.mount("/", StaticFiles(directory=static_path, html=True), name="static")

# Startup event to capture asyncio loop context for threading run_coroutine_threadsafe
@app.on_event("startup")
async def on_startup():
    global main_loop
    main_loop = asyncio.get_event_loop()
    print("Digifort Server Manager Started!")
    print(f"Access Dashboard at: http://localhost:8050")
    print(f"Network Access URL: http://{get_local_ip()}:8050")
    
    # Start background health checker thread
    threading.Thread(target=health_checker_worker, daemon=True).start()
    threading.Thread(target=metrics_checker_worker, daemon=True).start()

# Shutdown cleanup
@app.on_event("shutdown")
async def on_shutdown():
    print("Cleaning up active services before exit...")
    for s in ["ssh", "backend", "frontend", "live", "ocr_worker"]:
        pid = services_state[s]["pid"]
        if pid:
            print(f"Stopping {s} process (PID: {pid})...")
            terminate_process_tree(pid)

if __name__ == "__main__":
    # Bind to 0.0.0.0 so the network can access the server manager itself!
    uvicorn.run("server:app", host="0.0.0.0", port=8050, reload=True)
