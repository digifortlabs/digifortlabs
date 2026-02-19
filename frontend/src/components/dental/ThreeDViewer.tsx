
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';

function ModelViewer({ url }: { url: string }) {
    // Note: In a real app we would use useLoader(STLLoader, url) for .stl files
    // For demo/prototype we will stick to GLTF/GLB or a basic shape if not provided
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="teal" />
        </mesh>
    );
}

export default function ThreeDViewer({ fileUrl }: { fileUrl: string }) {
    return (
        <div className="h-[400px] w-full bg-slate-900 rounded-xl overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Interactive 3D View
            </div>
            <Canvas shadows camera={{ position: [0, 0, 4], fov: 50 }}>
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6}>
                        {/* Replace with actual model loader in future */}
                        <mesh rotation={[0, Math.PI / 4, 0]}>
                            <torusKnotGeometry args={[1, 0.3, 128, 16]} />
                            <meshStandardMaterial color="#2dd4bf" roughness={0.1} metalness={0.5} />
                        </mesh>
                    </Stage>
                </Suspense>
                <OrbitControls autoRotate />
            </Canvas>
        </div>
    );
}
