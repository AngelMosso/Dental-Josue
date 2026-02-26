import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, User, Activity, X, Save, AlertCircle, ChevronRight, Zap, Heart, Smile, Users, CheckCircle2, Stethoscope, MapPin, Phone, Droplets, Clock } from 'lucide-react';
import { calculateAge, patientService } from '../services/patientService';
import type { Appointment, Patient, PatientDeepHistory, MedicalFlag, MedicationEntry, AllergyEntry } from '../types';
import { CIE10_CATALOG } from '../data/cie10';
import { motion, AnimatePresence } from 'framer-motion';

const EMPTY_DEEP_HISTORY: PatientDeepHistory = {
    systemic: { conditions: [], medications: [], allergies: [], surgeries: '', hospitalizations: '', blood_type: '' },
    stomatological: { bleeding_gums: false, temperature_sensitivity: false, jaw_popping: false, bruxism: false, previous_orthodontics: false, previous_extractions: false, mouth_breathing: false },
    habits: { smoker: false, alcohol: false, drugs: false, brushing_frequency: 'Dos veces', uses_floss: false, uses_mouthwash: false, diet: 'Moderada' },
    hereditary: { diabetes: false, hypertension: false, cancer: false, heart_disease: false, coagulation_disorders: false, notes: '' },
    audit_log: [],
    doctor_name: '',
};

// --- Modal de Paciente ---
interface PatientModalProps {
    patient?: Patient | null;
    onClose: () => void;
    onSave: (patient: Patient) => void;
}

// --- Sub-componentes del Modal (Definidos afuera para evitar pérdida de foco) ---
const Section = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all mb-4">
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-50 flex items-center gap-3">
            <Icon size={18} className="text-medical-blue" />
            <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-500">{title}</h4>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const ModalToggle = ({ label, value, onChange }: any) => (
    <label className="flex items-center justify-between p-4 bg-white border border-gray-50 rounded-2xl hover:border-medical-blue/20 transition-all group cursor-pointer">
        <span className={`text-sm font-bold transition-colors ${value ? 'text-medical-blue' : 'text-gray-600'}`}>{label}</span>
        <div onClick={onChange} className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${value ? 'bg-medical-blue' : 'bg-gray-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 transform ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    </label>
);

