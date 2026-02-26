import React, { Suspense, useState, useMemo, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
    useGLTF,
    Center,
    OrbitControls,
    Html,
    Environment,
    PerspectiveCamera,
    Preload,
    ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, CheckCircle, Shield, AlertCircle, Zap, Thermometer, Activity, Info, ChevronUp, ChevronDown } from 'lucide-react';
import type { OdontogramData, ToothStatus } from '../types';

// ═══════════════════════════════════════════════════════════════
// MOTOR CLÍNICO V7.1 — DOBLE ARCADA + APERTURA ANIMADA
// ═══════════════════════════════════════════════════════════════

const STATUS_COLORS: Record<string, string> = {
    'Sano': '#f5f5f5',
    'Caries': '#6b2d2d',
    'Tratado': '#2a4dff',
    'Tratado (Oro)': '#ffcc00',
    'Tratado (Zirconia)': '#d4e8ff',
    'Ausente': '#888888',
};

const CameraRig = () => {
    const { camera, scene } = useThree();
    const done = useRef(false);

    useFrame(() => {
        if (done.current) return;
        const box = new THREE.Box3();
        scene.traverse((node) => {
            if (node instanceof THREE.Mesh) box.expandByObject(node);
        });
        if (!box.isEmpty()) {
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
            const dist = (maxDim / 2 / Math.tan(fov / 2)) * 1.5;
            camera.position.set(center.x, center.y, center.z + dist);
            // Miramos un poco más arriba del centro real para que el modelo se vea más abajo
            camera.lookAt(center.x, center.y + 1.5, center.z);
            camera.updateProjectionMatrix();
            done.current = true;
        }
    });
    return null;
};

interface ModelProps {
    data: OdontogramData;
    mouthOpen: boolean;
    onToothClick: (name: string, point: THREE.Vector3) => void;
    onDebug: (info: string) => void;
}

const MandibulaModel = ({ data, mouthOpen, onToothClick, onDebug }: ModelProps) => {
    const { scene } = useGLTF('/mandibula.glb');
    const [hoveredName, setHoveredName] = useState<string | null>(null);
    const toothMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
    const lowerMeshes = useRef<THREE.Mesh[]>([]);
    const openFactor = useRef(0);

    const baseMaterials = useMemo(() => {
        const map: Record<string, THREE.Material> = {};
        Object.entries(STATUS_COLORS).forEach(([status, color]) => {
            map[status] = new THREE.MeshPhysicalMaterial({
                color,
                roughness: status === 'Sano' ? 0.15 : 0.7,
                clearcoat: status === 'Sano' ? 1.0 : 0,
                metalness: status === 'Tratado (Oro)' ? 0.9 : 0,
                ior: 1.45,
            });
        });
        return map;
    }, []);

    useEffect(() => {
        if (!scene) return;
        const identified: string[] = [];
        const lower: THREE.Mesh[] = [];
        let total = 0;

        const fullBox = new THREE.Box3().setFromObject(scene);
        const midY = (fullBox.min.y + fullBox.max.y) / 2;

        scene.traverse((node) => {
            if (!(node instanceof THREE.Mesh)) return;
            total++;
            node.castShadow = true;
            node.receiveShadow = true;

            const name = node.name.trim();
            const meshBox = new THREE.Box3().setFromObject(node);
            const meshCenter = meshBox.getCenter(new THREE.Vector3());

            const isFdi = !isNaN(parseInt(name, 10)) && name.length <= 3;
            const isUpper = meshCenter.y >= midY;

            if (isFdi && isUpper) {
                identified.push(name);
                toothMeshes.current.set(name, node);
                const statusKey = String(data[parseInt(name, 10) as unknown as number] || 'Sano');
                node.material = (baseMaterials[statusKey] || baseMaterials['Sano']).clone();
            } else {
                if (!isUpper) lower.push(node);
                node.material = new THREE.MeshPhysicalMaterial({
                    color: isUpper ? '#d48d8d' : '#d1d5db',
                    roughness: 0.4,
                    clearcoat: 0.5,
                    clearcoatRoughness: 0.2
                });
            }
        });

        lowerMeshes.current = lower;
        onDebug(`${identified.length} dientes interactivos · ${total} mallas totales`);
    }, [scene, data, baseMaterials, onDebug]);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();

        // Animación suave de apertura (ATM dinámica)
        const targetFactor = mouthOpen ? 1 : 0;
        openFactor.current = THREE.MathUtils.lerp(openFactor.current, targetFactor, delta * 4);

        // Mover la arcada inferior
        lowerMeshes.current.forEach((mesh) => {
            // Rotación leve + descenso
            mesh.rotation.x = openFactor.current * 0.4;
            mesh.position.y = -openFactor.current * 1.5;
            mesh.position.z = openFactor.current * 0.5;
        });

        // Brillo de hover en dientes superiores
        toothMeshes.current.forEach((mesh, name) => {
            const mat = mesh.material as THREE.MeshPhysicalMaterial;
            if (!mat.emissive) return;
            if (name === hoveredName) {
                mat.emissive.set('#00d4ff');
                mat.emissiveIntensity = 0.4 + Math.sin(t * 8) * 0.15;
            } else {
                mat.emissive.set('#000000');
                mat.emissiveIntensity = 0;
            }
        });
    });

    return (
        <primitive
            object={scene}
            onPointerOver={(e: any) => {
                e.stopPropagation();
                const name = e.object.name?.trim();
                if (name && toothMeshes.current.has(name)) {
                    setHoveredName(name);
                    document.body.style.cursor = 'pointer';
                }
            }}
            onPointerOut={() => { setHoveredName(null); document.body.style.cursor = 'auto'; }}
            onClick={(e: any) => {
                e.stopPropagation();
                const name = e.object.name?.trim();
                if (name && toothMeshes.current.has(name)) onToothClick(name, e.point);
            }}
        />
    );
};

