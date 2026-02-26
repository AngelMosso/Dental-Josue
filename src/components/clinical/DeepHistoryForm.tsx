import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Smile, Activity, Users, ChevronDown, ChevronUp,
    Plus, Trash2, Search, CheckCircle2, Stethoscope
} from 'lucide-react';
import type { PatientDeepHistory, MedicalFlag, MedicationEntry, AllergyEntry } from '../../types';
import { CIE10_CATALOG } from '../../data/cie10';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_HISTORY: PatientDeepHistory = {
    systemic: { conditions: [], medications: [], allergies: [], surgeries: '', hospitalizations: '', blood_type: '' },
    stomatological: { bleeding_gums: false, temperature_sensitivity: false, jaw_popping: false, bruxism: false, previous_orthodontics: false, previous_extractions: false, mouth_breathing: false },
    habits: { smoker: false, alcohol: false, drugs: false, brushing_frequency: 'Dos veces', uses_floss: false, uses_mouthwash: false, diet: 'Moderada' },
    hereditary: { diabetes: false, hypertension: false, cancer: false, heart_disease: false, coagulation_disorders: false, notes: '' },
    audit_log: [],
    doctor_name: '',
};

const Toggle = ({ value, onChange, label, sublabel }: { value: boolean; onChange: (v: boolean) => void; label: string; sublabel?: string }) => (
    <div className={`flex items-center justify-between py-4 border-b border-slate-50 transition-all ${value ? 'bg-indigo-50/30 px-4 -mx-4 rounded-xl border-transparent' : ''}`}>
        <div className="flex flex-col">
            <span className={`text-sm font-bold transition-colors ${value ? 'text-indigo-900' : 'text-slate-600'}`}>{label}</span>
            {sublabel && <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{sublabel}</span>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!value)}
            className={`relative w-12 h-6 rounded-full transition-all duration-500 focus:outline-none ${value ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-200'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ${value ? 'translate-x-6 rotate-180' : 'translate-x-0'}`} />
        </button>
    </div>
);

const SectionHeader = ({ icon: Icon, title, color, isOpen, onToggle, badge }: any) => (
    <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 transition-all rounded-3xl ${isOpen ? 'bg-white shadow-xl shadow-slate-100 mb-2' : 'bg-slate-50 hover:bg-slate-100'}`}
    >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl shadow-sm ${color}`}><Icon size={20} /></div>
            <div className="text-left">
                <span className="font-black text-slate-700 text-[11px] uppercase tracking-widest block">{title}</span>
                {badge && <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{badge}</span>}
            </div>
        </div>
        {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
    </button>
);

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
    initialHistory?: PatientDeepHistory;
    onSave: (history: PatientDeepHistory) => void;
    isSaving?: boolean;
}

