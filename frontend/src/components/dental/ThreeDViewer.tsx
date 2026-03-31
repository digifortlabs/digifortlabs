
'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

function ModelViewer({ url }: { url: string }) {
    const geometry = useLoader(STLLoader, url);

    return (
        <Center>
            <mesh geometry={geometry} castShadow receiveShadow>
                <meshStandardMaterial
                    color="#e2e8f0"
                    roughness={0.3}
                    metalness={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </Center>
    );
}

// Simple Error Boundary component for the Canvas
class ThreeErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

export default function ThreeDViewer({ fileUrl }: { fileUrl: string }) {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
    }, [fileUrl]);

    if (!fileUrl) {
        return (
            <div className="h-[400px] w-full bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 italic">
                Select a scan to view in 3D
            </div>
        );
    }

    const isStl = fileUrl.toLowerCase().split('?')[0].endsWith('.stl');

    if (!isStl) {
        return (
            <div className="h-[400px] w-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <div className="mb-4 text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Unsupported 3D Format</h3>
                <p className="text-sm">This file is not in STL format. Currently, the interactive 3D viewer only supports <b>.stl</b> files.</p>
                <div className="mt-4">
                    <a href={fileUrl} download className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                        Download Raw File
                    </a>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[400px] w-full bg-slate-900 rounded-xl flex flex-col items-center justify-center text-red-400 p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading 3D Model</h3>
                <p className="text-sm">The 3D model could not be displayed. It might be corrupted or the link has expired.</p>
                <button
                    onClick={() => setError(null)}
                    className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full bg-slate-900 rounded-xl overflow-hidden relative shadow-inner border border-slate-800">
            <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                Interactive 3D View (STL)
            </div>

            <ThreeErrorBoundary fallback={
                <div className="h-full w-full flex flex-col items-center justify-center text-red-400 p-6 text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Render Error</h3>
                    <p className="text-sm">There was a problem rendering this 3D scan.</p>
                </div>
            }>
                <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
                    <Suspense fallback={
                        <Html center>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-white text-[10px] font-bold uppercase tracking-wider">Loading 3D Scan...</div>
                            </div>
                        </Html>
                    }>
                        <Stage environment="city" intensity={0.5} shadows="contact">
                            <ModelViewer url={fileUrl} />
                        </Stage>
                    </Suspense>
                    <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
                </Canvas>
            </ThreeErrorBoundary>
        </div>
    );
}