const PatientModal = ({ patient, onClose, onSave }: PatientModalProps) => {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        full_name: patient?.full_name ?? '',
        birth_date: patient?.birth_date ?? '',
        age: patient?.age?.toString() ?? '',
        phone: patient?.phone ?? '',
        email: patient?.email ?? '',
        occupation: patient?.occupation ?? '',
        consultation_reason: patient?.consultation_reason ?? '',
        medical_history: patient?.medical_history ?? '',
        medical_alerts: patient?.medical_alerts ?? [],
        sex: patient?.sex ?? '',
        address: patient?.address ?? '',
        curp: patient?.curp ?? '',
        deep_history: patient?.deep_history ?? { ...EMPTY_DEEP_HISTORY },
        treatment_status: patient?.treatment_status ?? 'Diagnóstico',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // --- Estados locales para Deep History ---
    const [quickScan, setQuickScan] = useState({
        conditions: form.deep_history?.systemic?.conditions?.length > 0,
        meds: form.deep_history?.systemic?.medications?.length > 0,
        allergies: form.deep_history?.systemic?.allergies?.length > 0,
        surgeries: !!form.deep_history?.systemic?.surgeries || !!form.deep_history?.systemic?.hospitalizations,
        blood: !!form.deep_history?.systemic?.blood_type
    });
    const [conditionSearch, setConditionSearch] = useState('');
    const [showCIESuggestions, setShowCIESuggestions] = useState(false);
    const [medInput, setMedInput] = useState<MedicationEntry>({ name: '', dose: '', frequency: '' });
    const [allergyInput, setAllergyInput] = useState<AllergyEntry>({ substance: '', reaction: '', severity: 'Moderada' });

    const cieSuggestions = CIE10_CATALOG.filter(item =>
        item.label.toLowerCase().includes(conditionSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(conditionSearch.toLowerCase())
    ).slice(0, 5);

    useEffect(() => {
        if (form.birth_date) {
            const age = calculateAge(form.birth_date);
            setForm(prev => ({ ...prev, age: age.toString() }));
        }
    }, [form.birth_date]);

    // Helpers de actualización
    const updateDeep = (path: string, value: any) => {
        setForm(prev => {
            const parts = path.split('.');
            let newDeep = { ...prev.deep_history } as any;
            let current = newDeep;
            for (let i = 0; i < parts.length - 1; i++) {
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
            }
            current[parts[parts.length - 1]] = value;
            return { ...prev, deep_history: newDeep };
        });
    };

    const toggleDeep = (path: string) => {
        const parts = path.split('.');
        let current = form.deep_history as any;
        for (const p of parts) current = current[p];
        updateDeep(path, !current);
    };

    const addCondition = (flag: MedicalFlag) => {
        const current = form.deep_history.systemic.conditions;
        if (!current.some(c => c.code === flag.code)) {
            updateDeep('systemic.conditions', [...current, flag]);
        }
        setConditionSearch('');
        setShowCIESuggestions(false);
    };

    const addMedication = () => {
        if (!medInput.name) return;
        updateDeep('systemic.medications', [...form.deep_history.systemic.medications, { ...medInput }]);
        setMedInput({ name: '', dose: '', frequency: '' });
    };

    const addAllergy = () => {
        if (!allergyInput.substance) return;
        updateDeep('systemic.allergies', [...form.deep_history.systemic.allergies, { ...allergyInput }]);
        setAllergyInput({ substance: '', reaction: '', severity: 'Moderada' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Solo avanzar de paso si no es el último
        if (step < 5) {
            setStep(s => s + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!form.full_name?.trim()) {
            setError('El nombre del paciente es obligatorio.');
            return;
        }

        try {
            setSaving(true);
            setError('');

            // Sincronización inteligente de alertas críticas
            const criticalConditions = form.deep_history.systemic.conditions
                .filter(c => c.severity === 'critical')
                .map(c => `⚠️ ${c.label}`);

            const severeAllergies = form.deep_history.systemic.allergies
                .filter(a => a.severity === 'Grave')
                .map(a => `🚫 Alergia: ${a.substance}`);

            const allAlerts = [...new Set([...criticalConditions, ...severeAllergies])];

            const payload: any = {
                ...form,
                medical_alerts: allAlerts,
                birth_date: form.birth_date || '',
                age: form.age ? parseInt(form.age) : 0,
            };

            if (patient?.id) {
                const updated = await patientService.update(patient.id, payload as Partial<Patient>);
                onSave(updated);
            } else {
                const created = await patientService.create(payload as Omit<Patient, "id" | "created_at">);
                onSave(created);
            }
        } catch (err: any) {
            console.error('SAVE_PATIENT_ERROR:', err);
            setError(err.message || 'Error al procesar el expediente');
        } finally {
            setSaving(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4">
                        <Section title="Identidad del Paciente" icon={User}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Nombre Completo *</label>
                                    <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700" placeholder="Nombre completo" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Fecha Nacimiento</label>
                                    <input type="date" value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Edad</label>
                                    <input type="text" value={form.age} readOnly className="w-full px-5 py-3 bg-blue-50/50 border-none rounded-2xl font-black text-medical-blue text-sm text-center" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Sexo *</label>
                                    <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value as any }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700">
                                        <option value="">Seleccionar...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><Phone size={12} /> Teléfono *</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700" placeholder="55 1234 5678" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Dirección Completa *</label>
                                    <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700" placeholder="Calle, número, colonia, CP..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2"><Stethoscope size={12} /> Motivo de consulta</label>
                                    <textarea value={form.consultation_reason} onChange={e => setForm(f => ({ ...f, consultation_reason: e.target.value }))} className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none transition-all font-bold text-sm text-gray-700 resize-none" rows={2} placeholder="¿Qué le trae por aquí hoy?" />
                                </div>
                            </div>
                        </Section>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-premium">
                        <Section title="Salud Sistémica y Riesgos" icon={Activity}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'conditions', label: 'Enfermedades', icon: Heart },
                                        { id: 'meds', label: 'Medicamentos', icon: Zap },
                                        { id: 'allergies', label: 'Alergias', icon: AlertCircle },
                                        { id: 'blood', label: 'Tipo de Sangre', icon: Droplets }
                                    ].map(item => (
                                        <button key={item.id} type="button" onClick={() => setQuickScan(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof quickScan] }))}
                                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${quickScan[item.id as keyof typeof quickScan] ? 'bg-medical-blue/5 border-medical-blue/20 text-medical-blue' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}>
                                            <item.icon size={16} />
                                            <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Contenido Dinámico de Salud */}
                                <AnimatePresence>
                                    {quickScan.conditions && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pt-4 border-t border-gray-100">
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                                <input type="text" value={conditionSearch} onChange={e => { setConditionSearch(e.target.value); setShowCIESuggestions(true); }} className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-2 focus:ring-medical-blue/20 outline-none font-bold text-xs" placeholder="Buscar enfermedad (CIE-10)..." />

                                                {showCIESuggestions && conditionSearch.length > 1 && (
                                                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                                        {cieSuggestions.map(s => (
                                                            <button key={s.code} type="button" onClick={() => addCondition({ ...s, severity: 'warning' })} className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0">
                                                                <span className="text-xs font-bold text-gray-700">{s.label}</span>
                                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{s.code}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {form.deep_history.systemic.conditions.map(c => (
                                                    <div key={c.code} className="flex items-center gap-2 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100">
                                                        <span className="text-[10px] font-black">{c.label}</span>
                                                        <button type="button" onClick={() => updateDeep('systemic.conditions', form.deep_history.systemic.conditions.filter(x => x.code !== c.code))} className="hover:text-amber-800 transition-colors"><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {quickScan.meds && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-gray-100">
                                            <div className="flex gap-2">
                                                <input type="text" value={medInput.name} onChange={e => setMedInput({ ...medInput, name: e.target.value })} className="flex-[2] px-4 py-2 bg-white border border-gray-100 rounded-xl font-bold text-xs" placeholder="Medicamento" />
                                                <input type="text" value={medInput.dose} onChange={e => setMedInput({ ...medInput, dose: e.target.value })} className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-xl font-bold text-xs" placeholder="Dosis" />
                                                <button type="button" onClick={addMedication} className="p-2 bg-medical-blue text-white rounded-xl hover:bg-blue-600 transition-colors"><Plus size={20} /></button>
                                            </div>
                                            <div className="space-y-1 mt-3">
                                                {form.deep_history.systemic.medications.map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
                                                        <span className="text-[10px] font-black text-gray-600">{m.name} <span className="text-gray-400">({m.dose})</span></span>
                                                        <button type="button" onClick={() => updateDeep('systemic.medications', form.deep_history.systemic.medications.filter((_, idx) => idx !== i))}><X size={12} className="text-gray-300 hover:text-red-500" /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {quickScan.allergies && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-gray-100">
                                            <div className="flex gap-2">
                                                <input type="text" value={allergyInput.substance} onChange={e => setAllergyInput({ ...allergyInput, substance: e.target.value })} className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-xl font-bold text-xs" placeholder="Sustancia (Látex, Penicilina...)" />
                                                <button type="button" onClick={addAllergy} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"><Plus size={20} /></button>
                                            </div>
                                            <div className="space-y-1 mt-3">
                                                {form.deep_history.systemic.allergies.map((a, i) => (
                                                    <div key={i} className="flex items-center justify-between px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
                                                        <span className="text-[10px] font-black">{a.substance}</span>
                                                        <button type="button" onClick={() => updateDeep('systemic.allergies', form.deep_history.systemic.allergies.filter((_, idx) => idx !== i))}><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {quickScan.blood && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-4 gap-2">
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                                                    <button key={type} type="button" onClick={() => updateDeep('systemic.blood_type', type)} className={`py-2 rounded-xl text-[10px] font-black border transition-all ${form.deep_history.systemic.blood_type === type ? 'bg-red-500 text-white border-red-600' : 'bg-white text-gray-400 border-gray-100 hover:border-red-200'}`}>{type}</button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Section>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-premium">
                        <Section title="Hábitos y Estilo de Vida" icon={Smile}>
                            <div className="space-y-3">
                                <ModalToggle label="¿Fuma o vapea?" value={form.deep_history.habits.smoker} onChange={() => toggleDeep('habits.smoker')} />
                                <ModalToggle label="¿Consume alcohol?" value={form.deep_history.habits.alcohol} onChange={() => toggleDeep('habits.alcohol')} />
                                <ModalToggle label="¿Consume otras sustancias?" value={form.deep_history.habits.drugs} onChange={() => toggleDeep('habits.drugs')} />
                                <div className="p-4 bg-white border border-gray-50 rounded-2xl">
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Frecuencia de Cepillado</label>
                                    <select value={form.deep_history.habits.brushing_frequency} onChange={e => updateDeep('habits.brushing_frequency', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl font-bold text-xs outline-none">
                                        <option value="Una vez">Una vez al día</option>
                                        <option value="Dos veces">Dos veces al día</option>
                                        <option value="Tres o más">Tres o más veces</option>
                                    </select>
                                </div>
                                <ModalToggle label="Usa Hilo Dental" value={form.deep_history.habits.uses_floss} onChange={() => toggleDeep('habits.uses_floss')} />
                            </div>
                        </Section>
                        <Section title="Exploración Estomatológica" icon={Users}>
                            <div className="grid grid-cols-1 gap-2">
                                <ModalToggle label="¿Le sangran las encías?" value={form.deep_history.stomatological.bleeding_gums} onChange={() => toggleDeep('stomatological.bleeding_gums')} />
                                <ModalToggle label="¿Sensibilidad dental?" value={form.deep_history.stomatological.temperature_sensitivity} onChange={() => toggleDeep('stomatological.temperature_sensitivity')} />
                                <ModalToggle label="¿Truena la mandíbula?" value={form.deep_history.stomatological.jaw_popping} onChange={() => toggleDeep('stomatological.jaw_popping')} />
                                <ModalToggle label="¿Aprieta los dientes (Bruxismo)?" value={form.deep_history.stomatological.bruxism} onChange={() => toggleDeep('stomatological.bruxism')} />
                            </div>
                        </Section>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4">
                        <Section title="Antecedentes Heredofamiliares" icon={Users}>
                            <div className="space-y-2">
                                <ModalToggle label="Diabetes" value={form.deep_history.hereditary.diabetes} onChange={() => toggleDeep('hereditary.diabetes')} />
                                <ModalToggle label="Hipertensión" value={form.deep_history.hereditary.hypertension} onChange={() => toggleDeep('hereditary.hypertension')} />
                                <ModalToggle label="Cardiopatías" value={form.deep_history.hereditary.heart_disease} onChange={() => toggleDeep('hereditary.heart_disease')} />
                                <ModalToggle label="Cáncer" value={form.deep_history.hereditary.cancer} onChange={() => toggleDeep('hereditary.cancer')} />
                                <ModalToggle label="Problemas de Coagulación" value={form.deep_history.hereditary.coagulation_disorders} onChange={() => toggleDeep('hereditary.coagulation_disorders')} />
                            </div>
                        </Section>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-4">
                        <Section title="Validación y Firma Médica" icon={CheckCircle2}>
                            <div className="space-y-6">
                                <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <Stethoscope className="text-medical-blue" size={32} />
                                    </div>
                                    <h5 className="font-black text-gray-800 text-sm">Responsable del Expediente</h5>
                                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mt-1">Nombre del Doctor(a)</p>

                                    <input
                                        type="text"
                                        value={form.deep_history.doctor_name || ''}
                                        onChange={e => updateDeep('doctor_name', e.target.value)}
                                        className="mt-6 w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-center font-black text-medical-blue shadow-sm outline-none focus:ring-2 focus:ring-medical-blue/20 placeholder:text-gray-200"
                                        placeholder="P ej: Dra. Ana García"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest text-center">Estatus Final del Paciente</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: 'Diagnóstico', color: 'bg-amber-50 text-amber-600 border-amber-200' },
                                            { id: 'En Proceso', color: 'bg-blue-50 text-blue-600 border-blue-200' },
                                            { id: 'Completado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
                                        ].map((s) => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, treatment_status: s.id as any }))}
                                                className={`flex-1 px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${form.treatment_status === s.id
                                                    ? `${s.color} border-2 scale-105 shadow-md`
                                                    : 'bg-white text-gray-400 border-gray-100 opacity-60 hover:opacity-100'
                                                    }`}
                                            >
                                                {s.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-md p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
                <div className="flex justify-between items-center px-8 py-6 bg-gray-50/50 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">
                            {patient?.id ? 'Actualizar Ficha' : 'Nuevo Expediente'}
                        </h2>
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-6 bg-medical-blue' : 'w-2 bg-gray-200'}`} />
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400 hover:text-red-500 shadow-sm border border-transparent hover:border-red-50">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="min-h-[400px]">
                        {renderStep()}
                    </div>

                    {error && (
                        <p className="text-xs font-bold text-red-500 bg-red-50 px-4 py-3 rounded-2xl mb-4 border border-red-100 flex items-center gap-2">
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-6 border-t border-gray-100">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                className="flex-1 px-6 py-3 border border-gray-200 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Anterior
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className={`flex-[2] px-6 py-3 rounded-2xl font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 ${step === 5 ? 'bg-medical-blue text-white hover:bg-blue-600' : 'bg-gray-800 text-white hover:bg-gray-900'
                                }`}
                        >
                            {saving ? 'Guardando...' : step === 5 ? (
                                <><Save size={18} /> Finalizar Registro</>
                            ) : (
                                <>Siguiente Paso <ChevronRight size={18} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Página Principal ---
const PatientsPage = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('new') === 'true') {
            setShowModal(true);
            setEditingPatient(null);
        }
        const editId = query.get('edit');
        if (editId) {
            loadPatientToEdit(editId);
        }
    }, [location.search]);

    useEffect(() => {
        loadPatients();
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await patientService.getAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Error cargando citas:', error);
        }
    };

    const loadPatients = async () => {
        try {
            setIsLoading(true);
            const data = await patientService.getAll();
            setPatients(data);

            // 🛡️ Reparar IDs/Sellos faltantes automáticamente
            if (data.length > 0 && data.some(p => !p.readable_id)) {
                await patientService.backfillSecurityData();
                const refreshed = await patientService.getAll();
                setPatients(refreshed);
            }
        } catch (error) {
            console.error('Error cargando pacientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPatientToEdit = async (id: string) => {
        try {
            const p = await patientService.getById(id);
            if (p) {
                setEditingPatient(p);
                setShowModal(true);
            }
        } catch (error) {
            console.error('Error cargando paciente para editar:', error);
        }
    };

    const handleSave = (saved: Patient) => {
        setPatients(prev => {
            const exists = prev.find(p => p.id === saved.id);
            if (exists) return prev.map(p => p.id === saved.id ? saved : p);
            return [saved, ...prev];
        });
        setShowModal(false);
        setEditingPatient(null);
        navigate(`/pacientes/${saved.id}`);
    };

    const filteredPatients = patients.filter(p =>
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNextAppointment = (patientId: string) => {
        const now = new Date();
        return appointments
            .filter(a => a.patient_id === patientId && a.status !== 'Cancelada')
            .map(a => ({ ...a, dateTime: new Date(`${a.date}T${a.time}`) }))
            .filter(a => a.dateTime >= now)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
    };


    return (
        <div className="flex flex-col h-full space-y-8">
            {/* Modal */}
            {showModal && (
                <PatientModal
                    patient={editingPatient}
                    onClose={() => {
                        setShowModal(false);
                        setEditingPatient(null);
                        navigate('/pacientes');
                    }}
                    onSave={handleSave}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Directorio Clínico</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Sincronizado con Supabase Cloud</p>
                </div>
                <button
                    onClick={() => { setEditingPatient(null); setShowModal(true); }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-medical-blue transition-all shadow-xl shadow-gray-200 text-[10px]"
                >
                    <Plus size={18} /> Nuevo Expediente
                </button>
            </div>

            <div className="flex flex-col gap-6 flex-1 overflow-hidden">
                {/* Search Block */}
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-medical-blue transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, teléfono o diagnóstico..."
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-[2rem] focus:outline-none focus:border-medical-blue/20 focus:bg-white text-sm font-semibold shadow-sm transition-all placeholder:text-gray-200"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                        <span className="text-[10px] font-black bg-gray-50 px-3 py-1.5 rounded-full text-gray-400 border border-gray-100">
                            {filteredPatients.length} PACIENTES
                        </span>
                    </div>
                </div>

                {/* Grid List - V7 Eficiencia Clínica (Restaurado) */}
                <div className="flex flex-col gap-2 overflow-y-auto pb-10 scrollbar-hide stagger-children">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 skeleton border border-gray-100 rounded-2xl" />
                        ))
                    ) : filteredPatients.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                            <Activity size={56} className="text-gray-300" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No se encontraron coincidencias</p>
                        </div>
                    ) : (
                        filteredPatients.map(patient => (
                            <button
                                key={patient.id}
                                onClick={() => navigate(`/pacientes/${patient.id}`)}
                                className={`group flex items-center gap-6 p-3 px-6 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all duration-300 text-left relative overflow-hidden active:scale-[0.995] border-l-4 ${patient.treatment_status === 'Completado' ? 'border-l-emerald-500' :
                                    patient.treatment_status === 'En Proceso' ? 'border-l-blue-500' :
                                        'border-l-amber-500'
                                    }`}
                            >
                                {/* 1. Identidad Directa */}
                                <div className="flex items-center gap-4 w-[240px] shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-base group-hover:bg-medical-blue group-hover:text-white transition-all duration-500 shrink-0">
                                        {patient.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-extrabold text-slate-800 text-sm leading-tight capitalize truncate group-hover:text-medical-blue transition-colors">
                                                {patient.full_name.toLowerCase()}
                                            </p>
                                            {patient.readable_id && (
                                                <div className="flex items-center gap-1.5 bg-white border border-slate-200/50 rounded-lg px-2.5 py-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-medical-blue/30 transition-all group/folio">
                                                    <div className="w-1 h-1 rounded-full bg-medical-blue animate-pulse opacity-70" />
                                                    <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.1em]">FOLIO</span>
                                                    <span className="text-[10px] font-mono font-black text-slate-700 tracking-tight whitespace-nowrap">
                                                        {patient.readable_id}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">
                                            {patient.age || '—'} años
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Logística y Diagnóstico (V10) */}
                                <div className="flex-1 min-w-0 flex items-center gap-12">
                                    {/* Próxima Cita - Calendar Chip Design */}
                                    <div className="flex items-center gap-3 min-w-[180px]">
                                        {(() => {
                                            const nextAppt = getNextAppointment(patient.id);
                                            if (!nextAppt) return (
                                                <div className="px-4 py-2 bg-slate-50 border border-slate-100/50 rounded-2xl opacity-20">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sin cita pendiente</span>
                                                </div>
                                            );

                                            const date = new Date(`${nextAppt.date}T${nextAppt.time}`);
                                            const day = date.getDate();
                                            const month = date.toLocaleString('es-ES', { month: 'short' }).replace('.', '');

                                            return (
                                                <div className="flex items-center gap-3 group/appt">
                                                    {/* Calendar Chip */}
                                                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50/50 rounded-xl border border-blue-100 group-hover:bg-medical-blue group-hover:border-transparent transition-all duration-500 shadow-sm">
                                                        <span className="text-[8px] font-black text-medical-blue group-hover:text-blue-100 uppercase leading-none tracking-tighter">{month}</span>
                                                        <span className="text-sm font-black text-slate-700 group-hover:text-white leading-none mt-0.5">{day}</span>
                                                    </div>
                                                    {/* Time Info */}
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] leading-none mb-1">Próxima</span>
                                                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase leading-none font-mono tracking-tighter">
                                                            {nextAppt.time} hrs
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Diagnóstico Sumario - Sin etiquetas */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-slate-400 italic truncate group-hover:text-slate-600 transition-colors">
                                            {patient.consultation_reason || 'Sin diagnóstico registrado'}
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Acciones Limpias */}
                                <div className="flex items-center gap-4 shrink-0">
                                    {patient.treatment_status && (
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${patient.treatment_status === 'Completado' ? 'text-emerald-500/50' :
                                            patient.treatment_status === 'En Proceso' ? 'text-blue-500/50' :
                                                'text-amber-500/50'
                                            }`}>
                                            {patient.treatment_status}
                                        </span>
                                    )}
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-medical-blue group-hover:bg-blue-50 transition-all duration-300">
                                        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientsPage;
