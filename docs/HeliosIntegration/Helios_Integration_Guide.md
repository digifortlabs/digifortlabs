# Helios 600 Integration Guide

This guide contains the necessary deliverables for integrating a Helios 600 Intraoral scanner with Digifort Labs.

## 1. Local Python Watchdog Script (Scanner Side)
This script monitors the default XML/STL output path of the Helios Scanner. When a new valid file is dumped locally by the Helios app, it POSTs it to the online Digifort Labs endpoint. Install requirements via `pip install watchdog requests`.

```python
# local_scanner_watch.py
import time
import os
import requests
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- CONFIGURATION ---
HELIOS_EXPORT_DIR = r"C:\HeliosData\Export" # Change this to the actual Helios export path on the Windows PC
API_ENDPOINT = "https://digifortlabs.com/api/scans/upload" 
API_KEY = "your-secure-internal-sync-key" # Security token header

class HeliosScanHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            filepath = event.src_path
            # Check for supported specific files 
            ext = os.path.splitext(filepath)[1].lower()
            if ext in ['.stl', '.ply']:
                print(f"[{time.strftime('%X')}] New Helios Scan Detected: {filepath}")
                self.upload_file(filepath)
    
    def upload_file(self, filepath):
        try:
            # Add a slight delay to ensure the Helios software has finished writing to the file
            time.sleep(2) 
            file_name = os.path.basename(filepath)
            
            # Form metadata to simulate a matched record
            metadata_payload = {
                "scanDate": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "scannerType": "Helios 600",
                # "patient_uid": "MOCK-1234" # To bind to a record
            }

            headers = {
                "Authorization": f"Bearer {API_KEY}"
            }

            print(f"[{time.strftime('%X')}] Uploading {file_name} to server...")
            with open(filepath, 'rb') as f:
                response = requests.post(
                    API_ENDPOINT, 
                    headers=headers,
                    data=metadata_payload,
                    files={'scanFile': (file_name, f)}
                )
            
            if response.status_code == 200:
                print(f"[{time.strftime('%X')}] Upload Complete! 200 OK")
            else:
                print(f"[{time.strftime('%X')}] Upload Failed: {response.text}")

        except Exception as e:
            print(f"Error handling file {filepath}: {e}")

if __name__ == "__main__":
    print(f"Starting Helios Monitor on: {HELIOS_EXPORT_DIR}")
    if not os.path.exists(HELIOS_EXPORT_DIR):
        print("Warning: Target Directory does not exist yet.")
    
    event_handler = HeliosScanHandler()
    observer = Observer()
    observer.schedule(event_handler, path=HELIOS_EXPORT_DIR, recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
```

---

## 2. Express API Endpoint (Node.js)
If you decide to route this through a microservice, this Express snippet handles bucket uploads using AWS SDK and multer. 

```javascript
// uploadRoute.js (ExpressJS)
const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const router = express.Router();

// Memory storage to stream directly to S3
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Configure your bucket (e.g., AWS S3 or R2)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

router.post('/api/scans/upload', upload.single('scanFile'), async (req, res) => {
    try {
        // Authenticate (Basic simulation)
        const auth = req.headers.authorization;
        if (!auth || !auth.includes("your-secure-internal-sync-key")) {
            return res.status(401).json({ error: "Unauthorized Client" });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: "No scan file provided" });
        }

        // Extracted metadata fields from python POST payload
        const { scanDate, scannerType, patient_uid } = req.body;

        const uploadParams = {
            Bucket: process.env.S3_SCANS_BUCKET_NAME,
            Key: `helios_scans/${Date.now()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype, // Typically application/octet-stream for STL 
            Metadata: {
                "x-amz-meta-patient-uid": patient_uid || "unknown",
                "x-amz-meta-scanner-type": scannerType || "unknown"
            }
        };

        // Upload to Bucket
        const s3Data = await s3.upload(uploadParams).promise();
        
        return res.status(200).json({
            message: "Scan successfully synchronized",
            cloudUrl: s3Data.Location, 
            filename: file.originalname
        });

    } catch (error) {
        console.error("Scan Upload Error", error);
        return res.status(500).json({ error: "Internal Server Error handling the scan." });
    }
});

