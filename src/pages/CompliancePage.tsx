import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Thermometer,
    Trash2,
    Brush,
    Settings,
    Plus,
    Download,
    CheckCircle2,
    AlertCircle,
    User,
    FileText,
    History,
    UploadCloud,
    Shield,
    Clock,
    Lock,
    X
} from 'lucide-react';
import { complianceService } from '../services/complianceService';
import { pageTransition, fadeInUp, fadeIn } from '../utils/animations';
import { generateCompliancePDF } from '../utils/pdfGenerator';
import type { SterilizationCycle, ComplianceLog, EquipmentMaintenance } from '../types';

const CompliancePage = () => {
    const [activeTab, setActiveTab] = useState<'sterilization' | 'cleaning' | 'rpbi' | 'maintenance'>('sterilization');
    const [sterilizationCycles, setSterilizationCycles] = useState<SterilizationCycle[]>([]);
    const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState<EquipmentMaintenance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form States
    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        operator: 'Dr. Administrador',
        method: 'Autoclave de Vapor',
        verification_type: 'Física',
        verification_result: 'Éxito',
        temperature_c: 121,
        pressure_psi: 15,
        exposure_time_min: 20,
        shift: 'Mañana',
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
        equipment_name: '',
        maintenance_date: new Date().toISOString().split('T')[0],
        next_maintenance_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'Preventivo',
        provider: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            operator: 'Dr. Administrador',
            method: 'Autoclave de Vapor',
            verification_type: 'Física',
            verification_result: 'Éxito',
            temperature_c: 121,
            pressure_psi: 15,
            exposure_time_min: 20,
            shift: 'Mañana',
            time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
        });
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sterilization, logs, maintenance] = await Promise.all([
                complianceService.getSterilizationCycles(),
                complianceService.getComplianceLogs(),
                complianceService.getMaintenanceRecords()
            ]);

            setSterilizationCycles(sterilization);
            setComplianceLogs(logs);
            setMaintenanceRecords(maintenance);
        } catch (error) {
            console.error('Error loading compliance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (activeTab === 'sterilization') {
                const doc = {
                    ...formData,
                    temperature_c: Number(formData.temperature_c) || 121,
                    pressure_psi: Number(formData.pressure_psi) || 15,
                    exposure_time_min: Number(formData.exposure_time_min) || 20,
                    start_time: formData.time || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    end_time: formData.end_time || new Date(Date.now() + 20 * 60000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
                };
                await complianceService.saveSterilizationCycle(doc);
            } else if (activeTab === 'maintenance') {
                await complianceService.saveMaintenanceRecord({
                    equipment_name: formData.equipment_name || 'Equipo Dental',
                    maintenance_date: formData.maintenance_date || formData.date,
                    time: formData.time,
                    next_maintenance_date: formData.next_maintenance_date,
                    type: formData.type || 'Preventivo',
                    provider: formData.provider || 'Proveedor Autorizado',
                    notes: formData.notes
                });
            } else {
                const doc = {
                    ...formData,
                    weight: formData.weight ? Number(formData.weight) : undefined,
                    type: activeTab === 'cleaning' ? 'Limpieza Diaria' : 'RPBI - Generación'
                };
                await complianceService.saveComplianceLog(doc);
            }

            setShowModal(false);
            await loadData();
        } catch (error: any) {
            console.error('Error saving compliance record:', error);
            // Fallback: Si el registro se guardó localmente (como lo hace el servicio), 
            // permitimos que el usuario continúe aunque Supabase falle temporalmente.
            setShowModal(false);
            await loadData();

            if (error.code === '42703') {
                console.warn('DB Schema mismatch - entry saved locally only');
            } else {
                alert(`Nota: El registro se guardó localmente pero hubo un detalle con el servidor: ${error.message || 'Error de conexión'}. Se sincronizará más tarde.`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleExportAudit = () => {
        setLoading(true);
        try {
            const cleaningLogs = complianceLogs.filter(l => l.type === 'Limpieza Diaria' || l.type === 'Limpieza Exhaustiva');
            const rpbiLogs = complianceLogs.filter(l => l.type === 'RPBI - Generación' || l.type === 'RPBI - Recolección');

            generateCompliancePDF(
                "DentalCare Professional",
                sterilizationCycles,
                cleaningLogs,
                rpbiLogs,
                maintenanceRecords
            );
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el reporte PDF.');
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'sterilization', label: 'Esterilización', icon: Thermometer },
        { id: 'cleaning', label: 'Limpieza', icon: Brush },
        { id: 'rpbi', label: 'RPBI', icon: Trash2 },
        { id: 'maintenance', label: 'Mantenimiento', icon: Settings }
    ];

    return (
        <motion.div className="space-y-8" {...pageTransition}>
            {/* Header COFEPRIS */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg border border-emerald-200">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cumplimiento Normativo</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Validación COFEPRIS</h1>
                    <p className="text-slate-400 font-medium text-sm mt-1">Bitácoras digitales auditables para acreditación sanitaria</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportAudit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold text-sm hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" /> : <Download size={18} />}
                        Exportar Auditoría
                    </button>
                    <button
                        onClick={() => {
                            const now = new Date();
                            setFormData({
                                ...formData,
                                date: now.toISOString().split('T')[0],
                                time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-indigo-100"
                    >
                        <Plus size={18} /> Nuevo Registro
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[2rem] w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-md translate-y-[-2px]'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Data Table / Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-10"
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Cargando registros...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activeTab === 'sterilization' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-6 gap-4 px-6 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <div className="col-span-1">Fecha/Hora</div>
                                        <div className="col-span-1">Parámetros</div>
                                        <div className="col-span-1">Operador</div>
                                        <div className="col-span-1">Tipo Prueba</div>
                                        <div className="col-span-1">Resultado</div>
                                        <div className="col-span-1 text-right">Acciones</div>
                                    </div>
                                    {sterilizationCycles.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold text-sm">No hay ciclos de esterilización registrados</p>
                                        </div>
                                    ) : (
                                        sterilizationCycles.map(cycle => (
                                            <div key={cycle.id} className="relative grid grid-cols-6 gap-4 p-6 bg-slate-50 rounded-2xl items-center hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                                                {cycle.is_extemporaneous && (
                                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
                                                        <History size={10} /> Registro Extemporáneo
                                                    </div>
                                                )}
                                                <div className="col-span-1">
                                                    <p className="text-sm font-bold text-slate-700">{new Date(cycle.date).toLocaleDateString()}</p>
                                                    <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
                                                        <Clock size={10} /> {cycle.start_time || (cycle.created_at ? new Date(cycle.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00')}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium">{cycle.method}</p>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-[10px] font-bold text-slate-500">{cycle.temperature_c}°C / {cycle.pressure_psi} PSI</span>
                                                        <span className="text-[9px] text-slate-400">{cycle.exposure_time_min} min</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <User size={12} className="text-slate-300" />
                                                        {cycle.operator}
                                                    </div>
                                                    <p className="text-[8px] text-slate-300 italic">ID: {cycle.id.split('-')[0]}</p>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight w-fit">
                                                            {cycle.verification_type}
                                                        </span>
                                                        {cycle.biological_indicator_lot && (
                                                            <span className="text-[8px] text-slate-400 font-mono">Lot: {cycle.biological_indicator_lot}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className={`flex items-center gap-1.5 ${cycle.verification_result === 'Éxito' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {cycle.verification_result === 'Éxito' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                                        <span className="text-xs font-black uppercase tracking-tight">{cycle.verification_result}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600 flex items-center justify-end gap-1 w-full">
                                                        <Shield size={12} /> Certificado
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Implementación similar para Cleaning y RPBI */}
                            {(activeTab === 'cleaning' || activeTab === 'rpbi') && (() => {
                                const filteredLogs = complianceLogs.filter(log =>
                                    activeTab === 'cleaning'
                                        ? (log.type === 'Limpieza Diaria' || log.type === 'Limpieza Exhaustiva')
                                        : (log.type === 'RPBI - Generación' || log.type === 'RPBI - Recolección')
                                );

                                return (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-5 gap-4 px-6 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                            <div className="col-span-1">Fecha / Registro</div>
                                            <div className="col-span-1">Detalle</div>
                                            <div className="col-span-1">Responsable</div>
                                            <div className="col-span-1">Estado</div>
                                            <div className="col-span-1 text-right">Acciones</div>
                                        </div>
                                        {filteredLogs.length === 0 ? (
                                            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 font-bold text-sm">No hay registros disponibles en esta categoría</p>
                                            </div>
                                        ) : (
                                            filteredLogs.map(log => (
                                                <div key={log.id} className="relative grid grid-cols-5 gap-4 p-6 bg-slate-50 rounded-2xl items-center hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                                                    {log.is_extemporaneous && (
                                                        <div className="absolute top-0 right-10 -translate-y-1/2 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
                                                            <History size={10} /> Fuera de fecha (Auditable)
                                                        </div>
                                                    )}
                                                    <div className="col-span-1">
                                                        <p className="text-sm font-bold text-slate-700">{new Date(log.date).toLocaleDateString()}</p>
                                                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 font-bold">
                                                            <Clock size={10} /> {log.time || (log.created_at ? new Date(log.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00')}
                                                        </div>
                                                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter">{log.shift || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <p className="text-xs font-bold text-slate-600">{log.area || log.residue_type || log.company}</p>
                                                        {log.disinfectant_name && <p className="text-[9px] text-slate-400">{log.disinfectant_name} ({log.concentration})</p>}
                                                        {log.weight && <p className="text-[9px] text-slate-400 font-bold">{log.weight} kg</p>}
                                                    </div>
                                                    <div className="col-span-1 flex items-center gap-2">
                                                        <User size={14} className="text-slate-300" />
                                                        <span className="text-xs font-bold text-slate-600">{log.operator}</span>
                                                    </div>
                                                    <div className="col-span-1">
                                                        <div className="flex items-center gap-1.5 text-emerald-600">
                                                            <CheckCircle2 size={16} />
                                                            <span className="text-xs font-black uppercase tracking-tight">Válido Normativa</span>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 text-right">
                                                        {log.manifest_file_url ? (
                                                            <button className="bg-white p-2 rounded-xl border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition-all"><FileText size={18} /></button>
                                                        ) : (
                                                            <button className="text-slate-300"><UploadCloud size={18} /></button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                );
                            })()}

                            {activeTab === 'maintenance' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-5 gap-4 px-6 pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                        <div className="col-span-1">Equipo</div>
                                        <div className="col-span-1">Fecha Mto.</div>
                                        <div className="col-span-1">Próximo</div>
                                        <div className="col-span-1">Proveedor</div>
                                        <div className="col-span-1 text-right">Acciones</div>
                                    </div>
                                    {maintenanceRecords.length === 0 ? (
                                        <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 font-bold text-sm">No hay registros de mantenimiento</p>
                                        </div>
                                    ) : (
                                        maintenanceRecords.map(record => (
                                            <div key={record.id} className="grid grid-cols-5 gap-4 p-6 bg-slate-50 rounded-2xl items-center hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-100 group">
                                                <div className="col-span-1">
                                                    <p className="text-sm font-bold text-slate-700">{record.equipment_name}</p>
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${record.type === 'Preventivo' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {record.type}
                                                    </span>
                                                </div>
                                                <div className="col-span-1 text-sm font-bold text-slate-500">
                                                    {new Date(record.maintenance_date).toLocaleDateString()}
                                                    <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-bold">
                                                        <Clock size={10} /> {record.time || (record.created_at ? new Date(record.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00')}
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-amber-500" />
                                                        <span className="text-xs font-black text-slate-700">{new Date(record.next_maintenance_date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-1 text-xs font-bold text-slate-600 uppercase">
                                                    {record.provider}
                                                </div>
                                                <div className="col-span-1 text-right">
                                                    <button className="text-indigo-600 text-xs font-bold">Ver Detalles</button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modal de Registro COFEPRIS */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Nuevo Registro Auditado</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bitácora Oficial • NOM-013-SSA2</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-300 hover:text-rose-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 opacity-70">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                                            <Lock size={10} /> Fecha (Protegida)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            readOnly
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5 opacity-70">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                                            <Lock size={10} /> Hora (Protegida)
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.time}
                                            readOnly
                                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operador Responsable</label>
                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-400">
                                            <User size={14} />
                                            {formData.operator}
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'sterilization' ? (
                                    <motion.div {...fadeIn} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Método de Esterilización</label>
                                                <select
                                                    value={formData.method}
                                                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                >
                                                    <option>Autoclave de Vapor</option>
                                                    <option>Calor Seco</option>
                                                    <option>Químico</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Temperatura (°C)</label>
                                                <input
                                                    type="number"
                                                    value={formData.temperature_c}
                                                    onChange={(e) => setFormData({ ...formData, temperature_c: parseInt(e.target.value) })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Presión (PSI)</label>
                                                <input
                                                    type="number"
                                                    value={formData.pressure_psi}
                                                    onChange={(e) => setFormData({ ...formData, pressure_psi: parseInt(e.target.value) })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : activeTab === 'maintenance' ? (
                                    <motion.div {...fadeIn} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Equipo / Unidad</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Unidad 1, Autoclave Niteberg"
                                                value={formData.equipment_name}
                                                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Mto.</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                >
                                                    <option>Preventivo</option>
                                                    <option>Correctivo</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Próxima Fecha</label>
                                                <input
                                                    type="date"
                                                    value={formData.next_maintenance_date}
                                                    onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Proveedor / Técnico</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre de la empresa o técnico"
                                                value={formData.provider}
                                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div {...fadeIn} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Turno de Trabajo</label>
                                            <div className="flex gap-2">
                                                {['Mañana', 'Tarde'].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, shift: s })}
                                                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.shift === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                                {activeTab === 'cleaning' ? 'Agente Desinfectante' : 'Tipo de Residuo'}
                                            </label>
                                            <select
                                                onChange={(e) => setFormData({ ...formData, [activeTab === 'cleaning' ? 'disinfectant_name' : 'residue_type']: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                            >
                                                {activeTab === 'cleaning' ? (
                                                    <>
                                                        <option>Cloro al 0.5%</option>
                                                        <option>Amonio Cuaternario</option>
                                                        <option>Alcohol Isopropílico 70%</option>
                                                        <option>Glutaraldehído</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option>Punzocortantes</option>
                                                        <option>Sangre/Líquidos</option>
                                                        <option>Patológicos</option>
                                                        <option>No anatómicos</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detalle / Concepto</label>
                                            <input
                                                type="text"
                                                placeholder={activeTab === 'cleaning' ? 'Área (Consultorio 1, Recepción...)' : 'Peso estimado (kg)'}
                                                value={activeTab === 'cleaning' ? (formData.area || '') : (formData.weight || '')}
                                                onChange={(e) => setFormData({ ...formData, [activeTab === 'cleaning' ? 'area' : 'weight']: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-3 bg-slate-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={16} /> Certificar Registro
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CompliancePage;
