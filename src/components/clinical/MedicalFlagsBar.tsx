import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PatientDeepHistory } from '../../types';

interface Props {
    deepHistory?: PatientDeepHistory;
    medicalAlerts?: string[]; // legacy alerts
}

export const MedicalFlagsBar = ({ deepHistory, medicalAlerts = [] }: Props) => {
    // Recopilar todas las banderas críticas y de advertencia
    const criticalFlags: string[] = [];
    const warningFlags: string[] = [];

    // Desde deep_history → condiciones CIE-10
    if (deepHistory?.systemic.conditions) {
        for (const c of deepHistory.systemic.conditions) {
            if (c.severity === 'critical') criticalFlags.push(c.label);
            else if (c.severity === 'warning') warningFlags.push(c.label);
        }
    }

    // Desde deep_history → alergias graves
    if (deepHistory?.systemic.allergies) {
        for (const a of deepHistory.systemic.allergies) {
            const text = `Alergia a ${a.substance}${a.severity === 'Grave' ? ' (Grave)' : ''}`;
            if (a.severity === 'Grave') criticalFlags.push(text);
            else if (a.severity === 'Moderada') warningFlags.push(text);
        }
    }

    // Legacy medical_alerts
    for (const alert of medicalAlerts) {
        if (!criticalFlags.includes(alert)) criticalFlags.push(alert);
    }

    // Hábitos de riesgo
    if (deepHistory?.habits.smoker) warningFlags.push('Fumador activo');
    if (deepHistory?.systemic.blood_type) { /* solo info */ }

    const hasCritical = criticalFlags.length > 0;
    const hasWarning = warningFlags.length > 0;

    if (!hasCritical && !hasWarning) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="space-y-2 mb-6"
            >
                {/* Banner Crítico — Rojo */}
                {hasCritical && (
                    <div className="flex items-start gap-3 bg-red-600 rounded-2xl px-5 py-4 shadow-lg shadow-red-100">
                        <div className="p-1.5 bg-red-500 rounded-lg shrink-0 mt-0.5">
                            <ShieldAlert size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-200 mb-1">
                                ⚠ Alertas Críticas — Verificar antes de cualquier procedimiento
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {criticalFlags.map((flag, i) => (
                                    <span key={i} className="bg-red-500/50 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-red-400">
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner Advertencia — Ámbar */}
                {hasWarning && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                        <div className="p-1.5 bg-amber-100 rounded-lg shrink-0 mt-0.5">
                            <AlertTriangle size={16} className="text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                                Condiciones de Precaución
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {warningFlags.map((flag, i) => (
                                    <span key={i} className="bg-amber-100 text-amber-700 text-[11px] font-bold px-3 py-1 rounded-full border border-amber-200">
                                        {flag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default MedicalFlagsBar;
