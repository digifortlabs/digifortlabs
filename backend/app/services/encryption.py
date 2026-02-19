import os

from cryptography.fernet import Fernet

# Key must be provided via environment variable to ensure consistency across restarts.
# If missing, we raise an error to prevent encrypting files with a volatile key.
KEY = os.getenv("ENCRYPTION_KEY")
if not KEY:
    # During development, we might want a fallback, but in prod it's dangerous.
    # For now, let's use a hardcoded fallback ONLY if not in production, 
    # but the user's .env HAS a key, so we should enforce it.
    raise RuntimeError("ENCRYPTION_KEY environment variable is not set!")

def encrypt_file(file_path: str) -> str:
    """
    Encrypts a file in place or to a new path. 
    Returns path to encrypted file.
    """
    fernet = Fernet(KEY.encode())
    
    with open(file_path, 'rb') as f:
        original = f.read()
        
    encrypted = fernet.encrypt(original)
    
    enc_path = file_path + ".enc"
    with open(enc_path, 'wb') as f:
        f.write(encrypted)
        
    return enc_path

def decrypt_file(file_path: str) -> bytes:
    """
    Decrypts a file and returns bytes.
    """
    with open(file_path, 'rb') as f:
        encrypted = f.read()
    return decrypt_data(encrypted)

def decrypt_data(encrypted_bytes: bytes) -> bytes:
    """
    Decrypts bytes and returns original bytes.
    """
    fernet = Fernet(KEY.encode())
    return fernet.decrypt(encrypted_bytes)