module.exports = router;
```

---

## 3. Frontend React Component (3D Model Viewer)
For React apps without native native compilation steps for `.stl`, we suggest using `Three.js` directly over `@google/model-viewer` to render raw `.STL` securely without requiring server transpilation to `GLB`. 

Requirements: `npm install three`

```tsx
// ScanViewer3D.tsx (React Component)
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Loader2 } from 'lucide-react'; 

interface ScanViewerProps {
    fileUrl: string; // The URL returned by S3
    color?: string;
}

const ScanViewer3D: React.FC<ScanViewerProps> = ({ fileUrl, color = "#ffeedd" }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!mountRef.current || !fileUrl) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#f8fafc'); // Match Digifort background

        // Camera Setup
        const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 150);

        // Renderer Setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // Controls (Zoom / Pan / Rotate)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
        hemiLight.position.set(0, 200, 0);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(0, 200, 100);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Load STL
        const loader = new STLLoader();
        loader.load(
            fileUrl,
            (geometry) => {
                const material = new THREE.MeshStandardMaterial({ 
                    color: new THREE.Color(color), 
                    roughness: 0.5,
                    metalness: 0.1 
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // Centering logic
                geometry.computeBoundingBox();
                const boundingBox = geometry.boundingBox!;
                const center = boundingBox.getCenter(new THREE.Vector3());
                geometry.translate(-center.x, -center.y, -center.z);

                // Auto-scale to fit camera securely
                const size = boundingBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 50 / maxDim; // Adjust "50" to fit camera FOV naturally
                mesh.scale.set(scale, scale, scale);
                
                scene.add(mesh);
                setLoading(false);
            },
            (xhr) => {},
            (error) => {
                console.error('Error loading STL', error);
                setLoading(false);
            }
        );

        // Animation Loop
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Responsive Resizing
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            scene.clear();
        };

    }, [fileUrl, color]);

    return (
        <div className="relative w-full h-[400px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-inner">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-2" />
                    <span className="font-bold text-slate-500 text-sm">Loading Helios Model...</span>
                </div>
            )}
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-white/50 text-xs font-bold text-slate-600 pointer-events-none">
                Hint: Left Click to Rotate • Scroll to Zoom
            </div>
        </div>
    );
};

export default ScanViewer3D;
```

---

## 4. Universal Data JSON Schema
Database storage structure for Scans.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Helios Intraoral Scan Metadata",
  "type": "object",
  "required": ["scan_id", "patient_uid", "scan_date", "file_url", "scanner_model"],
  "properties": {
    "scan_id": {
      "type": "string",
      "description": "Unique UUID for this specific scan instance"
    },
    "patient_uid": {
      "type": "string",
      "description": "Foreign key mapping to the Patient's core identifier (e.g. UHID or MRD)"
    },
    "scan_date": {
      "type": "string",
      "format": "date-time",
      "description": "ISO-8601 UTC execution date from the Helios hardware"
    },
    "file_url": {
      "type": "string",
      "format": "uri",
      "description": "S3/Cloud pointer to the uploaded .STL or .PLY file"
    },
    "scanner_model": {
      "type": "string",
      "description": "The exact device used.",
      "enum": ["Helios 600", "Helios 500"]
    },
    "tooth_numbers": {
      "type": "array",
      "description": "FDI World Dental Federation notation identifying which teeth were scanned",
      "items": {
        "type": "integer",
        "minimum": 11,
        "maximum": 85
      }
    },
    "arch_type": {
      "type": "string",
      "enum": ["Upper", "Lower", "Bite", "Full"],
      "description": "Which jaw section was scanned"
    }
  }
}
```
