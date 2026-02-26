// Motor de Consentimiento Informado — DentalCare Pro
// Cumple con NOM-004-SSA3-2012 (México)
// FORMATO ORIGINAL RESTAURADO (HTML + Browser Print)

import type { Patient, TreatmentPlan } from '../types';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ConsentDocumentData {
    patient: Patient;
    procedures: string[];
    clinicName?: string;
    doctorName?: string;
    date?: string;
}

export interface GeneratedConsent {
    htmlContent: string;
    hash: string;
    generatedAt: string;
}

// ─── Cláusulas por Procedimiento ─────────────────────────────────────────────

const PROCEDURE_CLAUSES: Record<string, { title: string; risks: string[]; postop: string[] }> = {
    'Implante': {
        title: 'Implante Oseointegrado',
        risks: [
            'Infección local o generalizada que puede requerir antibioterapia o retiro del implante.',
            'Falla en la oseointegración (<5% en pacientes sanos) que requiere retiro y nuevo intento.',
            'Daño a estructuras anatómicas adyacentes (nervio alveolar inferior, seno maxilar).',
            'Pérdida de sensibilidad temporal o permanente en la zona tratada.',
            'Dehiscencia de la herida quirúrgica.',
            'Rechazo del implante en pacientes con condiciones sistémicas no controladas.',
        ],
        postop: [
            'Evitar masticar en la zona durante 6-8 semanas.',
            'No fumar durante al menos 3 meses post-cirugía.',
            'Aplicar hielo cada 20 min las primeras 24h.',
            'Tomar antibiótico y analgésico según prescripción.',
            'Cita de revisión a los 7 días.',
        ],
    },
    'Extracción': {
        title: 'Extracción Dental',
        risks: [
            'Alveolitis (inflamación post-extracción) que requiere curetaje y curaciones.',
            'Hemorragia post-operatoria, generalmente controlable con compresión.',
            'Infección del alveolo que puede requerir antibioterapia.',
            'Fractura de la raíz o del hueso alveolar durante el procedimiento.',
            'Parestesia temporal o permanente del nervio dental inferior.',
            'Comunicación oral sinusal en extracciones posteriores superiores.',
        ],
        postop: [
            'Mantener la gasa de presión mordida durante 30-45 minutos.',
            'No enjuagarse ni escupir con fuerza las primeras 24h.',
            'Dieta blanda y fría el día de la extracción.',
            'Evitar tabaco y alcohol 72h post-extracción.',
            'Consultar si hay sangrado que no cede o dolor intenso.',
        ],
    },
    'Endodoncia': {
        title: 'Tratamiento de Conductos (Endodoncia)',
        risks: [
            'Fractura de instrumento dentro del conducto (<2%), generalmente sin consecuencias.',
            'Perforación radicular o del suelo cameral.',
            'Sobre-instrumentación o sobre-obturación más allá del ápice.',
            'Fractura vertical de la raíz (indicación de extracción).',
            'Necesidad de retratamiento o intervención quirúrgica (apicectomía).',
            'Dolor y sensibilidad post-operatoria de 2-5 días de duración normal.',
        ],
        postop: [
            'Evitar masticar fuerte en la pieza tratada hasta colocar la corona.',
            'Tomar analgésico pautado las primeras 48h.',
            'La pieza tratada requiere corona u onlay como restauración definitiva.',
            'Consulta de revisión a los 30 días con radiografía.',
        ],
    },
    'Ortodoncia': {
        title: 'Tratamiento de Ortodoncia',
        risks: [
            'Reabsorción radicular de mayor o menor grado durante el tratamiento activo.',
            'Recidiva si no se usan los retenedores indefinidamente.',
            'Descalcificación del esmalte si la higiene es deficiente.',
            'Dolor y molestias iniciales y tras cada ajuste.',
            'Posible extracción de premolares para ganar espacio.',
            'Duración estimada sujeta a cambios según la respuesta biológica individual.',
        ],
        postop: [
            'Uso obligatorio de retenedores nocturnos de por vida tras finalizar.',
            'Higiene oral rigurosa: cepillo interdental, seda dental.',
            'Consultas mensuales de ajuste y seguimiento.',
        ],
    },
    'Blanqueamiento': {
        title: 'Blanqueamiento Dental',
        risks: [
            'Sensibilidad dental transitoria durante y hasta 72h post-tratamiento.',
            'Irritación gingival si el gel contacta los tejidos blandos.',
            'Resultado no predecible en restauraciones (coronas, carillas) que no responden.',
            'Resultado temporal: el diente puede oscurecerse con el tiempo.',
        ],
        postop: [
            'Evitar alimentos y bebidas pigmentadas 48h post-tratamiento.',
            'Usar pasta dentífrica para dientes sensibles 1 semana.',
        ],
    },
    'Cirugía Periodontal': {
        title: 'Cirugía Periodontal',
        risks: [
            'Recesión gingival post-quirúrgica con posible exposición radicular.',
            'Sensibilidad dental aumentada post-cirugía.',
            'Infección de la herida quirúrgica que puede requerir antibiótico.',
            'Sangrado post-operatorio.',
            'Resultado estético variable según el biotipo gingival.',
        ],
        postop: [
            'Enjuague con clorhexidina 0.12% durante 2 semanas.',
            'No cepillar directamente la herida quirúrgica 2-3 semanas.',
            'Dieta blanda y evitar temperatura extrema.',
            'Cita de sutura a los 7-10 días.',
        ],
    },
};

