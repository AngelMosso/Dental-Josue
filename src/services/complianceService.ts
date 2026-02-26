import { supabase } from '../lib/supabase';
import type { SterilizationCycle, ComplianceLog, EquipmentMaintenance } from '../types';

class ComplianceService {
    // 🔒 SEGURIDAD: Sello de Inalterabilidad
    private generateId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback para contextos no seguros (HTTP / Red Local)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private checkExtemporaneous(recordDate: string): boolean {
        const today = new Date().toISOString().split('T')[0];
        const logDate = recordDate.split('T')[0];
        return today !== logDate;
    }

    // 🧪 ESTERILIZACIÓN
    async getSterilizationCycles() {
        const { data, error } = await supabase
            .from('sterilization_cycles')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching sterilization cycles:', error);
            // Fallback a localStorage para demo/offline
            const local = localStorage.getItem('dc_sterilization');
            return local ? JSON.parse(local) : [];
        }
        return data as SterilizationCycle[];
    }

    async saveSterilizationCycle(cycle: any) {
        const newCycle = {
            ...cycle,
            id: this.generateId(),
            is_extemporaneous: this.checkExtemporaneous(cycle.date || new Date().toISOString()),
            created_at: new Date().toISOString(),

            // Compatibilidad Dual (Esquema Nuevo + Legacy)
            method: cycle.method || 'Autoclave de Vapor',
            pressure_psi: Number(cycle.pressure_psi) || 15,
            temperature_c: Number(cycle.temperature_c) || 121,
            exposure_time_min: Number(cycle.exposure_time_min || cycle.duration) || 20,

            // Legacy mapping
            pressure: `${cycle.pressure_psi || 15} psi`,
            temperature: `${cycle.temperature_c || 121} °C`,
            duration: Number(cycle.exposure_time_min || cycle.duration) || 20
        };

        const { error } = await supabase.from('sterilization_cycles').insert(newCycle);

        const current = await this.getSterilizationCycles().catch(() => []);
        localStorage.setItem('dc_sterilization', JSON.stringify([newCycle, ...current]));

        if (error) {
            console.error('Supabase sterilization save failed:', error);
            throw error;
        }
        return newCycle;
    }

    // 🧹 LIMPIEZA Y RPBI (Compliance Logs)
    async getComplianceLogs(type?: ComplianceLog['type']) {
        let query = supabase.from('compliance_logs').select('*');
        if (type) query = query.eq('type', type);

        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
            const local = localStorage.getItem('dc_compliance_logs');
            const parsed = local ? JSON.parse(local) : [];
            return type ? (parsed as ComplianceLog[]).filter(l => l.type === type) : parsed;
        }
        return data as ComplianceLog[];
    }

    async saveComplianceLog(log: any) {
        const newLog = {
            ...log,
            id: this.generateId(),
            is_extemporaneous: this.checkExtemporaneous(log.date || new Date().toISOString()),
            created_at: new Date().toISOString(),
            weight: log.weight ? Number(log.weight) : undefined
        };

        const { error } = await supabase.from('compliance_logs').insert(newLog);

        const current = await this.getComplianceLogs().catch(() => []);
        localStorage.setItem('dc_compliance_logs', JSON.stringify([newLog, ...current]));

        if (error) {
            console.error('Supabase compliance save failed:', error);
            throw error;
        }
        return newLog;
    }

    // ⚙️ MANTENIMIENTO
    async getMaintenanceRecords() {
        const { data, error } = await supabase
            .from('equipment_maintenance')
            .select('*')
            .order('maintenance_date', { ascending: false });

        if (error) {
            const local = localStorage.getItem('dc_maintenance');
            return local ? JSON.parse(local) : [];
        }
        return data as EquipmentMaintenance[];
    }

    async saveMaintenanceRecord(record: Omit<EquipmentMaintenance, 'id' | 'created_at'>) {
        const newRecord = {
            ...record,
            id: this.generateId(),
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('equipment_maintenance').insert(newRecord);

        const current = await this.getMaintenanceRecords().catch(() => []);
        localStorage.setItem('dc_maintenance', JSON.stringify([newRecord, ...current]));

        if (error) {
            console.error('Supabase maintenance save failed:', error);
            throw error;
        }
        return newRecord;
    }
}

export const complianceService = new ComplianceService();
