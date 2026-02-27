import { useState, useEffect, Suspense, Component } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import type { Patient, OdontogramData, TreatmentPlan, TreatmentPlanItem, PatientDeepHistory } from '../types';
import {
    ChevronLeft, Phone, FileText, Activity,
    Save, Calendar, Edit2, ArrowRight,
    AlertCircle, DollarSign, Plus,
    Trash2, Check, X, CreditCard, ShieldCheck, Printer, Smile
} from 'lucide-react';

import OdontogramaPrueba from '../components/OdontogramaPrueba';
import { MedicalFlagsBar } from '../components/clinical/MedicalFlagsBar';
import { DeepHistoryForm } from '../components/clinical/DeepHistoryForm';
import { consentService } from '../services/consentService';
import { useAuth } from '../context/AuthContext';

// ═══════════════════════════════════════════════════════════════
// ERROR BOUNDARY PARA SEGURIDAD DEL MOTOR 3D
// ═══════════════════════════════════════════════════════════════

class OdontogramErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Odontogram Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-20 bg-red-50 rounded-[3rem] border-2 border-dashed border-red-200 text-center gap-4">
                    <AlertCircle size={48} className="text-red-500" />
                    <div className="space-y-1">
                        <p className="text-[12px] font-black uppercase tracking-widest text-red-600">Fallo en el Motor 3D</p>
                        <p className="text-[10px] text-red-400 font-bold max-w-xs">El modelo de 112MB es pesado o incompatible con este hardware.</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-xl"
                    >
                        Reintentar Carga
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const OdontogramLoader = () => (
    <div className="flex flex-col items-center gap-6 p-20 text-center w-full">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
            <Activity size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-1">
            <p className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-700">Cargando Visor 3D</p>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Preparando modelo dental...</p>
        </div>
    </div>
);

const TreatmentStatusSelector = ({ status, onUpdate }: { status?: string; onUpdate: (s: any) => void }) => {
    const statuses = [
        { id: 'Diagnóstico', color: 'bg-amber-100 text-amber-600 border-amber-200' },
        { id: 'En Proceso', color: 'bg-blue-100 text-blue-600 border-blue-200' },
        { id: 'Completado', color: 'bg-emerald-100 text-emerald-600 border-emerald-200' }
    ];

    return (
        <div className="flex gap-2 p-1.5 bg-slate-50/50 rounded-2xl border border-gray-100">
            {statuses.map((s) => (
                <button
                    key={s.id}
                    onClick={() => onUpdate(s.id)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${status === s.id
                        ? `${s.color} border-2 shadow-sm scale-105 z-10`
                        : 'bg-white text-gray-400 border-gray-50 opacity-50 hover:opacity-100 hover:border-gray-200'
                        }`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${status === s.id ? (s.id === 'Completado' ? 'bg-emerald-500' : s.id === 'En Proceso' ? 'bg-blue-500' : 'bg-amber-500') : 'bg-gray-300'}`} />
                    {s.id}
                </button>
            ))}
        </div>
    );
};

