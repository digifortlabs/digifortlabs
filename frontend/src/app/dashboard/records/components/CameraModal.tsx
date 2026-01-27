import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const confirmCapture = async () => {
        if (!imgSrc) return;

        // Convert base64 to File
        const res = await fetch(imgSrc);
        const blob = await res.blob();
        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

        onCapture(file);
        onClose();
        setImgSrc(null); // Reset for next time
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-lg bg-white rounded-xl overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Camera size={20} /> Capture Document
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-black relative aspect-video flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                        <img src={imgSrc} alt="Captured" className="w-full h-full object-contain" />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                facingMode: "environment",
                                width: { ideal: 1280 },
                                height: { ideal: 720 }
                            }} // Use back camera on mobile with higher res
                            className="w-full h-full object-contain"
                            onUserMediaError={(err) => alert("Camera Error: " + (typeof err === 'string' ? err : err.message || "Could not access camera."))}
                        />
                    )}
                </div>

                <div className="p-4 flex justify-center gap-4 bg-gray-50">
                    {!imgSrc ? (
                        <button
                            onClick={capture}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg"
                        >
                            <Camera size={20} /> Capture
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={retake}
                                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition"
                            >
                                <RefreshCw size={18} /> Retake
                            </button>
                            <button
                                onClick={confirmCapture}
                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
                            >
                                <Check size={20} /> Use Photo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
