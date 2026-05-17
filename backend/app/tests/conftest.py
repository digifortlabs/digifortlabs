import os
import dotenv

# Set the environment variable immediately before any imports happen
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

# Intercept load_dotenv calls to ensure it doesn't get overridden by .env file
original_load_dotenv = dotenv.load_dotenv
def custom_load_dotenv(*args, **kwargs):
    res = original_load_dotenv(*args, **kwargs)
    os.environ["DATABASE_URL"] = "sqlite:///./test.db"
    return res
dotenv.load_dotenv = custom_load_dotenv
