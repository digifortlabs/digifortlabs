import os

from cryptography.fernet import Fernet

# Generates a key if not exists (In prod, store this securely in ENV/Secrets Manager)
# For this project, we might use a fixed key or one from env.
KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())

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
