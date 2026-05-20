import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Key must be provided via environment variable. 
# For AES-GCM, we use the first 32 bytes of the decoded key (if 32 bytes exist).
KEY_STR = os.getenv("ENCRYPTION_KEY")
if not KEY_STR:
    raise RuntimeError("ENCRYPTION_KEY environment variable is not set!")

# Fernet uses the key as-is (base64 string).
# AESGCM needs raw bytes (32 bytes for AES-256).
try:
    RAW_KEY = base64.urlsafe_b64decode(KEY_STR)
    if len(RAW_KEY) < 32:
        # If the key is too short for AES-256, we pad it or use as is for AES-128
        AES_KEY = RAW_KEY[:16].ljust(16, b'\0')
    else:
        AES_KEY = RAW_KEY[:32]
except Exception:
    AES_KEY = KEY_STR.encode()[:32].ljust(32, b'\0')

def encrypt_file(file_path: str) -> str:
    """
    Encrypts a file in place using raw AES-GCM (No Base64 bloat).
    """
    with open(file_path, 'rb') as f:
        data = f.read()
    
    encrypted = encrypt_data(data)
    
    enc_path = file_path + ".enc"
    with open(enc_path, 'wb') as f:
        f.write(encrypted)
        
    return enc_path

MAGIC = b"DIGI"
VERSION = b"\x01"

def encrypt_data(data: bytes) -> bytes:
    """Encrypts bytes using AES-GCM (Raw Binary) with MAGIC prefix."""
    aesgcm = AESGCM(AES_KEY)
    nonce = os.urandom(12)
    # Result is MAGIC + VERSION + nonce + encrypted_data + tag
    return MAGIC + VERSION + nonce + aesgcm.encrypt(nonce, data, None)

def decrypt_file(file_path: str) -> bytes:
    """Decrypts a file and returns bytes. Supports both Fernet and AES-GCM."""
    with open(file_path, 'rb') as f:
        data = f.read()
    return decrypt_data(data)

def decrypt_data(encrypted_bytes: bytes) -> bytes:
    """
    Decrypts bytes and returns original bytes.
    Supports:
    - New 'DIGI' prefixed AES-GCM
    - Legacy Fernet (Base64 encoded tokens)
    """
    if not encrypted_bytes:
        return b""
        
    # 1. Check for New Format
    if encrypted_bytes.startswith(MAGIC):
        try:
            # Skip MAGIC and VERSION
            aesgcm = AESGCM(AES_KEY)
            nonce = encrypted_bytes[5:17]
            ciphertext = encrypted_bytes[17:]
            return aesgcm.decrypt(nonce, ciphertext, None)
        except Exception as e:
            raise ValueError(f"AES-GCM Decryption failed: {str(e)}")
            
    # 2. Try Legacy Fernet
    try:
        fernet = Fernet(KEY_STR.encode())
        return fernet.decrypt(encrypted_bytes)
    except Exception as e:
        raise ValueError(f"Legacy Decryption failed: {str(e)}")