const ClinicalSummaryView = ({ patient }: { patient: Patient }) => {
    const hasDeep = patient.deep_history && (
        patient.deep_history.systemic.conditions.length > 0 ||
        patient.deep_history.systemic.allergies.length > 0
    );
    const hasLegacy = patient.questionnaire && Object.keys(patient.questionnaire).length > 0;

    if (!hasDeep && !hasLegacy && (!patient.medical_alerts || patient.medical_alerts.length === 0)) {
        return null;
    }

    const { questionnaire, deep_history } = patient;

    const sections = [
        {
            title: 'Alertas Médicas',
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            items: [
                ...(patient.medical_alerts?.map(a => ({ label: a, value: 'Crítico' })) || []),
                ...(deep_history?.systemic.allergies.map(a => ({ label: a.substance, value: a.severity })) || [])
            ]
        },
        {
            title: 'Condiciones CIE-10',
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            items: [
                ...(deep_history?.systemic.conditions.map(c => ({ label: c.label, value: c.code || 'S/C' })) || []),
                { label: 'Diabetes/HTA', value: (questionnaire?.diabetes_hypertension) ? 'Legacy' : undefined }
            ].filter(i => i.value !== undefined)
        },
        {
            title: 'Hábitos y Salud',
            icon: Smile,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            items: [
                { label: 'Tabaquismo', value: (deep_history?.habits.smoker || questionnaire?.smoker_vaper) ? 'SÍ' : 'NO' },
                { label: 'Sangrado Encías', value: (deep_history?.stomatological.bleeding_gums || questionnaire?.bleeding_gums) ? 'SÍ' : 'NO' },
                { label: 'Medicamento', value: (deep_history?.systemic.medications && deep_history.systemic.medications.length > 0) ? 'Activo' : 'Ninguno' }
            ]
        }
    ].filter(s => s.items.length > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((sec, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`${sec.bg} ${sec.color} p-2.5 rounded-xl border border-white shadow-sm`}>
                            <sec.icon size={16} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{sec.title}</h4>
                    </div>
                    <div className="space-y-3">
                        {sec.items.map((item, j) => (
                            <div key={j} className="flex justify-between items-center text-xs">
                                <span className="text-gray-600 font-bold">{item.label}</span>
                                <span className="font-black px-2.5 py-1 rounded-lg shadow-sm text-[9px] uppercase tracking-tighter bg-gray-50 text-gray-400 border border-gray-100">
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const PatientDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [odontogramData, setOdontogramData] = useState<OdontogramData>({});
    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan | null>(null);
    const [clinicalRecords, setClinicalRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [showItemModal, setShowItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState<TreatmentPlanItem | null>(null);
    const [itemForm, setItemForm] = useState<{ description: string; cost: string; tooth: string; status: 'Pendiente' | 'Aprobado' | 'Completado' | 'Cancelado' }>({ description: '', cost: '', tooth: '', status: 'Pendiente' });
    const [paymentAmount, setPaymentAmount] = useState('');
    // Nuevos estados — Historial Profundo
    const [historyTab, setHistoryTab] = useState<'legacy' | 'deep'>('deep');
    const [isSavingHistory, setIsSavingHistory] = useState(false);
    const [isGeneratingConsent, setIsGeneratingConsent] = useState(false);
    const [showOdontogram, setShowOdontogram] = useState(false);

    useEffect(() => {
        if (id) {
            loadPatientData(id);
        }
    }, [id]);

    const loadPatientData = async (patientId: string) => {
        try {
            setIsLoading(true);
            const data = await patientService.getById(patientId);
            if (!data) {
                navigate('/pacientes');
                return;
            }
            setPatient(data);

            const [odontogram, records, plans] = await Promise.all([
                patientService.getOdontogram(patientId),
                patientService.getClinicalRecords(patientId),
                patientService.getTreatmentPlans(patientId)
            ]);

            setOdontogramData(odontogram || {});
            setClinicalRecords(records || []);
            setTreatmentPlan(plans[0] || {
                id: `tp-${Date.now()}`,
                patient_id: patientId,
                items: [],
                total_amount: 0,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!id || !newNote.trim()) return;

        try {
            setIsSavingNote(true);
            await patientService.addClinicalRecord(id, newNote);
            setNewNote('');
            const records = await patientService.getClinicalRecords(id);
            setClinicalRecords(records || []);
        } catch (error) {
            console.error('Error guardando nota:', error);
        } finally {
            setIsSavingNote(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                <Activity className="animate-spin text-medical-blue" size={48} strokeWidth={1} />
                <p className="text-xs font-black uppercase tracking-[0.3em]">Sincronizando Expediente...</p>
            </div>
        );
    }

    if (!patient) return null;

    // ── Guardar historial profundo ──
    const handleSaveDeepHistory = async (history: PatientDeepHistory) => {
        if (!id || !patient) return;
        try {
            setIsSavingHistory(true);
            const professionalName = user?.email || 'Doctor';
            // generar entrada de auditoría
            const auditEntry = await consentService.createAuditEntry(
                professionalName, 'Actualización historial clínico profundo', { patientId: id }
            );
            const updatedHistory: PatientDeepHistory = {
                ...history,
                audit_log: [...(history.audit_log || []), auditEntry],
                last_updated: new Date().toISOString(),
                updated_by: professionalName,
            };

            // Derivar medical_alerts desde flags críticos
            const criticalAlerts = [
                ...updatedHistory.systemic.conditions.filter(c => c.severity === 'critical').map(c => c.label),
                ...updatedHistory.systemic.allergies.filter(a => a.severity === 'Grave').map(a => `Alergia Grave: ${a.substance}`),
            ];

            await patientService.update(id, {
                deep_history: updatedHistory,
                medical_alerts: criticalAlerts
            });

            setPatient(p => p ? {
                ...p,
                deep_history: updatedHistory,
                medical_alerts: criticalAlerts
            } : p);
        } catch (e) { console.error(e); }
        finally { setIsSavingHistory(false); }
    };

    // ── Generar consentimiento PDF ──
    const handleGenerateConsent = async () => {
        if (!patient) return;
        try {
            setIsGeneratingConsent(true);
            const plans = treatmentPlan ? [treatmentPlan] : [];
            const doctorName = patient.deep_history?.doctor_name || user?.email?.split('@')[0].toUpperCase() || 'DOCTOR ENCARGADO';
            const consent = await consentService.generateConsent(patient, plans, { doctorName });
            consentService.printConsent(consent.htmlContent);
        } catch (e) {
            console.error('Error generando consentimiento:', e);
            alert('Hubo un error al generar el consentimiento. Por favor reintenta.');
        } finally {
            setIsGeneratingConsent(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full pb-20 lg:pb-10 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/pacientes')}
                        className="p-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-gray-900 transition-all group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div className="flex gap-5 items-center">
                        <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 border-2 border-white shadow-xl flex items-center justify-center text-indigo-600 font-black text-2xl">
                            {patient.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{patient.full_name}</h2>
                                {patient.readable_id && (
                                    <div className="flex items-center gap-1.5 bg-white border border-slate-200/50 rounded-lg px-2.5 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border-l-4 border-l-medical-blue">
                                        <div className="w-1 h-1 rounded-full bg-medical-blue animate-pulse opacity-70" />
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.1em]">FOLIO</span>
                                        <span className="text-[10px] font-mono font-black text-slate-700 tracking-tight whitespace-nowrap">
                                            {patient.readable_id}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <TreatmentStatusSelector
                                    status={patient.treatment_status}
                                    onUpdate={async (newStatus) => {
                                        try {
                                            await patientService.updateTreatmentStatus(patient.id, newStatus);
                                            setPatient({ ...patient, treatment_status: newStatus });
                                        } catch (e) { console.error(e); }
                                    }}
                                />
                                <div className="h-4 w-[1px] bg-gray-200" />
                                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    {patient.age && <span className="bg-medical-light text-medical-blue px-3 py-1 rounded-full shadow-sm">{patient.age} años</span>}
                                    {patient.phone && <span className="flex items-center gap-1.5 bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm"><Phone size={10} /> {patient.phone}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleGenerateConsent}
                        disabled={isGeneratingConsent}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-100 disabled:opacity-60"
                    >
                        {isGeneratingConsent ? <Activity size={14} className="animate-spin" /> : <Printer size={14} />}
                        Consentimiento PDF
                    </button>
                    <button
                        onClick={() => navigate(`/pacientes?edit=${patient.id}`)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-100 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-medical-blue hover:border-medical-blue transition-all shadow-sm"
                    >
                        <Edit2 size={14} /> Editar Ficha
                    </button>
                    <button
                        onClick={() => navigate(`/citas?patientId=${patient.id}`)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-medical-blue transition-all shadow-lg shadow-gray-200"
                    >
                        <ArrowRight size={14} /> Próxima Cita
                    </button>
                </div>
            </div>

            {/* Banderas de Alerta Médica */}
            <MedicalFlagsBar deepHistory={patient.deep_history} medicalAlerts={patient.medical_alerts} />

            {/* Expediente Médico — Tabs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-1 h-3 bg-medical-blue rounded-full" />
                        <h4 className="font-black uppercase tracking-widest text-[10px]">Expediente Médico</h4>
                    </div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setHistoryTab('deep')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${historyTab === 'deep' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-400'
                                }`}>
                            <ShieldCheck size={11} /> Historial y Higiene
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <ClinicalSummaryView patient={patient} />

                    <DeepHistoryForm
                        initialHistory={patient.deep_history}
                        onSave={handleSaveDeepHistory}
                        isSaving={isSavingHistory}
                    />
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Activity size={16} />
                            <h4 className="font-black uppercase tracking-widest text-[10px]">Mapa Odontológico Activo (GLB)</h4>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-gray-100 rounded-[3rem] p-4 shadow-sm relative overflow-hidden group min-h-[500px] flex items-center justify-center">
                        {!showOdontogram ? (
                            <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100 flex items-center justify-center border border-indigo-50 relative group-hover:scale-105 transition-transform">
                                    <Activity size={40} className="text-indigo-500" />
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white font-black">3D</div>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-700">Visor Dental de Alta Resolución</h5>
                                    <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto px-10">Requiere descargar 112MB. Recomendado para diagnósticos profundos.</p>
                                </div>
                                <button
                                    onClick={() => setShowOdontogram(true)}
                                    className="px-10 py-4 bg-indigo-600 hover:bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-2xl shadow-2xl shadow-indigo-200 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    Activar Motor 3D
                                </button>
                            </div>
                        ) : (
                            <OdontogramErrorBoundary>
                                <Suspense fallback={<OdontogramLoader />}>
                                    <OdontogramaPrueba
                                        data={odontogramData}
                                        onChange={newData => setOdontogramData(newData)}
                                        onSave={() => id && patientService.saveOdontogramState(id, odontogramData)}
                                    />
                                </Suspense>
                            </OdontogramErrorBoundary>
                        )}
                    </div>
                </div>

                {/* Sidebar Consolidado */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                    {/* Sección 1: Notas Clínicas */}
                    <div className="bg-indigo-900 rounded-[2.5rem] p-7 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-white/10 rounded-lg"><Edit2 size={14} className="text-white" /></div>
                                <h4 className="font-black uppercase tracking-widest text-[10px] text-white">Registrar Evolución</h4>
                            </div>
                            <textarea
                                className="w-full bg-white/10 border-none rounded-2xl p-4 text-xs font-semibold text-white placeholder:text-white/30 focus:ring-0 resize-none h-32 italic mb-4"
                                placeholder="Registra los detalles del tratamiento..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={isSavingNote || !newNote.trim()}
                                className="w-full bg-white text-indigo-900 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-xl"
                            >
                                {isSavingNote ? <Activity size={14} className="animate-spin" /> : <Save size={14} />}
                                Guardar en Bitácora
                            </button>
                        </div>
                    </div>

                    {/* Sección 2: Presupuestos y Planes */}
                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-indigo-900">
                                <DollarSign size={20} />
                                <h4 className="font-black uppercase tracking-widest text-[10px]">Presupuesto</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-black text-indigo-600">${treatmentPlan?.total_amount.toLocaleString()}</span>
                                {treatmentPlan && (treatmentPlan.paid_amount || 0) > 0 && (
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                        Abonado: ${(treatmentPlan.paid_amount || 0).toLocaleString()} • Saldo: ${(treatmentPlan.total_amount - (treatmentPlan.paid_amount || 0)).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            {treatmentPlan?.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group/item hover:bg-slate-100 transition-all">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${item.status === 'Completado' ? 'bg-emerald-100 text-emerald-600' :
                                            item.status === 'Aprobado' ? 'bg-blue-100 text-blue-600' :
                                                item.status === 'Cancelado' ? 'bg-red-100 text-red-600' :
                                                    'bg-amber-100 text-amber-600'
                                            }`}>
                                            {item.tooth || 'G'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-700 truncate">{item.description}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {(['Pendiente', 'Aprobado', 'Completado', 'Cancelado'] as const).map(st => (
                                                    <button
                                                        key={st}
                                                        onClick={async () => {
                                                            if (!treatmentPlan) return;
                                                            const updatedItems = treatmentPlan.items.map(i =>
                                                                i.id === item.id ? { ...i, status: st } : i
                                                            );
                                                            const updatedPlan = { ...treatmentPlan, items: updatedItems };
                                                            setTreatmentPlan(updatedPlan);
                                                            await patientService.saveTreatmentPlan(updatedPlan);
                                                        }}
                                                        className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border transition-all ${item.status === st
                                                            ? st === 'Completado' ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                                                : st === 'Aprobado' ? 'bg-blue-100 text-blue-600 border-blue-200'
                                                                    : st === 'Cancelado' ? 'bg-red-100 text-red-600 border-red-200'
                                                                        : 'bg-amber-100 text-amber-600 border-amber-200'
                                                            : 'bg-white text-gray-300 border-gray-100 hover:text-gray-500'
                                                            }`}
                                                    >
                                                        {st === 'Pendiente' ? 'Pend' : st === 'Aprobado' ? 'Apr' : st === 'Completado' ? 'Fin' : 'Can'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs font-black text-slate-600">${item.cost.toLocaleString()}</span>
                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setItemForm({ description: item.description, cost: item.cost.toString(), tooth: item.tooth?.toString() || '', status: item.status });
                                                    setShowItemModal(true);
                                                }}
                                                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!treatmentPlan) return;
                                                    const updatedItems = treatmentPlan.items.filter(i => i.id !== item.id);
                                                    const updatedPlan: TreatmentPlan = {
                                                        ...treatmentPlan,
                                                        items: updatedItems,
                                                        total_amount: updatedItems.reduce((s, i) => s + i.cost, 0)
                                                    };
                                                    setTreatmentPlan(updatedPlan);
                                                    await patientService.saveTreatmentPlan(updatedPlan);
                                                }}
                                                className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-600 hover:border-red-200 transition-all"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    setEditingItem(null);
                                    setItemForm({ description: '', cost: '', tooth: '', status: 'Pendiente' });
                                    setShowItemModal(true);
                                }}
                                className="w-full py-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all font-black uppercase text-[9px] tracking-widest"
                            >
                                <Plus size={14} /> Añadir Procedimiento
                            </button>
                        </div>

                        {/* Sección de Abonos */}
                        <div className="pt-4 border-t border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <CreditCard size={14} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Registro de Abono</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black">$</span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={paymentAmount}
                                        onChange={e => setPaymentAmount(e.target.value)}
                                        className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!treatmentPlan || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
                                        const amount = parseFloat(paymentAmount);
                                        const updatedPlan: TreatmentPlan = {
                                            ...treatmentPlan,
                                            paid_amount: (treatmentPlan.paid_amount || 0) + amount
                                        };
                                        setTreatmentPlan(updatedPlan);
                                        await patientService.saveTreatmentPlan(updatedPlan);

                                        // Registro Contable Automático (V16)
                                        await patientService.recordIncomeFromPayment(
                                            patient.id,
                                            patient.full_name,
                                            amount,
                                            `Abono de tratamiento: ${patient.full_name}`
                                        );

                                        setPaymentAmount('');
                                    }}
                                    disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                                    className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-30 flex items-center gap-2 shadow-lg shadow-emerald-100"
                                >
                                    <Check size={14} /> Abonar
                                </button>
                            </div>
                            {treatmentPlan && (
                                <div className="grid grid-cols-3 gap-2 pt-2">
                                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                                        <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Total</p>
                                        <p className="text-sm font-black text-indigo-600">${treatmentPlan.total_amount.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">Pagado</p>
                                        <p className="text-sm font-black text-emerald-600">${(treatmentPlan.paid_amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                                        <p className="text-[8px] font-black uppercase text-amber-400 tracking-widest">Pendiente</p>
                                        <p className="text-sm font-black text-amber-600">${(treatmentPlan.total_amount - (treatmentPlan.paid_amount || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Modal Añadir/Editar Procedimiento */}
                    {showItemModal && (
                        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/50 backdrop-blur-md p-4">
                            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                                <div className="flex justify-between items-center px-7 py-5 bg-gray-50/50 border-b border-gray-100">
                                    <h3 className="text-lg font-black text-gray-800 tracking-tight">
                                        {editingItem ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
                                    </h3>
                                    <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-red-500 transition-all">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-7 space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Descripción del Procedimiento</label>
                                        <input
                                            type="text"
                                            value={itemForm.description}
                                            onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm"
                                            placeholder="Ej: Resina compuesta, Extracción, Limpieza..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Costo ($)</label>
                                            <input
                                                type="number"
                                                value={itemForm.cost}
                                                onChange={e => setItemForm(f => ({ ...f, cost: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Pieza Dental</label>
                                            <input
                                                type="number"
                                                value={itemForm.tooth}
                                                onChange={e => setItemForm(f => ({ ...f, tooth: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none font-medium text-sm"
                                                placeholder="Ej: 18, 24..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Estado</label>
                                        <div className="flex gap-2">
                                            {(['Pendiente', 'Aprobado', 'Completado', 'Cancelado'] as const).map(st => (
                                                <button
                                                    key={st}
                                                    type="button"
                                                    onClick={() => setItemForm(f => ({ ...f, status: st }))}
                                                    className={`flex-1 px-3 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${itemForm.status === st
                                                        ? st === 'Completado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 scale-105'
                                                            : st === 'Aprobado' ? 'bg-blue-50 text-blue-600 border-blue-200 scale-105'
                                                                : st === 'Cancelado' ? 'bg-red-50 text-red-600 border-red-200 scale-105'
                                                                    : 'bg-amber-50 text-amber-600 border-amber-200 scale-105'
                                                        : 'bg-white text-gray-400 border-gray-100 hover:opacity-80'
                                                        }`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!treatmentPlan || !itemForm.description.trim() || !itemForm.cost) return;
                                            const cost = parseFloat(itemForm.cost);
                                            if (isNaN(cost) || cost <= 0) return;

                                            if (editingItem) {
                                                // Editar existente
                                                const updatedItems = treatmentPlan.items.map(i =>
                                                    i.id === editingItem.id ? {
                                                        ...i,
                                                        description: itemForm.description,
                                                        cost,
                                                        tooth: itemForm.tooth ? parseInt(itemForm.tooth) : undefined,
                                                        status: itemForm.status
                                                    } : i
                                                );
                                                const updatedPlan: TreatmentPlan = {
                                                    ...treatmentPlan,
                                                    items: updatedItems,
                                                    total_amount: updatedItems.reduce((s, i) => s + i.cost, 0)
                                                };
                                                setTreatmentPlan(updatedPlan);
                                                await patientService.saveTreatmentPlan(updatedPlan);
                                            } else {
                                                // Crear nuevo
                                                const newItem: TreatmentPlanItem = {
                                                    id: Date.now().toString(),
                                                    description: itemForm.description,
                                                    cost,
                                                    tooth: itemForm.tooth ? parseInt(itemForm.tooth) : undefined,
                                                    status: itemForm.status
                                                };
                                                const updatedPlan: TreatmentPlan = {
                                                    ...treatmentPlan,
                                                    items: [...treatmentPlan.items, newItem],
                                                    total_amount: treatmentPlan.total_amount + cost
                                                };
                                                setTreatmentPlan(updatedPlan);
                                                await patientService.saveTreatmentPlan(updatedPlan);
                                            }
                                            setShowItemModal(false);
                                            setEditingItem(null);
                                        }}
                                        disabled={!itemForm.description.trim() || !itemForm.cost || parseFloat(itemForm.cost) <= 0}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
                                    >
                                        <Save size={14} />
                                        {editingItem ? 'Actualizar Procedimiento' : 'Guardar Procedimiento'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sección 3: Historial (Bitácora) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2 text-gray-400">
                            <FileText size={16} />
                            <h4 className="font-black uppercase tracking-widest text-[10px]">Bitácora Histórica</h4>
                        </div>
                        <div className="bg-gray-50/50 rounded-[3rem] border border-gray-100 flex flex-col h-[400px] overflow-hidden">
                            <div className="p-8 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
                                {clinicalRecords.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 gap-3">
                                        <FileText size={48} strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic">Sin notas clínicas...</p>
                                    </div>
                                ) : (
                                    clinicalRecords.map((record) => (
                                        <div key={record.id} className="relative pl-8 group/item">
                                            <div className="absolute left-0 top-1.5 w-[2px] h-full bg-gray-200 transition-all rounded-full" />
                                            <div className="absolute -left-[4px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-300 transition-all" />
                                            <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm transition-all">
                                                <div className="flex items-center gap-2 text-indigo-600 mb-2.5">
                                                    <Calendar size={12} />
                                                    <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                                                        {new Date(record.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-[11px] text-gray-700 leading-relaxed font-semibold italic">"{record.note}"</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-6 bg-white border-t border-gray-100">
                                <button
                                    onClick={() => navigate(`/citas?patientId=${patient?.id}`)}
                                    className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Calendar size={14} className="group-hover:scale-110 transition-transform" />
                                    Programar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    );
};

export default PatientDetailsPage;
