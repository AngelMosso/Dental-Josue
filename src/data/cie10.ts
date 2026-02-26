// Catálogo CIE-10 — Condiciones relevantes para Odontología Clínica
// Fuente: NOM-004-SSA3-2012 / OMS CIE-10 subconjunto dental

import type { MedicalFlag } from '../types';

export const CIE10_CATALOG: MedicalFlag[] = [
    // ─── CRÍTICAS (siempre muestran banner rojo) ───────────────────────────
    { code: 'D66', label: 'Hemofilia A', severity: 'critical' },
    { code: 'D67', label: 'Hemofilia B', severity: 'critical' },
    { code: 'D69.3', label: 'Púrpura trombocitopénica', severity: 'critical' },
    { code: 'B20', label: 'VIH / SIDA', severity: 'critical' },
    { code: 'B18.1', label: 'Hepatitis B crónica', severity: 'critical' },
    { code: 'B18.2', label: 'Hepatitis C crónica', severity: 'critical' },
    { code: 'T36.0', label: 'Alergia a Penicilina', severity: 'critical' },
    { code: 'T39.1', label: 'Alergia a AINEs / Aspirina', severity: 'critical' },
    { code: 'T41', label: 'Alergia a Anestésicos Locales', severity: 'critical' },
    { code: 'T78.1', label: 'Alergia al Látex', severity: 'critical' },
    { code: 'Z79.01', 'label': 'Anticoagulantes (Warfarina)', severity: 'critical' },
    { code: 'Z79.02', 'label': 'Anticoagulantes (Nuevos: Rivaroxabán)', severity: 'critical' },
    { code: 'I48', label: 'Fibrilación auricular', severity: 'critical' },
    { code: 'I25', label: 'Cardiopatía isquémica crónica', severity: 'critical' },
    { code: 'M32', label: 'Lupus eritematoso sistémico', severity: 'critical' },

    // ─── PRECAUCIÓN (banner ámbar) ─────────────────────────────────────────
    { code: 'I10', label: 'Hipertensión esencial', severity: 'warning' },
    { code: 'E11', label: 'Diabetes mellitus tipo 2', severity: 'warning' },
    { code: 'E10', label: 'Diabetes mellitus tipo 1', severity: 'warning' },
    { code: 'J45', label: 'Asma', severity: 'warning' },
    { code: 'G40', label: 'Epilepsia', severity: 'warning' },
    { code: 'G20', label: 'Enfermedad de Parkinson', severity: 'warning' },
    { code: 'F32', label: 'Trastorno depresivo mayor', severity: 'warning' },
    { code: 'F41', label: 'Trastorno de ansiedad', severity: 'warning' },
    { code: 'N18', label: 'Enfermedad renal crónica', severity: 'warning' },
    { code: 'K74', label: 'Cirrosis hepática', severity: 'warning' },
    { code: 'Z34', label: 'Embarazo', severity: 'warning' },
    { code: 'M81', label: 'Osteoporosis', severity: 'warning' },
    { code: 'K21', label: 'Reflujo gastroesofágico (ERGE)', severity: 'warning' },
    { code: 'L27.0', label: 'Alergia a medicamentos — moderada', severity: 'warning' },
    { code: 'Z96.6', label: 'Prótesis articular (cadera/rodilla)', severity: 'warning' },
    { code: 'Z95', label: 'Implante cardíaco / Marcapaso', severity: 'warning' },
    { code: 'C00-14', 'label': 'Cáncer de cavidad oral (antecedente)', severity: 'warning' },

    // ─── INFORMATIVAS ──────────────────────────────────────────────────────
    { code: 'E78', label: 'Dislipidemia / Colesterol elevado', severity: 'info' },
    { code: 'M79.3', label: 'Mialgia / Fibromialgia', severity: 'info' },
    { code: 'H93.1', label: 'Tinnitus', severity: 'info' },
    { code: 'G43', label: 'Migraña', severity: 'info' },
    { code: 'K29', label: 'Gastritis crónica', severity: 'info' },
    { code: 'E06', label: 'Tiroiditis / Hipotiroidismo', severity: 'info' },
    { code: 'J30', label: 'Rinitis alérgica', severity: 'info' },
    { code: 'D50', label: 'Anemia ferropénica', severity: 'info' },
    { code: 'B35', label: 'Candidiasis oral (antecedente)', severity: 'info' },
    { code: 'Z87.3', label: 'Antecedente de radioterapia', severity: 'info' },
    { code: 'Z87.1', label: 'Antecedente de bisfosfonatos', severity: 'info' },
];

export const COMMON_MEDICATIONS: string[] = [
    'Metformina', 'Insulina', 'Glibenclamida', 'Glipizida',
    'Losartán', 'Enalapril', 'Captopril', 'Amlodipino', 'Atenolol', 'Metoprolol', 'Verapamilo',
    'Warfarina', 'Clopidogrel', 'Ácido Acetilsalicílico (ASA)', 'Apixabán', 'Rivaroxabán',
    'Omeprazol', 'Pantoprazol', 'Ranitidina',
    'Atorvastatina', 'Simvastatina', 'Rosuvastatina',
    'Levotiroxina', 'Metimazol',
    'Prednisona', 'Dexametasona', 'Betametasona',
    'Fluoxetina', 'Sertralina', 'Escitalopram', 'Clonazepam', 'Alprazolam', 'Lorazepam',
    'Carbamazepina', 'Ácido Valproico', 'Fenitoína', 'Lamotrigina',
    'Ibuprofeno', 'Naproxeno', 'Diclofenaco', 'Paracetamol',
    'Amoxicilina', 'Clindamicina', 'Azitromicina', 'Eritromicina',
    'Alendronato', 'Risedronato',
    'Vitamina D', 'Calcio', 'Hierro', 'Ácido Fólico',
];

export const COMMON_ALLERGIES: string[] = [
    'Penicilina', 'Amoxicilina', 'Ampicilina',
    'AINEs', 'Ibuprofeno', 'Naproxeno', 'Aspirina (ASA)',
    'Anestésicos locales (Lidocaína)', 'Anestésicos locales (Articaína)',
    'Latex', 'Sulfamidas', 'Eritromicina', 'Clindamicina',
    'Yodo', 'Contraste radiológico',
    'Nueces', 'Mariscos', 'Gluten',
];
