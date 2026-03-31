import os
import logging
from logging.handlers import RotatingFileHandler

# Define standard formats
STANDARD_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
formatter = logging.Formatter(STANDARD_FORMAT)

def setup_logger(name: str, log_file: str, level=logging.INFO):
    """Function to setup as many loggers as you want"""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(log_file)
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5) # 10MB per file, keep 5
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.addHandler(handler)
    
    return logger

def setup_logging():
    """Initializes all system loggers"""
    
    # Base Dir for Logs
    base_dir = os.path.join(os.getcwd(), "logs")
    
    # 1. Auth Logger (Login, Logout, Security)
    setup_logger('auth', os.path.join(base_dir, "auth.log"))
    
    # 2. Activity Logger (File Operations, User Actions)
    setup_logger('activity', os.path.join(base_dir, "activity.log"))
    
    # 3. System Logger (Startup, Errors, Config)
    setup_logger('system', os.path.join(base_dir, "system.log"))
    
    print(f"✅ Logging initialized. Logs writing to: {base_dir}")
