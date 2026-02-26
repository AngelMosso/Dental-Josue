import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SterilizationCycle, ComplianceLog, EquipmentMaintenance } from '../types';

export const generateCompliancePDF = (
    clinicName: string,
    sterilization: SterilizationCycle[] = [],
    cleaning: ComplianceLog[] = [],
    rpbi: ComplianceLog[] = [],
    maintenance: EquipmentMaintenance[] = []
) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        const formatTime = (time?: string, createdAt?: string) => {
            if (time && time !== '00:00') return time;
            if (createdAt) {
                const date = new Date(createdAt);
                return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
            }
            return '00:00';
        };

        // --- Header ---
        doc.setFillColor(15, 23, 42); // Slate 900
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("REPORTE DE AUDITORÍA COFEPRIS", 20, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Clínica: ${clinicName.toUpperCase()}`, 20, 30);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-MX')}`, pageWidth - 70, 30);

        let currentY = 50;

        // --- Sección 1: Esterilización (NOM-013-SSA2-2015) ---
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("1. BITÁCORA DE ESTERILIZACIÓN (NOM-013)", 20, currentY);
        currentY += 10;

        autoTable(doc, {
            startY: currentY,
            head: [['Fecha/Hora', 'Método', 'Temp (°C)', 'Presión (PSI)', 'Tiempo', 'Bio-Indicador', 'Estatus']],
            body: sterilization.map(s => [
                `${s.date} ${formatTime(s.start_time, s.created_at)}`,
                s.method || '-',
                s.temperature_c || '-',
                s.pressure_psi || '-',
                s.exposure_time_min ? `${s.exposure_time_min} min` : '-',
                s.biological_indicator_result || 'Pendiente',
                s.is_extemporaneous ? 'Extemporáneo' : 'Certificado'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
            styles: { fontSize: 8 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 20;

        // --- Sección 2: Limpieza y Desinfección ---
        if (cleaning && cleaning.length > 0) {
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.text("2. BITÁCORA DE LIMPIEZA Y DESINFECCIÓN", 20, currentY);
            currentY += 10;

            autoTable(doc, {
                startY: currentY,
                head: [['Fecha/Hora', 'Turno', 'Desinfectante', 'Área / Detalle', 'Operador']],
                body: cleaning.map(c => [
                    `${c.date} ${formatTime(c.time, c.created_at)}`,
                    c.shift || '-',
                    c.disinfectant_name || '-',
                    c.area || '-',
                    c.operator || '-'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [5, 150, 105] }, // Emerald 600
                styles: { fontSize: 8 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 20;
        }

        // --- Sección 3: Manejo de RPBI ---
        if (rpbi && rpbi.length > 0) {
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.text("3. CONTROL DE RESIDUOS PELIGROSOS (RPBI)", 20, currentY);
            currentY += 10;

            autoTable(doc, {
                startY: currentY,
                head: [['Fecha/Hora', 'Tipo de Residuo', 'Peso (kg)', 'Almacenamiento', 'Manifiesto']],
                body: rpbi.map(r => [
                    `${r.date} ${formatTime(r.time, r.created_at)}`,
                    r.residue_type || '-',
                    r.weight || '-',
                    r.storage_compliance ? 'Conforme' : 'Pendiente',
                    r.manifest_file_url ? 'Link Adjunto' : 'Pendiente'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] }, // Red 600
                styles: { fontSize: 8 }
            });
            currentY = (doc as any).lastAutoTable.finalY + 20;
        }

        // --- Sección 4: Mantenimiento de Equipos ---
        if (maintenance && maintenance.length > 0) {
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            doc.setFontSize(14);
            doc.text("4. MANTENIMIENTO DE EQUIPOS MÉDICOS", 20, currentY);
            currentY += 10;

            autoTable(doc, {
                startY: currentY,
                head: [['Equipo', 'Fecha/Hora Mto.', 'Próximo Mto.', 'Tipo', 'Proveedor']],
                body: maintenance.map(m => [
                    m.equipment_name || '-',
                    `${m.maintenance_date} ${formatTime(m.time, m.created_at)}`,
                    m.next_maintenance_date || '-',
                    m.type || '-',
                    m.provider || '-'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [202, 138, 4] }, // Yellow 600
                styles: { fontSize: 8 }
            });
        }

        // --- Footer ---
        const totalPages = (doc as any).internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Documento generado por DentalCare Pro - Certificado bajo NOM-013-SSA2-2015 | Página ${i} de ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        doc.save(`Auditoria_COFEPRIS_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("PDF Generation Error Detailed:", error);
        throw error;
    }
};
