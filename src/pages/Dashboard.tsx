import { useState, useEffect } from 'react';
import { Users, Calendar, Activity, Plus, Search, ChevronRight, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { patientService } from '../services/patientService';
import { pageTransition, staggerContainer, cardVariant, fadeInUp, fadeIn } from '../utils/animations';
import type { Appointment } from '../types';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>({
        totalPatients: 0,
        appointmentsToday: 0,
        lowStockItems: 0,
        upcomingAppointments: [] as Appointment[],
        treatmentStats: {
            diagnostico: 0,
            enProceso: 0,
            completado: 0,
            especialidades: [] as { name: string; count: number; color: string }[],
            financials: {
                activePlans: 0,
                approvedBudgets: 0,
                pendingClozure: 0
            }
        },
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await patientService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div className="space-y-8" {...pageTransition}>
            {/* Header Técnico */}
            <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Panel de Control</h2>
                    <p className="text-gray-400 text-sm font-medium">Dr. Administrador • {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase">Sistema Online</span>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">Sincronizado</span>
                </div>
            </div>

            {/* Cuadrícula Bento Premium */}
            <motion.div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4" variants={staggerContainer} initial="initial" animate="animate">

                {/* FILA 1: RESUMEN OPERATIVO */}
                {/* BLOQUE MAESTRO: Pacientes */}
                <motion.div variants={cardVariant} className="md:col-span-2 lg:col-span-3 bg-gray-900 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-gray-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Users size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Pacientes en Comunidad</p>
                        <motion.h3 className="text-5xl font-black mb-1" {...fadeIn}>{loading ? '...' : stats.totalPatients.toLocaleString()}</motion.h3>
                        <p className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                            <Activity size={12} /> Sincronizado en la nube
                        </p>
                    </div>
                    <div className="relative z-10 mt-12 flex gap-3">
                        <button
                            onClick={() => navigate('/pacientes?new=true')}
                            className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} /> Nuevo Paciente
                        </button>
                        <button
                            onClick={() => navigate('/pacientes')}
                            className="bg-gray-800 text-gray-300 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-700 transition-all active:scale-95"
                        >
                            Ver Lista
                        </button>
                    </div>
                </motion.div>

                {/* BLOQUE SECUNDARIO: Citas */}
                <motion.div variants={cardVariant} className="md:col-span-2 lg:col-span-3 bg-white border border-gray-100 rounded-[2rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-gray-50 p-3 rounded-2xl text-gray-400 group-hover:text-medical-blue transition-colors">
                                <Calendar size={24} />
                            </div>
                            {stats.appointmentsToday > 0 && (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+{stats.appointmentsToday} hoy</span>
                            )}
                        </div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Agenda Hoy</p>
                        <h3 className="text-4xl font-black text-gray-800">{loading ? '...' : stats.appointmentsToday}</h3>
                        <p className="text-gray-500 text-xs mt-2 font-medium">Citas programadas para el día de hoy</p>
                    </div>
                    <div className="mt-8">
                        <button
                            onClick={() => navigate('/citas')}
                            className="w-full py-3 border border-gray-100 rounded-2xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            Gestionar Calendario <ChevronRight size={14} />
                        </button>
                    </div>
                </motion.div>

                {/* FILA 2: ACCESOS RÁPIDOS 2+2+2 */}
                <motion.div variants={cardVariant} className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-[2rem] p-6 flex flex-col gap-4 group hover-lift">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Búsqueda Rápida</span>
                    </div>
                    <button
                        onClick={() => navigate('/historiales')}
                        className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:border-gray-300 transition-all group/btn shadow-sm hover:shadow-md"
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-bold text-gray-700">Historial Clínico</span>
                            <span className="text-[10px] font-medium text-gray-400">Pacientes y notas</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                <motion.div variants={cardVariant} className="lg:col-span-2 bg-gray-50 border border-gray-100 rounded-[2rem] p-6 flex flex-col gap-4 hover-lift">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                            <Package size={18} className={`${stats.lowStockItems > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Almacén</span>
                    </div>
                    <button
                        onClick={() => navigate('/inventario')}
                        className={`flex-1 border rounded-2xl p-4 flex items-center justify-between transition-all group/btn ${stats.lowStockItems > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                    >
                        <div className="flex flex-col items-start gap-1">
                            <span className={`text-sm font-bold ${stats.lowStockItems > 0 ? 'text-red-700' : 'text-gray-700'}`}>Inventario</span>
                            {stats.lowStockItems > 0 && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">⚠️ {stats.lowStockItems} Alertas</span>}
                        </div>
                        <ChevronRight size={16} className={`${stats.lowStockItems > 0 ? 'text-red-300' : 'text-gray-300'} group-hover/btn:translate-x-1 transition-transform`} />
                    </button>
                </motion.div>

                <motion.div
                    variants={cardVariant}
                    onClick={() => navigate('/finanzas')}
                    className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col justify-center items-center text-center gap-3 group cursor-pointer hover:bg-slate-800 transition-all shadow-xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Activity size={32} className="text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Facturación</span>
                    <p className="text-xl font-black italic">Presupuestos</p>
                </motion.div>

                {/* FILA 3: ANALÍTICA AVANZADA (6 COLUMNAS) */}
                <motion.div variants={cardVariant} className="lg:col-span-6 bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Análisis Clínico & Financiero</p>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Rendimiento Operativo Maestro</h3>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        {/* Monitor Económico Minimalista */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Resumen Económico</p>
                                <div className="h-0.5 w-10 bg-indigo-500 rounded-full" />
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between group/stat cursor-pointer" onClick={() => navigate('/finanzas?view=revenue')}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl group-hover/stat:scale-110 transition-all duration-500 shadow-lg shadow-emerald-100">
                                            <TrendingUp size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presupuesto Aprobado</p>
                                            <p className="text-xl font-black text-slate-800 tracking-tighter">${stats.treatmentStats.financials.approvedBudgets.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-200 group-hover/stat:translate-x-1 transition-transform" />
                                </div>

                                <div className="flex items-center justify-between group/stat cursor-pointer" onClick={() => navigate('/finanzas?view=debtors')}>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl group-hover/stat:scale-110 transition-all duration-500 shadow-lg shadow-amber-100">
                                            <Plus size={18} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Adeudos Pendientes</p>
                                            <p className="text-xl font-black text-amber-600 tracking-tighter">${stats.treatmentStats.financials.pendingClozure.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={14} className="text-slate-200 group-hover/stat:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {/* Visualizador de Efectividad Premium */}
                        <div className="lg:col-span-8">
                            <div
                                onClick={() => navigate('/finanzas')}
                                className="relative bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden group cursor-pointer shadow-2xl shadow-slate-200"
                            >
                                {/* Background Decorative Pulse */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000" />

                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em]">Efectividad de Venta</p>
                                            <h4 className="text-5xl font-black text-white tracking-tighter">
                                                {Math.round((stats.treatmentStats.financials.approvedBudgets / (stats.treatmentStats.financials.approvedBudgets + stats.treatmentStats.financials.pendingClozure)) * 100 || 0)}%
                                            </h4>
                                        </div>
                                        <p className="text-[10px] font-medium text-slate-400 max-w-[200px] leading-relaxed">
                                            Tasa de conversión de presupuestos a tratamientos aprobados.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(stats.treatmentStats.financials.approvedBudgets / (stats.treatmentStats.financials.approvedBudgets + stats.treatmentStats.financials.pendingClozure)) * 100}%` }}
                                                    className="h-full bg-emerald-400"
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase">Óptimo</span>
                                        </div>
                                    </div>

                                    {/* Gráfica SVG Abstracta Minimalista */}
                                    <div className="relative h-32 flex items-center justify-center">
                                        <svg viewBox="0 0 100 40" className="w-full h-full text-emerald-400/30">
                                            <motion.path
                                                d="M 0 35 Q 25 35 35 15 T 70 20 T 100 5 L 100 40 L 0 40 Z"
                                                fill="currentColor"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 2, ease: "easeOut" }}
                                            />
                                            <motion.path
                                                d="M 0 35 Q 25 35 35 15 T 70 20 T 100 5"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 2, ease: "easeOut" }}
                                                className="text-emerald-400"
                                            />
                                            <motion.circle
                                                cx="100" cy="5" r="2"
                                                fill="#34d399"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 1.8 }}
                                                className="filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-white border border-white/10">Ver Detalle Analítico</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </motion.div>


            <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={staggerContainer} initial="initial" animate="animate">
                <motion.div variants={fadeInUp} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Próximas Citas</h3>
                        <button onClick={() => navigate('/citas')} className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">Ver Agenda Completa</button>
                    </div>
                    <div className="space-y-3">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 skeleton" />
                            ))
                        ) : stats.upcomingAppointments.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">No hay citas próximas</p>
                            </div>
                        ) : (
                            stats.upcomingAppointments.map((appt: any) => (
                                <div key={appt.id} className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 rounded-[1.5rem] transition-all border border-transparent hover:border-gray-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-indigo-600 font-black shadow-sm group-hover:scale-105 transition-transform text-xs">
                                            {appt.patient_name.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{appt.patient_name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{appt.reason} • {appt.time}</p>
                                                <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100 animate-pulse">
                                                    {(() => {
                                                        const target = new Date(`${appt.date}T${appt.time}`);
                                                        const now = new Date();
                                                        const diff = target.getTime() - now.getTime();
                                                        if (diff < 0) return 'Ahora';
                                                        const minutes = Math.floor(diff / (1000 * 60));
                                                        const hours = Math.floor(diff / (1000 * 60 * 60));
                                                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                        if (minutes < 60) return `en ${minutes}m`;
                                                        if (hours < 24) return `en ${hours}h`;
                                                        if (days === 1) return 'Mañana';
                                                        return `en ${days} días`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/pacientes/${appt.patient_id}`)}
                                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                    >
                                        Ficha
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div variants={fadeInUp} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Actividad Reciente</h3>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] scrollbar-hide pr-2">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-16 skeleton" />
                            ))
                        ) : stats.recentActivity?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4 border border-gray-100">
                                    <Activity size={32} />
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Buzón de actividad vacío</p>
                            </div>
                        ) : (
                            stats.recentActivity?.map((act: any) => (
                                <div key={act.id} className="relative pl-6 group/act">
                                    <div className={`absolute left-0 top-2 w-1.5 h-1.5 rounded-full ${act.type === 'Registro' ? 'bg-emerald-400' :
                                        act.type === 'Financiero' ? 'bg-amber-400' : 'bg-indigo-400'
                                        } group-hover/act:scale-125 transition-transform`} />
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-gray-800 text-sm">{act.patient_name}</p>
                                            <p className="text-[8px] font-bold text-gray-400">
                                                {new Date(act.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                                            {act.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-[7px] font-black uppercase tracking-[0.2em] ${act.type === 'Registro' ? 'text-emerald-500' :
                                                act.type === 'Financiero' ? 'text-amber-500' : 'text-indigo-500'
                                                }`}>
                                                {act.type}
                                            </p>
                                            {act.type === 'Financiero' && <DollarSign size={8} className="text-amber-500" />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-[9px] text-slate-300 mt-6 pt-4 border-t border-gray-50">Sincronización en tiempo real activa</p>
                </motion.div>
            </motion.div>

        </motion.div>
    );
};

export default Dashboard;