interface Props {
    data: OdontogramData;
    onChange: (data: OdontogramData) => void;
    onSave?: () => void;
}

const OdontogramaPrueba = ({ data, onChange, onSave }: Props) => {
    const [isMouthOpen, setIsMouthOpen] = useState(false);
    const [menu, setMenu] = useState<{ name: string; pos: THREE.Vector3 } | null>(null);
    const [debug, setDebug] = useState('Cargando motor...');
    const [showDbg, setShowDbg] = useState(false);
    const [showLegend, setShowLegend] = useState(true);


    const statusOptions: { id: ToothStatus; label: string; color: string; Icon: any }[] = [
        { id: 'Sano', label: 'Sano', color: 'bg-emerald-500', Icon: CheckCircle },
        { id: 'Caries', label: 'Caries', color: 'bg-red-800', Icon: AlertCircle },
        { id: 'Tratado', label: 'Endod.', color: 'bg-indigo-600', Icon: Shield },
        { id: 'Tratado (Oro)', label: 'Oro', color: 'bg-yellow-400', Icon: Zap },
        { id: 'Tratado (Zirconia)', label: 'Zirconia', color: 'bg-blue-200', Icon: Thermometer },
        { id: 'Ausente', label: 'Extrac.', color: 'bg-slate-400', Icon: X },
    ];

    return (
        <div className="w-full min-h-[750px] relative bg-[#f8fafc] border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl">
            <Canvas shadows gl={{ antialias: true, powerPreference: 'high-performance' }} style={{ height: '750px' }}>
                <color attach="background" args={['#f0f4f8']} />
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault fov={35} position={[0, 0, 30]} />
                    <CameraRig />
                    <ambientLight intensity={1.8} />
                    <spotLight position={[10, 20, 15]} intensity={2.5} angle={0.25} penumbra={1} castShadow />
                    <Center position={[0, -2, 0]}>
                        <MandibulaModel
                            data={data}
                            mouthOpen={isMouthOpen}
                            onToothClick={(name, pos) => setMenu({ name, pos })}
                            onDebug={setDebug}
                        />
                    </Center>
                    <ContactShadows position={[0, -3, 0]} opacity={0.35} scale={25} blur={3} far={5} />
                    {menu && (
                        <Html position={menu.pos} center distanceFactor={12} zIndexRange={[200, 0]}>
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/96 backdrop-blur-2xl border border-slate-100 shadow-2xl rounded-[2.5rem] p-6 flex flex-col gap-4 min-w-[250px]">
                                <div className="flex justify-between items-center">
                                    <p className="text-xl font-black text-slate-800 leading-none">{menu.name}</p>
                                    <button onClick={() => setMenu(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={18} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {statusOptions.map((s) => (
                                        <button key={s.id} onClick={() => { onChange({ ...data, [parseInt(menu.name, 10) || menu.name as any]: s.id }); setMenu(null); }} className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                                            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center text-white`}><s.Icon size={18} /></div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase text-center">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </Html>
                    )}
                    <OrbitControls makeDefault enableDamping />
                    <Environment preset="city" />
                    <Preload all />
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 pointer-events-auto">
                <div className="px-5 py-3 bg-white border border-slate-100 rounded-3xl shadow-lg flex items-center gap-2">
                    <Activity size={14} className="text-blue-500 animate-pulse" />
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">Odontograma Pro V7.1</p>
                </div>

                {/* Botón de apertura bucal */}
                <button
                    onClick={() => setIsMouthOpen(!isMouthOpen)}
                    className={`flex items-center justify-between gap-4 px-5 py-4 rounded-3xl border shadow-lg transition-all active:scale-95 ${isMouthOpen ? 'bg-blue-600 border-blue-600 text-white shadow-blue-200' : 'bg-white border-slate-100 text-slate-700 shadow-slate-100'}`}
                >
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Posición Mandibular</span>
                        <span className="text-[11px] font-black uppercase tracking-tight">{isMouthOpen ? 'Boca Abierta' : 'Boca Cerrada'}</span>
                    </div>
                    {isMouthOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <div className="flex flex-col bg-white border border-slate-100 rounded-3xl shadow-lg overflow-hidden transition-all">
                    <button
                        onClick={() => setShowLegend(!showLegend)}
                        className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                    >
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Leyenda Clínica</p>
                        {showLegend ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                    </button>

                    <AnimatePresence>
                        {showLegend && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-5 pb-5 flex flex-col gap-2 border-t border-slate-50 pt-3"
                            >
                                {statusOptions.map((s) => (
                                    <div key={s.id} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${s.color} shadow-sm flex-shrink-0`} />
                                        <span className="text-[9px] font-bold text-slate-600">{s.label}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                <button onClick={() => setShowDbg(!showDbg)} className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${showDbg ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                    <Info size={13} /> Diagnóstico
                </button>

                <AnimatePresence>
                    {showDbg && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="bg-slate-900/95 text-white text-[10px] font-mono px-5 py-4 rounded-2xl shadow-2xl border border-white/10 max-w-[280px]">
                            {debug}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute top-6 right-6">
                <button onClick={onSave} className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"><Save size={22} /></button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/40 pointer-events-none">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Cinemática Mandibular Activa (Lerp x4)</p>
            </div>
        </div>
    );
};

export default OdontogramaPrueba;

useGLTF.preload('/mandibula.glb');
