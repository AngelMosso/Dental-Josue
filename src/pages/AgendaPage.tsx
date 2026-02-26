import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Search,
    MoreHorizontal,
    X
} from 'lucide-react';
import { patientService } from '../services/patientService';
import type { Appointment, Patient } from '../types';

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

// Helper para obtener fecha YYYY-MM-DD local (evita desfase UTC)
const formatLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
};

const AgendaPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date()); // Para navegar en el calendario lateral
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [appointmentDate, setAppointmentDate] = useState(formatLocalISO(new Date()));
    const [appointmentTime, setAppointmentTime] = useState('09:00');
    const [appointmentDuration, setAppointmentDuration] = useState('30');
    const [appointmentReason, setAppointmentReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId) {
            setSelectedPatientId(patientId);
            setAppointmentDate(formatLocalISO(selectedDate));
            setShowNewModal(true);
        }
    }, [searchParams, selectedDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [appts, pts] = await Promise.all([
                patientService.getAppointments(),
                patientService.getAll()
            ]);
            setAppointments(appts);
            setPatients(pts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedPatientId || !appointmentReason || !appointmentTime) return;

        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        try {
            setIsSaving(true);
            const newAppt: Appointment = {
                id: `appt-${Date.now()}`,
                patient_id: selectedPatientId,
                patient_name: patient.full_name,
                date: appointmentDate,
                time: appointmentTime,
                duration: parseInt(appointmentDuration),
                reason: appointmentReason,
                status: 'Pendiente'
            };

            await patientService.saveAppointment(newAppt);
            setShowNewModal(false);
            setAppointmentReason('');
            // Recargar datos
            await loadData();
        } catch (error) {
            console.error('Error al guardar cita:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const dayAppointments = appointments.filter(a => {
        return a.date === formatLocalISO(selectedDate);
    });

    // Lógica de Calendario Dinámico
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (step: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1);
        setCurrentMonth(newMonth);
    };

    const days = Array.from({ length: getDaysInMonth(currentMonth) });
    const firstDay = getFirstDayOfMonth(currentMonth);
    const blanks = Array.from({ length: firstDay });

    return (
        <div className="space-y-8 pb-12">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
                            <CalendarIcon className="text-white" size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestión de Agenda</h2>
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] px-1">Planificación Quirúrgica Centralizada</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all active:scale-95">
                        <Search size={20} />
                    </button>
                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
                    >
                        <Plus size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Nueva Cita</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Calendario Lateral */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    <GlassCard className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                                {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={18} /></button>
                                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={18} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center mb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-3 text-center">
                            {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                            {days.map((_, i) => {
                                const d = i + 1;
                                const isSelected = selectedDate.getDate() === d &&
                                    selectedDate.getMonth() === currentMonth.getMonth() &&
                                    selectedDate.getFullYear() === currentMonth.getFullYear();

                                return (
                                    <button
                                        key={d}
                                        onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
                                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                                            : 'text-slate-500 hover:bg-slate-50'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status del Día</p>
                                <div className="p-2 bg-white/10 rounded-lg text-white">
                                    <Clock size={16} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black">{dayAppointments.length}</p>
                                <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Consultas Programadas</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Timeline de Citas */}
                <div className="xl:col-span-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2 text-slate-400 mb-6 font-black uppercase tracking-[0.2em] text-[10px]">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            Timeline del {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando Agenda...</span>
                            </div>
                        ) : dayAppointments.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center gap-4"
                            >
                                <div className="p-6 bg-white rounded-full shadow-sm text-slate-200">
                                    <CalendarIcon size={48} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">Día Despejado</p>
                                    <p className="text-[10px] text-slate-300 font-bold max-w-[200px]">No hay intervenciones programadas para este horario.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {dayAppointments.map((appt, idx) => (
                                    <motion.div
                                        key={appt.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => navigate(`/pacientes/${appt.patient_id}`)}
                                    >
                                        <GlassCard className="p-6 flex items-center gap-6 group hover:translate-x-2 transition-transform cursor-pointer hover:bg-white hover:shadow-2xl">
                                            <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-6 min-w-[100px]">
                                                <p className="text-xl font-black text-slate-800 leading-none mb-1">{appt.time}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{appt.duration} min</p>
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                                                        <User size={12} />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-800 tracking-tight">{appt.patient_name}</p>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-wide">{appt.reason}</p>
                                            </div>

                                            <div className="flex flex-col items-end gap-3">
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${appt.status === 'Confirmada' ? 'bg-emerald-50 text-emerald-600' :
                                                    appt.status === 'Pendiente' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {appt.status}
                                                </div>
                                                <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <MoreHorizontal size={18} />
                                                </button>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Nueva Cita (Premium Backdrop) */}
            <AnimatePresence>
                {showNewModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNewModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg"
                        >
                            <GlassCard className="p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-white">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Programar Intervención</h3>
                                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Reserva Quirúrgica DentalCare</p>
                                    </div>
                                    <button onClick={() => setShowNewModal(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paciente</label>
                                        <select
                                            value={selectedPatientId}
                                            onChange={(e) => setSelectedPatientId(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleccionar Paciente...</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha de Cita</label>
                                        <input
                                            type="date"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora</label>
                                            <input
                                                type="time"
                                                value={appointmentTime}
                                                onChange={(e) => setAppointmentTime(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duración</label>
                                            <select
                                                value={appointmentDuration}
                                                onChange={(e) => setAppointmentDuration(e.target.value)}
                                                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-800"
                                            >
                                                <option value="30">30 min</option>
                                                <option value="60">60 min</option>
                                                <option value="90">90 min</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Motivo Quirúrgico</label>
                                        <textarea
                                            value={appointmentReason}
                                            onChange={(e) => setAppointmentReason(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-slate-800 h-24 resize-none"
                                            placeholder="Descripción del tratamiento..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleConfirm}
                                        disabled={isSaving || !selectedPatientId || !appointmentReason}
                                        className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 mt-4 disabled:opacity-50"
                                    >
                                        {isSaving ? 'Guardando...' : 'Confirmar Cita'}
                                    </button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AgendaPage;
