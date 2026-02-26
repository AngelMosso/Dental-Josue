import { useState } from 'react';
import {
    Settings as SettingsIcon,
    RefreshCcw,
    ShieldAlert,
    ChevronRight,
    Trash2,
    Database,
    HardDrive,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { patientService } from '../services/patientService';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
    const { signOut } = useAuth();
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetConfirm, setResetConfirm] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const handleHardReset = async () => {
        if (resetConfirm !== 'BORRAR TODO') return;

        setIsResetting(true);
        try {
            await patientService.hardResetDatabase();
            // Esperar un momento para feedback visual
            setTimeout(() => {
                signOut();
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Error durante el reinicio:', error);
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <header className="space-y-2">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-100">
                        <SettingsIcon className="text-white" size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter text-balance">Configuración del Sistema</h2>
                </div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] px-1">Gestión Técnica y Seguridad de la Clínica</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* Sección de Seguridad y Datos */}
                <section className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-[3rem] p-10 shadow-xl space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-rose-50 rounded-xl">
                            <ShieldAlert className="text-rose-600" size={20} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800">Zona de Peligro: Gestión de Datos</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[2.5rem] border border-transparent hover:border-slate-100 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-lg shadow-rose-50 group-hover:scale-110 transition-transform">
                                    <RefreshCcw size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">Reinicio Maestro de Fábrica</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Borra pacientes, citas, historiales y finanzas</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsResetModalOpen(true)}
                                className="px-8 py-4 bg-rose-600 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-rose-100 active:scale-95 flex items-center gap-3"
                            >
                                <Trash2 size={16} /> Ejecutar Reinicio
                            </button>
                        </div>
                    </div>
                </section>

                {/* Info del Sistema */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <Database className="text-blue-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Estado Supabase</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-black">
                                <span className="text-slate-400">Conexión</span>
                                <span className="text-emerald-400">ACTIVA</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black">
                                <span className="text-slate-400">Región</span>
                                <span>US-East (Virginia)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <HardDrive className="text-blue-600" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cache Local</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-black text-slate-800">
                                <span>Espacio Utilizado</span>
                                <span>{Math.round(JSON.stringify(localStorage).length / 1024)} KB</span>
                            </div>
                            <button
                                onClick={() => {
                                    Object.keys(localStorage).filter(k => k.startsWith('dc_')).forEach(k => localStorage.removeItem(k));
                                    window.location.reload();
                                }}
                                className="text-[9px] font-black text-blue-600 uppercase hover:underline"
                            >
                                Forzar limpieza de cache
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Confirmación Crítica */}
            <AnimatePresence>
                {isResetModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !isResetting && setIsResetModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="p-12 space-y-8">
                                <div className="p-5 bg-rose-50 rounded-[2rem] w-fit mx-auto animate-pulse">
                                    <ShieldAlert className="text-rose-600" size={48} />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">¿Estás absolutamente seguro?</h3>
                                    <p className="text-slate-400 text-sm font-bold leading-relaxed">
                                        Esta acción eliminará permanentemente **todos los pacientes, citas e historiales clínicos**. No hay forma de deshacerlo.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">
                                        Escribe <span className="text-rose-600 selection:bg-rose-100">BORRAR TODO</span> para confirmar
                                    </p>
                                    <input
                                        disabled={isResetting}
                                        type="text"
                                        value={resetConfirm}
                                        onChange={(e) => setResetConfirm(e.target.value)}
                                        className="w-full bg-slate-100 border-none rounded-2xl py-5 px-8 text-center text-lg font-black tracking-widest text-rose-600 focus:ring-2 focus:ring-rose-200 outline-none uppercase placeholder:text-slate-200"
                                        placeholder="..."
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    {!isResetting ? (
                                        <>
                                            <button
                                                onClick={() => setIsResetModalOpen(false)}
                                                className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all font-sans"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                disabled={resetConfirm !== 'BORRAR TODO'}
                                                onClick={handleHardReset}
                                                className={`flex-[2] py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${resetConfirm === 'BORRAR TODO'
                                                    ? 'bg-rose-600 text-white shadow-xl shadow-rose-100 hover:bg-slate-900'
                                                    : 'bg-slate-50 text-slate-200'
                                                    }`}
                                            >
                                                Confirmar Destrucción
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-full flex flex-col items-center gap-4 py-4">
                                            <RefreshCcw className="animate-spin text-rose-600" size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purgando Base de Datos...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsPage;