export const DeepHistoryForm = ({ initialHistory, onSave, isSaving }: Props) => {
    const [history, setHistory] = useState<PatientDeepHistory>(initialHistory ?? EMPTY_HISTORY);
    const [openSection, setOpenSection] = useState<string>('quick-scan');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSave = async () => {
        try {
            await onSave(history);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        }
    };

    // CIE-10 search state
    const [conditionSearch, setConditionSearch] = useState('');
    const [showCIESuggestions, setShowCIESuggestions] = useState(false);

    // Medication state
    const [medInput, setMedInput] = useState<MedicationEntry>({ name: '', dose: '', frequency: '' });
    const [medSearch, setMedSearch] = useState('');

    // Allergy state
    const [allergyInput, setAllergyInput] = useState<AllergyEntry>({ substance: '', reaction: '', severity: 'Moderada' });
    const [allergySearch, setAllergySearch] = useState('');

    const cieSuggestions = CIE10_CATALOG.filter(item =>
        item.label.toLowerCase().includes(conditionSearch.toLowerCase()) ||
        item.code.toLowerCase().includes(conditionSearch.toLowerCase())
    ).slice(0, 8);

    const addCondition = (flag: MedicalFlag) => {
        const already = history.systemic.conditions.some(c => c.code === flag.code);
        if (!already) {
            setHistory(h => ({ ...h, systemic: { ...h.systemic, conditions: [...h.systemic.conditions, flag] } }));
        }
        setConditionSearch('');
        setShowCIESuggestions(false);
    };

    const removeCondition = (code: string) =>
        setHistory(h => ({ ...h, systemic: { ...h.systemic, conditions: h.systemic.conditions.filter(c => c.code !== code) } }));

    const addMedication = () => {
        if (!medInput.name) return;
        setHistory(h => ({ ...h, systemic: { ...h.systemic, medications: [...h.systemic.medications, { ...medInput }] } }));
        setMedInput({ name: '', dose: '', frequency: '' });
        setMedSearch('');
    };

    const removeMedication = (i: number) =>
        setHistory(h => ({ ...h, systemic: { ...h.systemic, medications: h.systemic.medications.filter((_, idx) => idx !== i) } }));

    const addAllergy = () => {
        if (!allergyInput.substance) return;
        setHistory(h => ({ ...h, systemic: { ...h.systemic, allergies: [...h.systemic.allergies, { ...allergyInput }] } }));
        setAllergyInput({ substance: '', reaction: '', severity: 'Moderada' });
        setAllergySearch('');
    };

    const removeAllergy = (i: number) =>
        setHistory(h => ({ ...h, systemic: { ...h.systemic, allergies: h.systemic.allergies.filter((_, idx) => idx !== i) } }));

    const updateStomatological = (key: string, value: boolean) =>
        setHistory(h => ({ ...h, stomatological: { ...h.stomatological, [key]: value } }));

    const updateHereditary = (key: string, value: any) =>
        setHistory(h => ({ ...h, hereditary: { ...h.hereditary, [key]: value } }));

    const severityLabel = (s: MedicalFlag['severity']) => s === 'critical' ? 'Crítico' : s === 'warning' ? 'Precaución' : 'Info';
    const severityColor = (s: MedicalFlag['severity']) =>
        s === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
            s === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-blue-100 text-blue-700 border-blue-200';

    const allergySeverityColor = (s: AllergyEntry['severity']) =>
        s === 'Grave' ? 'bg-red-100 text-red-700' :
            s === 'Moderada' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';

    const toggle = (section: string) => setOpenSection(prev => prev === section ? '' : section);

    return (
        <div className="space-y-6 pb-20">
            {/* ── IDENTIDAD DEL MÉDICO (SIMPLIFICADO) ── */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400">
                    <Stethoscope size={24} />
                </div>
                <div className="flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Responsable Clínico</label>
                    <input
                        type="text"
                        placeholder="Nombre del Doctor..."
                        value={history.doctor_name || ''}
                        onChange={e => setHistory(h => ({ ...h, doctor_name: e.target.value.toUpperCase() }))}
                        className="w-full bg-transparent border-none p-0 text-slate-800 font-black text-sm placeholder:text-slate-300 focus:ring-0 uppercase tracking-widest"
                    />
                </div>
                {history.doctor_name && <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in" />}
            </div>

            {/* ── BLOQUE SISTÉMICO (SIEMPRE DISPONIBLE) ── */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <SectionHeader
                    icon={Heart}
                    title="Salud Sistémica"
                    color="bg-red-50 text-red-500"
                    isOpen={openSection === 'systemic'}
                    onToggle={() => toggle('systemic')}
                    badge={
                        (history.systemic.conditions.length > 0 ||
                            history.systemic.medications.length > 0 ||
                            history.systemic.allergies.length > 0) ? 'Con Diagnósticos' : ''
                    }
                />
                <AnimatePresence>
                    {openSection === 'systemic' && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <div className="p-6 space-y-6">
                                {/* Enfermedades */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Enfermedades (CIE-10)</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input type="text" placeholder="Buscar enfermedad..." value={conditionSearch} onChange={e => { setConditionSearch(e.target.value); setShowCIESuggestions(true); }} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-100 transition-all" />
                                        {showCIESuggestions && conditionSearch && cieSuggestions.length > 0 && (
                                            <div className="absolute z-20 top-full mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
                                                {cieSuggestions.map(item => (
                                                    <button key={item.code} type="button" onClick={() => addCondition(item)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{item.label}</span>
                                                            <span className="text-[9px] font-mono text-slate-400">{item.code}</span>
                                                        </div>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${severityColor(item.severity)}`}>{severityLabel(item.severity)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {history.systemic.conditions.map(c => (
                                            <div key={c.code} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] border font-black ${severityColor(c.severity)}`}>
                                                <span>{c.label}</span>
                                                <button type="button" onClick={() => removeCondition(c.code)}><Trash2 size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Medicamentos */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Medicamentos</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input type="text" placeholder="Medicamento..." value={medSearch} onChange={e => { setMedSearch(e.target.value); setMedInput(m => ({ ...m, name: e.target.value })); }} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" />
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Dosis..." value={medInput.dose} onChange={e => setMedInput(m => ({ ...m, dose: e.target.value }))} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" />
                                            <button type="button" onClick={addMedication} className="p-3 bg-indigo-600 text-white rounded-2xl"><Plus size={18} /></button>
                                        </div>
                                    </div>
                                    {history.systemic.medications.length > 0 && (
                                        <div className="space-y-1">
                                            {history.systemic.medications.map((m, i) => (
                                                <div key={i} className="flex items-center justify-between bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700">{m.name} <span className="text-slate-400 font-medium">({m.dose})</span></span>
                                                    <button type="button" onClick={() => removeMedication(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Alergias */}
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Alergias</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <input type="text" placeholder="Sustancia..." value={allergySearch} onChange={e => { setAllergySearch(e.target.value); setAllergyInput(a => ({ ...a, substance: e.target.value })); }} className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" />
                                        <div className="flex gap-2">
                                            <select value={allergyInput.severity} onChange={e => setAllergyInput(a => ({ ...a, severity: e.target.value as any }))} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold">
                                                <option>Leve</option><option>Moderada</option><option>Grave</option>
                                            </select>
                                            <button type="button" onClick={addAllergy} className="p-3 bg-red-600 text-white rounded-2xl"><Plus size={18} /></button>
                                        </div>
                                    </div>
                                    {history.systemic.allergies.length > 0 && (
                                        <div className="space-y-1">
                                            {history.systemic.allergies.map((a, i) => (
                                                <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-xl border ${a.severity === 'Grave' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                                    <span className="text-xs font-bold text-slate-700">{a.substance}</span>
                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${allergySeverityColor(a.severity)}`}>{a.severity}</span>
                                                    <button type="button" onClick={() => removeAllergy(i)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Otros Sistémicos */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo de Sangre</label>
                                        <select value={history.systemic.blood_type} onChange={e => setHistory(h => ({ ...h, systemic: { ...h.systemic, blood_type: e.target.value } }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black text-red-600">
                                            <option value="">— ? —</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cirugías / Internamientos</label>
                                        <input type="text" value={history.systemic.surgeries} onChange={e => setHistory(h => ({ ...h, systemic: { ...h.systemic, surgeries: e.target.value } }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm" placeholder="Especificar..." />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SECCIONES SECUNDARIAS (ESTOMATOLÓGICO Y HEREDITARIO) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <SectionHeader icon={Smile} title="Estomatológico" color="bg-blue-50 text-blue-500" isOpen={openSection === 'stomatological'} onToggle={() => toggle('stomatological')} />
                    <AnimatePresence>
                        {openSection === 'stomatological' && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-6 space-y-1">
                                    {[
                                        ['bleeding_gums', 'Sangrado encías'],
                                        ['temperature_sensitivity', 'Sensibilidad térmica'],
                                        ['jaw_popping', 'Ruidos mandibulares'],
                                        ['bruxism', 'Bruxismo'],
                                        ['previous_orthodontics', 'Ortodoncia previa'],
                                        ['previous_extractions', 'Extracciones previas']
                                    ].map(([key, label]) => (
                                        <Toggle key={key} label={label} value={(history.stomatological as any)[key]} onChange={v => updateStomatological(key, v)} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <SectionHeader icon={Users} title="Heredofamiliares" color="bg-purple-50 text-purple-500" isOpen={openSection === 'hereditary'} onToggle={() => toggle('hereditary')} />
                    <AnimatePresence>
                        {openSection === 'hereditary' && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="p-6 space-y-1">
                                    {[
                                        ['diabetes', 'Diabetes'],
                                        ['hypertension', 'Hipertensión'],
                                        ['heart_disease', 'Cardiopatías'],
                                        ['cancer', 'Cáncer'],
                                        ['coagulation_disorders', 'Coagulación']
                                    ].map(([key, label]) => (
                                        <Toggle key={key} label={label} value={(history.hereditary as any)[key]} onChange={v => updateHereditary(key, v)} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Botón Guardar Flotante (SIMPLIFICADO) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || !history.doctor_name || isSuccess}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isSuccess
                        ? 'bg-emerald-500 text-white'
                        : !history.doctor_name
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-900 text-white hover:bg-slate-900'
                        }`}
                >
                    {isSaving ? <Activity size={18} className="animate-spin" /> : isSuccess ? <CheckCircle2 size={18} /> : <CheckCircle2 size={18} />}
                    {isSaving ? 'Guardando...' : isSuccess ? 'Registro Completado' : 'Finalizar Registro'}
                </button>
            </div>
        </div>
    );
};

export default DeepHistoryForm;
