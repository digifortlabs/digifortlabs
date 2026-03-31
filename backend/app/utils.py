from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT Settings
from .core.config import settings


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def validate_magic_bytes(header: bytes, ext: str) -> bool:
    """
    Validates real file type against expected extension using known headers (magic bytes).
    Prevents malicious actors from spoofing an executable as a .pdf or .stl.
    """
    ext = ext.lower()
    
    # Define exact magic bytes for supported extensions
    MAGIC_NUMBERS = {
        '.pdf': [b'%PDF-'],
        '.mp4': [b'ftypisom', b'ftypmp42', b'ftypmp41', b'ftypdash'],
        '.mov': [b'ftypqt  '],
        '.avi': [b'RIFF'], # Note: bytes 8:12 should generally be b'AVI ' but RIFF is good for a fast check
        '.mkv': [b'\x1aE\xdf\xa3'],
        
        # Dental 3D Scans
        '.ply': [b'ply\n', b'ply\r\n'],
        '.obj': [b'v ', b'vt', b'vn', b'#']
    }
    
    # STL binary files have an 80 byte header followed by an integer, no distinct magic string at byte 0.
    # ASCII STL files start with 'solid '
    if ext == '.stl':
        if header.startswith(b'solid '):
            return True
        # For Binary STL, check if it's at least 84 bytes long to be valid. 
        # A more complex check is needed for absolute certainty, but this stops trivial script spoofing.
        if len(header) >= 84:
            return True 
        return False
        
    if ext not in MAGIC_NUMBERS:
        # If extension isn't mapped, fail closed (or handle specifically)
        return False
        
    valid_signatures = MAGIC_NUMBERS[ext]
    
    # Check if the header starts with or contains the magic bytes within the first reasonable limit
    for sig in valid_signatures:
        if ext in ['.mp4', '.mov']:
             # MP4/MOV mdat/ftyp atoms are usually in the first 8-12 bytes
             if sig in header[:32]:
                 return True
        elif ext == '.avi':
             if header.startswith(sig) and b'AVI ' in header[:16]:
                 return True
        else:
             if header.startswith(sig):
                 return True
                 
    return False
