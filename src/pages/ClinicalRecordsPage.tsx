import { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { Search, FileText, User, Calendar, ArrowRight, Activity, AlertCircle, Smile } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { Patient } from '../types';

interface ClinicalRecordWithPatient {
    id: string;
    patient_id: string;
    note: string;
    created_at: string;
    patients: Patient | Patient[];
}

const ClinicalSummaryView = ({ patient }: { patient: Patient }) => {
    const hasDeep = patient.deep_history && (
        patient.deep_history.systemic.conditions.length > 0 ||
        patient.deep_history.systemic.allergies.length > 0 ||
        patient.deep_history.habits.smoker ||
        patient.deep_history.stomatological.bleeding_gums
    );
    const hasLegacy = patient.questionnaire && Object.keys(patient.questionnaire).length > 0;

    if (!hasDeep && !hasLegacy && (!patient.medical_alerts || patient.medical_alerts.length === 0)) {
        return null;
    }

    const { questionnaire, deep_history } = patient;

    const sections = [
        {
            title: 'Alertas y Alergias',
            icon: AlertCircle,
            color: 'text-red-600',
            bg: 'bg-red-50',
            items: [
                ...(patient.medical_alerts?.map(a => ({ label: a, value: 'Crítico' })) || []),
                ...(deep_history?.systemic.allergies.map(a => ({ label: a.substance, value: a.severity })) || [])
            ]
        },
        {
            title: 'Condiciones Médicas',
            icon: Activity,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            items: [
                ...(deep_history?.systemic.conditions.map(c => ({ label: c.label, value: c.code || 'CIE-10' })) || []),
                { label: 'Diabetes/HTA', value: (questionnaire?.diabetes_hypertension || deep_history?.hereditary.diabetes) ? 'Reportado' : undefined }
            ].filter(i => i.value !== undefined)
        },
        {
            title: 'Hábitos y Salud Oral',
            icon: Smile,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            items: [
                { label: 'Tabaquismo', value: (deep_history?.habits.smoker || questionnaire?.smoker_vaper) ? 'SÍ' : 'NO' },
                { label: 'Sangrado Encías', value: (deep_history?.stomatological.bleeding_gums || questionnaire?.bleeding_gums) ? 'SÍ' : 'NO' },
                { label: 'Sensibilidad', value: (deep_history?.stomatological.temperature_sensitivity || questionnaire?.temperature_sensitivity) ? 'SÍ' : 'NO' }
            ]
        }
    ].filter(s => s.items.length > 0);

    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {sections.map((sec, i) => (
                <div key={i} className="bg-white/50 border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`${sec.bg} ${sec.color} p-1.5 rounded-lg`}>
                            <sec.icon size={12} />
                        </div>
                        <h4 className="text-[8px] font-black uppercase tracking-widest text-gray-400">{sec.title}</h4>
                    </div>
                    <div className="space-y-1.5">
                        {sec.items.map((item, j) => (
                            <div key={j} className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-600 font-bold truncate max-w-[120px]">{item.label}</span>
                                <span className="text-gray-400 font-black uppercase text-[7px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


const ClinicalRecordsPage = () => {
    const [records, setRecords] = useState<ClinicalRecordWithPatient[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            setIsLoading(true);
            const data = await patientService.searchAllClinicalRecords();
            setRecords(data);
        } catch (error) {
            console.error('Error cargando historiales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPatientData = (record: any): Patient | null => {
        if (!record.patients) return null;
        if (Array.isArray(record.patients)) return record.patients[0];
        return record.patients;
    };

    const filteredRecords = records.filter(record => {
        const patient = getPatientData(record);
        const patientName = patient?.full_name || '';
        const note = record.note || '';
        const search = searchTerm.toLowerCase();

        return patientName.toLowerCase().includes(search) ||
            note.toLowerCase().includes(search);
    });

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sin fecha';
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Lógica de agrupación por fechas
    const groupRecords = (recordsToGroup: ClinicalRecordWithPatient[]) => {
        const groups: { [key: string]: ClinicalRecordWithPatient[] } = {
            'Hoy': [],
            'Ayer': [],
            'Esta Semana': [],
            'Historial Antiguo': []
        };

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        recordsToGroup.forEach(record => {
            const date = new Date(record.created_at);
            if (date >= startOfToday) {
                groups['Hoy'].push(record);
            } else if (date >= startOfYesterday) {
                groups['Ayer'].push(record);
            } else if (date >= startOfWeek) {
                groups['Esta Semana'].push(record);
            } else {
                groups['Historial Antiguo'].push(record);
            }
        });

        return groups;
    };

    const groupedData = groupRecords(filteredRecords);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Historiales Médicos</h2>
                    <p className="text-gray-400 text-sm font-medium italic">Gestión cronológica de la clínica.</p>
                </div>
                <div className="bg-gray-900 text-white p-3 rounded-[1.5rem] shadow-xl">
                    <FileText size={24} />
                </div>
            </div>

            <div className="relative group/search">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-medical-blue transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Búsqueda instantánea de pacientes o notas..."
                    className="w-full pl-14 pr-4 py-5 bg-white border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-medical-blue/5 transition-all shadow-sm text-base font-medium placeholder:text-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-12 pb-20">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                        <Activity className="animate-spin text-medical-blue" size={40} />
                        <p className="text-xs font-black uppercase tracking-widest italic">Accediendo a la base de datos...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200 space-y-4">
                        <Search size={48} className="mx-auto text-gray-200" />
                        <p className="text-gray-400 text-sm font-bold italic tracking-tight">
                            {searchTerm ? 'Parece que no hay registros para esta búsqueda.' : 'No hay historiales clínicos registrados aún.'}
                        </p>
                    </div>
                ) : (
                    ['Hoy', 'Ayer', 'Esta Semana', 'Historial Antiguo'].map((groupName) => {
                        const groupRecords = groupedData[groupName];
                        if (!groupRecords || groupRecords.length === 0) return null;

                        return (
                            <div key={groupName} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                        {groupName}
                                    </h3>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                    <span className="text-[10px] font-bold text-gray-300 italic">{groupRecords.length} {groupRecords.length === 1 ? 'registro' : 'registros'}</span>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {groupRecords.map((record) => {
                                        const patient = getPatientData(record);
                                        return (
                                            <div
                                                key={record.id}
                                                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 hover:border-medical-blue/20 hover:shadow-xl transition-all group relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-medical-blue/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                <div className="flex justify-between items-start mb-6 relative z-10">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-3xl bg-gray-900 flex flex-col items-center justify-center text-white shadow-2xl transform group-hover:rotate-2 transition-transform">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div>
                                                            <Link to={`/pacientes/${patient?.id}`} className="block group/name">
                                                                <p className="font-black text-gray-900 text-xl group-hover/name:text-medical-blue transition-colors tracking-tighter">
                                                                    {patient?.full_name || 'Paciente no identificado'}
                                                                </p>
                                                            </Link>

                                                            <div className="flex items-center gap-3 mt-1.5">
                                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                                                                    <Calendar size={10} className="text-medical-blue" /> {formatDate(record.created_at)}
                                                                </div>
                                                                {patient?.occupation && (
                                                                    <span className="text-[9px] font-bold text-gray-400 italic">
                                                                        — {patient.occupation}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Link
                                                        to={`/pacientes/${patient?.id}`}
                                                        className="w-12 h-12 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-900 border border-gray-100 rounded-2xl transition-all shadow-sm hover:shadow-lg active:scale-95"
                                                        title="Ver expediente completo"
                                                    >
                                                        <ArrowRight size={24} />
                                                    </Link>
                                                </div>

                                                <div className="space-y-6 relative z-10">
                                                    {/* Nota Evolutiva Pro */}
                                                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 relative overflow-hidden group/note">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-1 h-3 bg-medical-blue rounded-full"></div>
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nota de Evolución</span>
                                                        </div>
                                                        <p className="text-gray-700 leading-relaxed font-semibold text-base italic">
                                                            "{record.note}"
                                                        </p>
                                                    </div>

                                                    {/* Cuestionario Orgánico Integrado */}
                                                    {patient && (
                                                        <div className="border-t border-gray-50 pt-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                                                    <Activity size={12} className="text-medical-blue" />
                                                                    Expediente Médico Orgánico
                                                                </h4>
                                                                <div className="h-0.5 w-10 bg-gray-100 rounded-full"></div>
                                                            </div>
                                                            <ClinicalSummaryView patient={patient} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ClinicalRecordsPage;
