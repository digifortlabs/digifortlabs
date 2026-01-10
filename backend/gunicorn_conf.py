
import multiprocessing

# Binding
bind = "0.0.0.0:8001"

# Worker Options
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5

# Logging
loglevel = "info"
accesslog = "-"  # stdout
errorlog = "-"   # stderr

# Environment
raw_env = [
    "ENVIRONMENT=production",
    # "SECRET_KEY=SetThisInEnvironmentVar",
]
