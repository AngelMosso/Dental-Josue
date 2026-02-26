import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Environment,
    ContactShadows,
    PerspectiveCamera,
    OrbitControls,
    Float,
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, Shield, X, CheckCircle, Thermometer, List, Save } from 'lucide-react';
import type { ToothStatus, OdontogramData } from '../types';

// ═══════════════════════════════════════════════════════════════
// MOTOR ANATÓMICO V5 (HIPER-REALISMO CALIBRADO)
// ═══════════════════════════════════════════════════════════════

type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

/**
 * Genera la geometría de los dientes con proporciones reales y anatomía oclusal.
 */
function createHighFidelityTooth(type: ToothType): THREE.BufferGeometry {
    let geo: THREE.BufferGeometry;

    switch (type) {
        case 'incisor': {
            const shape = new THREE.Shape();
            const w = 0.28; const h = 0.45;
            shape.moveTo(-w, -h);
            shape.lineTo(w, -h);
            shape.quadraticCurveTo(w, h, 0, h + 0.05); // Borde incisal
            shape.quadraticCurveTo(-w, h, -w, -h);

            geo = new THREE.ExtrudeGeometry(shape, {
                depth: 0.12,
                bevelEnabled: true,
                bevelThickness: 0.08,
                bevelSize: 0.06,
                bevelSegments: 8
            });
            break;
        }
        case 'canine': {
            const points = [];
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                const r = 0.05 + 0.2 * Math.sin(t * Math.PI * 0.8);
                points.push(new THREE.Vector2(r, (t - 0.5) * 0.9));
            }
            geo = new THREE.LatheGeometry(points, 24);
            geo.scale(1, 1, 0.75);
            break;
        }
        case 'molar': {
            const shape = new THREE.Shape();
            const r = 0.38;
            shape.moveTo(r, r);
            shape.quadraticCurveTo(r * 1.1, 0, r, -r);
            shape.quadraticCurveTo(0, -r * 1.1, -r, -r);
            shape.quadraticCurveTo(-r * 1.1, 0, -r, r);
            shape.quadraticCurveTo(0, r * 1.1, r, r);

            geo = new THREE.ExtrudeGeometry(shape, {
                depth: 0.45,
                bevelEnabled: true,
                bevelThickness: 0.15, // Cúspides
                bevelSize: 0.1,
                bevelSegments: 16
            });
            break;
        }
        default: { // Premolar
            const points = [];
            for (let i = 0; i <= 15; i++) {
                const t = i / 15;
                const r = 0.22 * Math.sin(t * Math.PI) + 0.05;
                points.push(new THREE.Vector2(r, (t - 0.5) * 0.7));
            }
            geo = new THREE.LatheGeometry(points, 24);
            geo.scale(1.1, 1, 1.1);
            break;
        }
    }

    geo.center();

    // Gradiente anatómico de esmalte
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cTop = new THREE.Color('#fff9ef');
    const cBottom = new THREE.Color('#f0e2b1');

    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    for (let i = 0; i < pos.count; i++) {
        const t = (pos.getY(i) - box.min.y) / (box.max.y - box.min.y);
        const c = new THREE.Color().copy(cBottom).lerp(cTop, THREE.MathUtils.smoothstep(t, 0.1, 0.9));
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
}

/**
 * Crea la base gingival con proporciones delicadas para evitar el efecto de "pared".
 */