// Detectar procedimiento desde texto libre
const detectProcedure = (description: string): string | null => {
    const desc = description.toLowerCase();
    if (desc.includes('implante')) return 'Implante';
    if (desc.includes('extracción') || desc.includes('exodoncia')) return 'Extracción';
    if (desc.includes('endodoncia') || desc.includes('conducto')) return 'Endodoncia';
    if (desc.includes('ortodoncia') || desc.includes('brackets') || desc.includes('alineadores')) return 'Ortodoncia';
    if (desc.includes('blanqueamiento')) return 'Blanqueamiento';
    if (desc.includes('periodon') || desc.includes('encía') || desc.includes('curetaje')) return 'Cirugía Periodontal';
    return null;
};

// ─── Hashing Híbrido (Soporta HTTP/WiFi y Localhost/HTTPS) ──────────────────

async function computeSHA256(text: string): Promise<string> {
    if (!window.crypto?.subtle) {
        // Fallback para red local no segura (IP WiFi)
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'WIFI-' + Math.abs(hash).toString(16).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    try {
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        return 'ERR-' + Date.now().toString(36);
    }
}

// ─── Generación del HTML del Consentimiento ───────────────────────────────────

function buildConsentHTML(data: ConsentDocumentData, hash: string, date: string): string {
    const { patient, procedures, doctorName: optionsDoctor = 'Doctor' } = data;
    const history = patient.deep_history;
    const doctorName = history?.doctor_name || optionsDoctor;
    const age = patient.age || (patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : '—');

    const detectedProc = procedures.map(p => detectProcedure(p)).filter((p): p is string => p !== null);
    const uniqueProcs = [...new Set(detectedProc)];

    // --- Mapeo de Secciones Médicas (Solo Deep History) ---

    const allergyList = history?.systemic?.allergies?.map(a => `${a.substance} (${a.severity})`) || [];
    const conditionList = history?.systemic?.conditions?.map(c => `${c.label} (${c.code || 'S/C'})`) || [];
    const medicalAlerts = patient.medical_alerts || [];

    const allAllergies = [...new Set([...allergyList, ...medicalAlerts])].join(', ') || 'Ninguna conocida';
    const medications = history?.systemic?.medications?.map(m => `${m.name}${m.dose ? ` ${m.dose}` : ''}`).join(', ') || 'Ninguno';
    const conditions = conditionList.join(', ') || 'Sin patologías reportadas';

    // Antecedentes Heredofamiliares (Deep)
    const hereditaryItems = [
        { label: 'Diabetes', value: history?.hereditary?.diabetes || false },
        { label: 'Hipertensión', value: history?.hereditary?.hypertension || false },
        { label: 'Cáncer', value: history?.hereditary?.cancer || false },
        { label: 'Cardiopatías', value: history?.hereditary?.heart_disease || false },
        { label: 'Coagulación', value: history?.hereditary?.coagulation_disorders || false },
    ];

    // Interrogatorio Estomatológico (Deep)
    const stomatologicalItems = [
        { label: 'Sangrado de encías', value: history?.stomatological?.bleeding_gums || false },
        { label: 'Sensibilidad térmica', value: history?.stomatological?.temperature_sensitivity || false },
        { label: 'Chasquidos ATM', value: history?.stomatological?.jaw_popping || false },
        { label: 'Bruxismo', value: history?.stomatological?.bruxism || false },
        { label: 'Ortodoncia previa', value: history?.stomatological?.previous_orthodontics || false },
        { label: 'Extracciones previas', value: history?.stomatological?.previous_extractions || false },
    ];

    // Hábitos e Higiene (Deep)
    const habitItems = [
        { label: 'Tabaquismo', value: history?.habits?.smoker || false },
        { label: 'Alcoholismo', value: history?.habits?.alcohol || false },
        { label: 'Uso de Hilo', value: history?.habits?.uses_floss || false },
        { label: 'Enjuague Bucal', value: history?.habits?.uses_mouthwash || false },
    ];

    const renderChecklist = (items: { label: string; value: boolean }[]) => {
        return items.map(item => `
            <div class="check-item">
                <span class="box ${item.value ? 'checked' : ''}">${item.value ? 'X' : ''}</span>
                <span class="label">${item.label}</span>
            </div>
        `).join('');
    };

    const procedureBlocks = uniqueProcs.map(procKey => {
        const clause = PROCEDURE_CLAUSES[procKey];
        return `
        <div class="section">
            <h3 style="border-left-color: #ef4444;">Procedimiento: ${clause.title}</h3>
            <h4>Riesgos y Complicaciones</h4>
            <ul>${clause.risks.map(r => `<li>${r}</li>`).join('')}</ul>
            <h4>Indicaciones Post-Operatorias</h4>
            <ul>${clause.postop.map(p => `<li>${p}</li>`).join('')}</ul>
        </div>`;
    }).join('');

    const listProcs = procedures.length > 0 ? `
        <div class="section">
            <h3 style="background: #f8fafc; padding: 10px; border-radius: 8px;">Plan de Tratamiento Consentido</h3>
            <ul style="margin-top: 10px;">${procedures.map(p => `<li style="font-weight: 700; color: #1e1b4b;">${p}</li>`).join('')}</ul>
        </div>` : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #111; line-height: 1.4; padding: 40px; }
  h1 { font-size: 16pt; text-align: center; margin-bottom: 5px; font-weight: 900; color: #1e1b4b; }
  h2 { font-size: 10pt; text-align: center; color: #6366f1; margin-bottom: 25px; font-weight: 700; letter-spacing: 0.1em; }
  h3 { font-size: 11pt; font-weight: 900; margin: 15px 0 8px; border-left: 4px solid #4338ca; padding-left: 10px; color: #1e1b4b; text-transform: uppercase; }
  h4 { font-size: 9pt; font-weight: 800; margin: 10px 0 5px; color: #4338ca; }
  .header { text-align: center; margin-bottom: 30px; }
  .section { margin: 15px 0; page-break-inside: avoid; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 10px; }
  .patient-grid .field label { font-weight: 800; display: block; font-size: 7pt; color: #64748b; text-transform: uppercase; margin-bottom: 1px; }
  .patient-grid .field { font-weight: 700; font-size: 10pt; }
  
  .medical-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; }
  .medical-card { background: #fff; border: 1px solid #f1f5f9; padding: 12px; border-radius: 10px; }
  .medical-card h4 { margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; font-size: 8pt; }
  
  .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
  .check-item { display: flex; items-center; gap: 6px; font-size: 8.5pt; font-weight: 600; color: #334155; }
  .box { width: 14px; height: 14px; border: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 900; border-radius: 3px; background: #fff; }
  .box.checked { background: #4338ca; border-color: #4338ca; color: #fff; }
  
  ul { padding-left: 20px; margin: 5px 0; list-style-type: square; }
  li { margin-bottom: 3px; font-size: 9pt; }
  .alert-box { background: #fee2e2; border: 1.5px solid #ef4444; color: #991b1b; padding: 10px 15px; margin: 15px 0; border-radius: 10px; font-size: 9pt; font-weight: 700; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin: 50px 0 20px; }
  .sig-line { border-top: 2px solid #e2e8f0; padding-top: 8px; text-align: center; font-size: 8.5pt; font-weight: 700; color: #475569; }
  .footer { margin-top: 40px; padding: 15px; background: #f8fafc; border-radius: 8px; font-size: 7.5pt; color: #94a3b8; font-family: monospace; word-break: break-all; text-align: center; line-height: 1.2; }
  
  @media print { 
    body { padding: 0; } 
    .footer { position: fixed; bottom: 0; width: 100%; left: 0; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>CONSENTIMIENTO INFORMADO</h1>
    <h2>NOM-004-SSA3-2012 · EXPEDIENTE CLÍNICO</h2>
  </div>

  <div class="section">
    <h3>I. Datos Generales y Filiación</h3>
    <div class="patient-grid">
      <div class="field"><label>Nombre del Paciente</label>${patient.full_name}</div>
      <div class="field"><label>Edad</label>${age} años</div>
      <div class="field"><label>Género</label>${patient.sex || '—'}</div>
      <div class="field"><label>RFC / ID</label>${patient.rfc || '—'}</div>
      <div class="field"><label>CURP</label>${patient.curp || '—'}</div>
      <div class="field"><label>Teléfono</label>${patient.phone || '—'}</div>
      <div class="field"><label>Sangre</label>${history?.systemic?.blood_type || '—'}</div>
      <div class="field" style="grid-column: span 3;"><label>Ocupación / Motivo</label>${patient.occupation || '—'} - ${patient.consultation_reason || '—'}</div>
    </div>
  </div>

  <div class="section">
    <h3>II. Antecedentes Médicos Relevantes</h3>
    
    <div class="medical-grid">
        <div class="medical-card">
            <h4>Antecedentes Heredofamiliares</h4>
            <div class="check-grid">
                ${renderChecklist(hereditaryItems)}
            </div>
            ${history?.hereditary?.notes ? `<p style="font-size: 8pt; margin-top: 5px; color: #64748b;"><strong>Notas:</strong> ${history.hereditary.notes}</p>` : ''}
        </div>
        
        <div class="medical-card">
            <h4>Hábitos e Higiene</h4>
            <div class="check-grid">
                ${renderChecklist(habitItems)}
            </div>
            <p style="font-size: 8pt; margin-top: 5px; color: #64748b;"><strong>Frec. Lavado:</strong> ${history?.habits?.brushing_frequency || '—'}</p>
        </div>
    </div>

    <div class="medical-card" style="margin-top: 10px;">
        <h4>Interrogatorio Estomatológico</h4>
        <div class="check-grid" style="grid-template-columns: 1fr 1fr 1fr;">
            ${renderChecklist(stomatologicalItems)}
        </div>
    </div>

    <div class="patient-grid" style="margin-top: 10px; background: #fff;">
      <div class="field" style="grid-column: span 3;"><label>Condiciones Sistémicas / Diagnósticos</label>${conditions}</div>
      <div class="field" style="grid-column: span 3;"><label>Cirugías y Hospitalizaciones</label>${history?.systemic?.surgeries || 'Ninguna'} / ${history?.systemic?.hospitalizations || 'Ninguna'}</div>
      <div class="field" style="grid-column: span 3;"><label>Medicamentos Actuales</label>${medications}</div>
    </div>
  </div>

  ${(patient.medical_alerts?.length || history?.systemic?.allergies?.length) ? `
  <div class="alert-box">
    <strong>⚠ ATENCIÓN MÉDICA CRÍTICA:</strong> ${allAllergies}
  </div>` : ''}

  <div class="section" style="border-top: 2px solid #f1f5f9; padding-top: 20px;">
    <h3>III. Consentimiento para el Tratamiento</h3>
    <p style="font-size: 9pt; text-align: justify; color: #334155;">Por medio de la presente, autorizo al personal de <strong>DENTALCARE PRO</strong> y al profesional tratante <strong>DR. ${doctorName}</strong>, a realizar los procedimientos odontológicos detallados en mi plan de tratamiento. Comprendo que la odontología no es una ciencia exacta y que no se pueden garantizar resultados específicos, pero que se utilizarán todos los medios técnicos y científicos al alcance para el éxito del mismo.</p>
  </div>

  ${listProcs}
  ${procedureBlocks}

  <div class="signature-grid">
    <div>
      <div class="sig-line" style="height: 60px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px;">
        <span style="font-family: 'Dancing Script', cursive; font-size: 14pt; color: #1e1b4b; opacity: 0.8;">${patient.full_name}</span>
      </div>
      <div class="sig-line">${patient.full_name.toUpperCase()}<br/>FIRMA DEL PACIENTE O TUTOR</div>
    </div>
    <div>
      <div class="sig-line" style="height: 60px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px;">
         <span style="font-family: 'Dancing Script', cursive; font-size: 14pt; color: #1e1b4b; opacity: 0.8;">Dr. ${doctorName}</span>
      </div>
      <div class="sig-line">DR. ${doctorName.toUpperCase()}<br/>FIRMA DEL PROFESIONAL TRATANTE</div>
    </div>
  </div>

  <div class="footer">
    ESTE DOCUMENTO FORMA PARTE INTEGRANTE DEL EXPEDIENTE CLÍNICO SEGÚN NOM-004-SSA3-2012.<br/>
    <strong>ID PACIENTE: ${patient.readable_id || 'SIN ID'}</strong> · <strong>SELLO DIGITAL: ${patient.digital_seal || 'SIN SELLO'}</strong><br/>
    TRAZABILIDAD: ${hash.substring(0, 16).toUpperCase()} · AUTORIZADO POR: ${doctorName.toUpperCase()}<br/>
    REGISTRO GENERADO EL ${date} POR EL SISTEMA CENTRALIZADO DENTALCARE PRO.
  </div>
</body>
</html>`;
}

// ─── API Pública ──────────────────────────────────────────────────────────────

export const consentService = {
    async generateConsent(patient: Patient, treatmentPlans: TreatmentPlan[], options: { clinicName?: string; doctorName?: string } = {}): Promise<GeneratedConsent> {
        const procedures = treatmentPlans.flatMap(p => p.items).filter(i => i.status !== 'Cancelado').map(i => i.description);
        const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const hash = await computeSHA256(JSON.stringify({ patient: patient.id, procedures, date }));
        const htmlContent = buildConsentHTML({ patient, procedures, ...options, date }, hash, date);
        return { htmlContent, hash, generatedAt: new Date().toISOString() };
    },

    printConsent(htmlContent: string): void {
        const win = window.open('', '_blank', 'width=1000,height=800');
        if (!win) { alert('Habilita las ventanas emergentes.'); return; }
        win.document.write(htmlContent);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    },

    async createAuditEntry(user: string, action: string, data: object): Promise<import('../types').AuditEntry> {
        const hash = await computeSHA256(JSON.stringify({ user, action, data, ts: Date.now() }));
        return { user, action, timestamp: new Date().toISOString(), hash };
    },
};
