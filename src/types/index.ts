// ─── Historial Clínico Profundo ─────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface MedicalFlag {
    code: string;       // CIE-10, ej: "I10"
    label: string;      // Ej: "Hipertensión esencial"
    severity: AlertSeverity;
}

export interface MedicationEntry {
    name: string;
    dose?: string;
    frequency?: string;
}

export interface AllergyEntry {
    substance: string;  // Ej: "Penicilina"
    reaction?: string;  // Ej: "Anafilaxia"
    severity: 'Leve' | 'Moderada' | 'Grave';
}

export interface AuditEntry {
    user: string;
    action: string;
    timestamp: string;
    field_changed?: string;
    hash: string;       // SHA-256 del estado completo
}

export interface PatientDeepHistory {
    systemic: {
        conditions: MedicalFlag[];
        medications: MedicationEntry[];
        allergies: AllergyEntry[];
        surgeries?: string;
        hospitalizations?: string;
        blood_type?: string;
    };
    stomatological: {
        bleeding_gums: boolean;
        temperature_sensitivity: boolean;
        jaw_popping: boolean;
        bruxism: boolean;
        previous_orthodontics: boolean;
        previous_extractions: boolean;
        mouth_breathing: boolean;
    };
    habits: {
        smoker: boolean;
        alcohol: boolean;
        drugs: boolean;
        brushing_frequency: 'Una vez' | 'Dos veces' | 'Tres o más';
        uses_floss: boolean;
        uses_mouthwash: boolean;
        diet: 'Alta en azúcar' | 'Moderada' | 'Saludable';
    };
    hereditary: {
        diabetes: boolean;
        hypertension: boolean;
        cancer: boolean;
        heart_disease: boolean;
        coagulation_disorders: boolean;
        notes?: string;
    };
    audit_log: AuditEntry[];
    doctor_name?: string;
    last_updated?: string;
    updated_by?: string;
}

// ─── Paciente ────────────────────────────────────────────────────────────────

export interface Patient {
    id: string;
    full_name: string;
    birth_date?: string;
    age?: number;
    phone?: string;
    email?: string;
    rfc?: string;
    curp?: string;
    sex?: 'Masculino' | 'Femenino' | 'Otro';
    address?: string;
    occupation?: string;
    consultation_reason?: string;
    medical_history?: string;
    medical_alerts?: string[];            // Alertas críticas generadas automáticamente
    deep_history?: PatientDeepHistory;    // ← Expediente Único Unificado
    questionnaire?: Record<string, any>;  // Obsoleto: Usar deep_history en su lugar
    treatment_status?: 'Diagnóstico' | 'En Proceso' | 'Completado';
    status?: string;
    readable_id?: string;
    digital_seal?: string;
    last_visit?: string;
    treatments?: TreatmentPlan[];
    created_at: string;
}


export interface ClinicalRecord {
    id: string;
    patient_id: string;
    note: string;
    created_at: string;
}

export type ToothStatus = 'Sano' | 'Caries' | 'Ausente' | 'Tratado' | 'Tratado (Oro)' | 'Tratado (Zirconia)';

export interface OdontogramData {
    [toothNumber: number]: ToothStatus;
}

export interface PatientFile {
    id: string;
    patient_id: string;
    file_url: string;
    file_name: string;
    file_type?: string;
    created_at: string;
}

export type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';

export interface Appointment {
    id: string;
    patient_id: string;
    patient_name: string; // Redundancia para facilitar renderizado en agenda
    date: string; // ISO string
    time: string; // HH:mm
    duration: number; // minutos
    reason: string;
    status: AppointmentStatus;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: 'Material' | 'Instrumental' | 'Anestesia' | 'Desechable' | 'Otro';
    stock: number;
    min_stock: number; // Para alertas
    last_restock?: string;
    unit: string; // 'Piezas', 'Cajas', 'Cartuchos', etc.
    unit_price: number;
}

export interface TreatmentPlanItem {
    id: string;
    description: string;
    tooth?: number;
    cost: number;
    status: 'Pendiente' | 'Aprobado' | 'Completado' | 'Cancelado';
}

export interface TreatmentPlan {
    id: string;
    patient_id: string;
    items: TreatmentPlanItem[];
    total_amount: number;
    paid_amount?: number;
    created_at: string;
}


// 🛡️ CUMPLIMIENTO COFEPRIS (BITÁCORAS)
export interface SterilizationCycle {
    id: string;
    date: string;
    start_time?: string;
    end_time?: string;
    method: 'Autoclave de Vapor' | 'Calor Seco' | 'Químico';
    pressure_psi?: number;
    temperature_c?: number;
    exposure_time_min: number;
    operator: string;
    operator_id?: string;
    verification_type: 'Física' | 'Química' | 'Biológica' | 'Ambas';
    verification_result: 'Éxito' | 'Fallo';
    biological_indicator_lot?: string;
    biological_indicator_result?: 'Negativo' | 'Positivo';
    is_extemporaneous: boolean; // Seguridad: Si se registró un día distinto al real
    notes?: string;
    created_at: string;
}

export interface ComplianceLog {
    id: string;
    type: 'Limpieza Diaria' | 'Limpieza Exhaustiva' | 'RPBI - Generación' | 'RPBI - Recolección';
    date: string;
    time?: string;
    shift?: 'Mañana' | 'Tarde';
    area?: string; // Para limpieza
    disinfectant_name?: string; // Ej: Amonio Cuaternario, Cloro 0.5%
    concentration?: string;

    // RPBI Fields
    weight?: number; // Para RPBI (kg)
    residue_type?: 'Punzocortantes' | 'Sangre/Líquidos' | 'Patológicos' | 'No anatómicos';
    storage_compliance?: boolean; // Cumple señalización y temperatura
    company?: string; // Para recolección RPBI
    manifest_number?: string; // Para recolección RPBI
    manifest_file_url?: string; // Foto o PDF del folio

    operator: string;
    operator_id?: string;
    is_extemporaneous: boolean;
    notes?: string;
    created_at: string;
}

export interface EquipmentMaintenance {
    id: string;
    equipment_name: string;
    serial_number?: string;
    maintenance_date: string;
    time?: string;
    next_maintenance_date: string;
    type: 'Preventivo' | 'Correctivo';
    provider: string;
    cost?: number;
    notes?: string;
    created_at: string;
}

// 💰 FINANZAS Y CONTABILIDAD
export interface Transaction {
    id: string;
    type: 'Ingreso' | 'Egreso';
    category: 'Tratamiento' | 'Inventario' | 'Renta' | 'Servicios' | 'Nómina' | 'Otro';
    amount: number;
    date: string; // ISO String
    description: string;
    patient_id?: string;     // Para ingresos de consulta
    patient_name?: string;   // Redundancia para rapidez
    related_id?: string;     // Ej: ID de un item de inventario
    payment_method: 'Efectivo' | 'Tarjeta' | 'Transferencia';
    status: 'Completado' | 'Pendiente' | 'Cancelado';
    created_at: string;
}