const CalibratedGingiva = ({ isUpper }: { isUpper: boolean }) => {
    const geo = useMemo(() => {
        const archWidth = 4.1; const archDepth = 2.3;
        const points = [];
        for (let i = 0; i <= 50; i++) {
            const t = (i / 50) * 2 - 1;
            const x = t * archWidth;
            const z = -(t * t) * archDepth + archDepth * 0.45;
            points.push(new THREE.Vector3(x, isUpper ? 0.35 : -0.35, z));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        // Radio pequeño para evitar que la encía sea una pared gigante
        return new THREE.TubeGeometry(curve, 64, 0.28, 12, false);
    }, [isUpper]);

    return (
        <group>
            <mesh geometry={geo} receiveShadow>
                <meshPhysicalMaterial
                    color={isUpper ? "#e29393" : "#d88585"}
                    roughness={0.4} sheen={0.8} sheenColor="#ffced4"
                    clearcoat={0.3} clearcoatRoughness={0.4}
                />
            </mesh>
            {isUpper && (
                <mesh position={[0, 0.25, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[2.5, 32]} />
                    <meshPhysicalMaterial color="#df9696" roughness={0.6} transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    );
};

interface ToothProps {
    number: number;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    status: ToothStatus;
    isSelected: boolean;
    onClick: () => void;
}

const AnatomicalTooth = ({ number, position, rotation, status, isSelected, onClick }: ToothProps) => {
    const crownRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const type = useMemo(() => {
        const n = number % 10;
        if (n <= 2) return 'incisor' as ToothType;
        if (n === 3) return 'canine' as ToothType;
        if (n <= 5) return 'premolar' as ToothType;
        return 'molar' as ToothType;
    }, [number]);

    const geometry = useMemo(() => createHighFidelityTooth(type), [type]);

    useFrame((state) => {
        if (!crownRef.current) return;
        const t = state.clock.getElapsedTime();
        const mat = crownRef.current.material as any;
        if (mat && mat.emissive) {
            const intensity = (isSelected || hovered) ? 0.2 + Math.sin(t * 4) * 0.1 : 0;
            mat.emissiveIntensity = intensity;
        }
    });

    const isMissing = status === 'Ausente';
    const isGold = status === 'Tratado (Oro)';
    const isZirconia = status === 'Tratado (Zirconia)';

    return (
        <group position={position} rotation={rotation}>
            {!isMissing && (
                <mesh
                    ref={crownRef}
                    geometry={geometry}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                    scale={isSelected ? 1.2 : hovered ? 1.08 : 1}
                    castShadow receiveShadow
                >
                    {isGold ? (
                        <meshPhysicalMaterial color="#ffd700" metalness={1.0} roughness={0.1} />
                    ) : isZirconia ? (
                        <meshPhysicalMaterial color="#ffffff" roughness={0.05} clearcoat={1.0} />
                    ) : (
                        <meshPhysicalMaterial
                            vertexColors={true} roughness={0.1} metalness={0.05}
                            transmission={0.2} ior={1.63} thickness={1.0}
                            clearcoat={0.8} sheen={0.2} sheenColor="#ffffff"
                            emissive="#00f2ff" emissiveIntensity={0}
                        />
                    )}
                </mesh>
            )}

            {status === 'Caries' && !isMissing && (
                <mesh position={[0, 0.3, 0.1]}>
                    <sphereGeometry args={[0.1, 12, 12]} />
                    <meshBasicMaterial color="#2d1a00" />
                </mesh>
            )}

            {isMissing && (
                <mesh position={[0, -0.2, 0]} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    <cylinderGeometry args={[0.12, 0.1, 0.7, 16]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
                </mesh>
            )}
        </group>
    );
};

interface Interactive3DOdontogramProps {
    data: OdontogramData;
    onChange: (data: OdontogramData) => void;
    onSave?: () => void;
}

export const Interactive3DOdontogram = ({ data, onChange, onSave }: Interactive3DOdontogramProps) => {
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

    const teethLayout = useMemo(() => {
        const layout: { number: number; position: THREE.Vector3; rotation: THREE.Euler }[] = [];
        const placeArch = (isUpper: boolean, y: number, zOffset: number) => {
            const nums = isUpper ? [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] : [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
            for (let i = 0; i < 16; i++) {
                const t = (i / 15) * 2 - 1;
                const x = t * 4;
                const z = -(t * t) * 2.2 + 1.2 + zOffset;
                const nextT = t + 0.01;
                const angle = Math.atan2((nextT * 4) - x, (-(nextT * nextT) * 2.2 + 1.2 + zOffset) - z);
                layout.push({
                    number: nums[i],
                    position: new THREE.Vector3(x, y, z),
                    rotation: new THREE.Euler(isUpper ? 0 : Math.PI, angle + Math.PI, 0)
                });
            }
        };
        // Posiciones calibradas para evitar colisión con "paredes"
        placeArch(true, 0.55, 0);
        placeArch(false, -0.55, 0.15);
        return layout;
    }, []);

    const findings = Object.entries(data).filter(([_, s]) => s !== 'Sano');

    return (
        <div className="flex flex-col xl:flex-row gap-8 w-full p-2 h-full lg:min-h-[750px] animate-in fade-in duration-1000">
            {/* Visualizador 3D */}
            <div className="flex-1 relative min-h-[600px] h-full bg-slate-50 rounded-[4rem] overflow-hidden border border-slate-200 shadow-2xl group/canvas">
                <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                    <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={30} />
                    <OrbitControls enablePan={false} minDistance={6} maxDistance={15} minPolarAngle={0.4} maxPolarAngle={Math.PI / 2 + 0.1} />

                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={2} castShadow />
                    <pointLight position={[-10, 5, -5]} intensity={0.5} color="#4466ff" />
                    <directionalLight position={[0, 5, 5]} intensity={1.2} />

                    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.1}>
                        <group rotation={[-0.1, 0, 0]}>
                            <CalibratedGingiva isUpper={true} />
                            <CalibratedGingiva isUpper={false} />

                            {teethLayout.map((tooth) => (
                                <AnatomicalTooth
                                    key={tooth.number}
                                    {...tooth}
                                    status={data[tooth.number] || 'Sano'}
                                    isSelected={selectedTooth === tooth.number}
                                    onClick={() => setSelectedTooth(tooth.number)}
                                />
                            ))}
                        </group>
                    </Float>

                    <Environment preset="studio" />
                    <ContactShadows position={[0, -4, 0]} opacity={0.3} scale={20} blur={2.5} far={4.5} />
                </Canvas>

                {/* Etiquetas e Interfaz del Canvas */}
                <div className="absolute top-8 left-8 flex flex-col gap-4">
                    <div className="px-5 py-2.5 bg-white/70 backdrop-blur-3xl rounded-2xl border border-white/50 shadow-xl flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Dental Engine V5.0</span>
                    </div>
                </div>

                <div className="absolute top-8 right-8">
                    <button onClick={onSave} className="p-5 bg-slate-900 text-white rounded-[2rem] hover:bg-blue-600 transition-all shadow-2xl active:scale-95 group/save">
                        <Save size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                </div>

                {/* Selector de Estado */}
                <AnimatePresence>
                    {selectedTooth && (
                        <motion.div
                            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col gap-4 p-5 bg-white/80 backdrop-blur-3xl rounded-[3rem] border border-white/50 shadow-2xl z-50 min-w-[500px]"
                        >
                            <div className="flex items-center justify-between px-5 pb-2 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest">Pieza Historial</span>
                                    <span className="text-3xl font-black text-slate-900">{selectedTooth}</span>
                                </div>
                                <button onClick={() => setSelectedTooth(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {[
                                    { id: 'Sano', col: 'bg-emerald-500', ic: CheckCircle, lbl: 'Sano' },
                                    { id: 'Caries', col: 'bg-amber-800', ic: AlertCircle, lbl: 'Caries' },
                                    { id: 'Tratado', col: 'bg-indigo-600', ic: Shield, lbl: 'Endo' },
                                    { id: 'Tratado (Oro)', col: 'bg-yellow-500', ic: Zap, lbl: 'Oro' },
                                    { id: 'Tratado (Zirconia)', col: 'bg-slate-200', ic: Thermometer, lbl: 'Zirc' },
                                    { id: 'Ausente', col: 'bg-slate-400', ic: X, lbl: 'Ext' },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => onChange({ ...data, [selectedTooth]: s.id as ToothStatus })}
                                        className={`group flex flex-col items-center gap-2 p-3 rounded-3xl transition-all ${data[selectedTooth] === s.id ? 'bg-white shadow-lg ring-2 ring-blue-500/10' : 'hover:bg-white/50'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-2xl ${s.col} flex items-center justify-center text-white shadow-md`}>
                                            <s.ic size={16} />
                                        </div>
                                        <span className="text-[8.5px] font-black uppercase text-slate-700 tracking-tight">{s.lbl}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Panel de Hallazgos */}
            <div className="xl:w-80 flex flex-col gap-6">
                <div className="p-6 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><List size={18} /></div>
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Diagnóstico Activo</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-none">
                        {findings.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 italic px-8 text-center">
                                <Shield size={42} className="mb-4" />
                                <p className="text-[9px] font-black uppercase tracking-widest leading-loose">Dentadura Integramente Sanatizada</p>
                            </div>
                        ) : (
                            findings.map(([num, status]) => (
                                <div key={num} className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">{num}</div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black uppercase text-blue-600 mb-0.5">{status}</p>
                                        <p className="text-[9px] font-bold text-slate-400">Pieza Validada</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
