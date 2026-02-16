import os
import sys
import logging
from unittest.mock import MagicMock, patch

# Add local_scanner to path
sys.path.append(r"d:\Website\DIGIFORTLABS\local_scanner")

# Mock tkinter BEFORE importing scanner_app
sys.modules['tkinter'] = MagicMock()
sys.modules['tkinter.ttk'] = MagicMock()
sys.modules['tkinter.messagebox'] = MagicMock()
sys.modules['cv2'] = MagicMock()
sys.modules['PIL'] = MagicMock()
sys.modules['PIL.Image'] = MagicMock()
sys.modules['PIL.ImageTk'] = MagicMock()
sys.modules['PIL.ImageEnhance'] = MagicMock()
sys.modules['numpy'] = MagicMock()
sys.modules['requests'] = MagicMock()

# Now import the class to test
try:
    from scanner_app import ScannerApp
except ImportError:
    # Fallback if direct import fails due to complex dependencies
    print("Direct import failed. Analyzing file content...")
    sys.exit(1)

# Setup Logger
logging.basicConfig(level=logging.INFO)

def test_upload_filename():
    print("Testing Upload Filename Logic...")

    # Mock parameters
    patient_id = "123"
    mrd_number = "MRD/2026/001" # Contains invalid char '/'
    expected_filename = "MRD_2026_001.pdf"
    
    # Instantiate App Mock (or real class if possible without UI)
    # Since __init__ creates UI, we must mock it or better, just bind the method to a dummy object
    
    class MockApp:
        def __init__(self):
            self.mrd_number = mrd_number
            self.patient_id = patient_id
            self.api_url = "http://localhost:8000"
            self.token = "fake_token"
            self.image_paths = ["dummy.jpg"]
            self.session_dir = "temp_session"
            self.root = MagicMock() # For after() calls

    app = MockApp()

    # We need to call the ACTUAL method from ScannerApp, bound to our mock app
    # But since we can't easily import if dependencies are messy, let's try to patch the specific imports used inside the method
    
    with patch('scanner_app.Image.open') as mock_open:
        mock_img = MagicMock()
        mock_open.return_value = mock_img
        
        with patch('scanner_app.requests.post') as mock_post:
            with patch('builtins.open', MagicMock()): 
                with patch('os.makedirs', MagicMock()):
                    with patch('os.path.exists', return_value=False):
                        with patch('shutil.rmtree', MagicMock()):
                             # Bind the method
                            ScannerApp._upload_worker(app)
            
            # Verify request
            if mock_post.called:
                args, kwargs = mock_post.call_args
                files = kwargs.get('files')
                
                if files:
                    # files can be {'file': ('filename', content)}
                    # or {'file': content}
                    uploaded_file = files.get('file')
                    if isinstance(uploaded_file, tuple):
                        filename = uploaded_file[0]
                    else:
                        filename = "Unknown"
                        
                    print(f"Sent Filename: {filename}")
                    
                    if filename == expected_filename:
                        print("PASS: Filename matches expected sanitized MRD.")
                    else:
                        print(f"FAIL: Expected {expected_filename}, got {filename}")
                else:
                    print("FAIL: No files in upload request.")
            else:
                 print("FAIL: requests.post not called.")

if __name__ == "__main__":
    test_upload_filename()
