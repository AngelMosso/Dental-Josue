import { supabase } from '../lib/supabase';
import type { Patient, OdontogramData, ClinicalRecord, Appointment, InventoryItem, TreatmentPlan, Transaction } from '../types';

export const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};




// ─── Utilidades de Seguridad ──────────────────────────────────────────────────

const generateReadableId = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true });
    const nextNum = (count || 0) + 1;
    return `DP-${year}-${nextNum.toString().padStart(4, '0')}`;
};

const generateDigitalSeal = (data: any) => {
    const salt = 'DENTALCARE_SECURE_2024';
    const payload = JSON.stringify(data) + salt;
    // Hash simple para trazabilidad visual rápida
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        hash = ((hash << 5) - hash) + payload.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36).toUpperCase();
};

export const patientService = {
    async getAll() {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('full_name', { ascending: true });

        if (error) throw error;
        return data as Patient[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Patient;
    },

    async create(patient: Omit<Patient, 'id' | 'created_at'>) {
        const readable_id = await generateReadableId();
        const digital_seal = generateDigitalSeal({ ...patient, readable_id });

        const payloadWithSecurity = {
            ...patient,
            readable_id,
            digital_seal,
        };

        const { treatment_status, address, sex, curp, ...dbPatient } = payloadWithSecurity;

        // Intentamos guardar en DB. Si falla por falta de columnas, reintentamos sin ellas.
        try {
            const { data, error } = await supabase
                .from('patients')
                .insert([patient]) // Intentamos enviar todo primero
                .select()
                .single();

            if (error) {
                if (error.message.includes('column') || error.code === 'PGRST204') {
                    // Fallback: Guardar solo lo básico y el resto local
                    const { data: fallbackData, error: fallbackError } = await supabase
                        .from('patients')
                        .insert([dbPatient]) // dbPatient ya no tiene los campos conflictivos
                        .select()
                        .single();

                    if (fallbackError) throw fallbackError;

                    const newP = fallbackData as Patient;
                    if (treatment_status) localStorage.setItem(`dc_status_${newP.id}`, treatment_status);
                    if (address) localStorage.setItem(`dc_addr_${newP.id}`, address);
                    if (sex) localStorage.setItem(`dc_sex_${newP.id}`, sex);
                    if (curp) localStorage.setItem(`dc_curp_${newP.id}`, curp);

                    return { ...newP, treatment_status, address, sex, curp };
                }
                throw error;
            }
            return data as Patient;
        } catch (err) {
            console.error('Create error, using total local fallback for special fields:', err);
            // Si todo falla, intentamos una última vez con lo más básico
            const { data, error } = await supabase.from('patients').insert([dbPatient]).select().single();
            if (error) throw error;

            const p = data as Patient;
            if (treatment_status) localStorage.setItem(`dc_status_${p.id}`, treatment_status);
            if (address) localStorage.setItem(`dc_addr_${p.id}`, address);
            if (sex) localStorage.setItem(`dc_sex_${p.id}`, sex);
            if (curp) localStorage.setItem(`dc_curp_${p.id}`, curp);
            return { ...p, treatment_status, address, sex, curp };
        }
    },

    async update(id: string, updates: Partial<Patient>) {
        // 1. Recuperar estado actual para ver si falta ID o Sello
        const { data: current } = await supabase.from('patients').select('readable_id, digital_seal').eq('id', id).single();

        let finalUpdates = { ...updates };

        // 2. Autogenerar ID si no existe (backfill proactivo)
        if (!current?.readable_id && !updates.readable_id) {
            finalUpdates.readable_id = await generateReadableId();
        }

        // 3. Regenerar Sello Digital
        if (!updates.digital_seal) {
            finalUpdates.digital_seal = generateDigitalSeal({ ...updates, id, readable_id: finalUpdates.readable_id || current?.readable_id });
        }

        const { treatment_status, address, sex, curp, ...dbUpdates } = finalUpdates;

        try {
            const { data, error } = await supabase
                .from('patients')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.message.includes('column') || error.code === 'PGRST204') {
                    const { data: fData, error: fError } = await supabase
                        .from('patients')
                        .update(dbUpdates)
                        .eq('id', id)
                        .select()
                        .single();

                    if (fError) throw fError;

                    if (treatment_status) localStorage.setItem(`dc_status_${id}`, treatment_status);
                    if (address) localStorage.setItem(`dc_addr_${id}`, address);
                    if (sex) localStorage.setItem(`dc_sex_${id}`, sex);
                    if (curp) localStorage.setItem(`dc_curp_${id}`, curp);

                    const p = fData as Patient;
                    return { ...p, treatment_status, address, sex, curp };
                }
                throw error;
            }
            return data as Patient;
        } catch (err) {
            const { data, error } = await supabase.from('patients').update(dbUpdates).eq('id', id).select().single();
            if (error) throw error;

            if (treatment_status) localStorage.setItem(`dc_status_${id}`, treatment_status);
            if (address) localStorage.setItem(`dc_addr_${id}`, address);
            if (sex) localStorage.setItem(`dc_sex_${id}`, sex);
            if (curp) localStorage.setItem(`dc_curp_${id}`, curp);

            return { ...(data as Patient), treatment_status, address, sex, curp };
        }
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('patients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Gestión de Odontograma
    async getOdontogram(patientId: string) {
        const { data, error } = await supabase
            .from('odontograms')
            .select('teeth_data')
            .eq('patient_id', patientId)
            .maybeSingle();

        if (error) throw error;
        return data?.teeth_data as OdontogramData | undefined;
    },

    async saveOdontogram(patientId: string, teethData: OdontogramData) {
        const { data: existing } = await supabase
            .from('odontograms')
            .select('id')
            .eq('patient_id', patientId)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('odontograms')
                .update({ teeth_data: teethData, updated_at: new Date().toISOString() })
                .eq('patient_id', patientId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('odontograms')
                .insert([{ patient_id: patientId, teeth_data: teethData }]);
            if (error) throw error;
        }
    },

    async saveOdontogramState(patientId: string, state: OdontogramData) {
        return this.saveOdontogram(patientId, state);
    },

    // Gestión de Notas de Evolución (Expediente Clínico)
    async getClinicalRecords(patientId: string) {
        const { data, error } = await supabase
            .from('clinical_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ClinicalRecord[];
    },

    async addClinicalRecord(patientId: string, note: string) {
        const { data, error } = await supabase
            .from('clinical_records')
            .insert([{ patient_id: patientId, note }])
            .select()
            .single();

        if (error) throw error;
        return data as ClinicalRecord;
    },

    async searchAllClinicalRecords() {
        // Obtenemos todos los pacientes
        const { data: patients, error: pError } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (pError) throw pError;

        // Obtenemos todos los historiales
        const { data: records, error: rError } = await supabase
            .from('clinical_records')
            .select('*, patients(*)')
            .order('created_at', { ascending: false });

        if (rError) throw rError;

        // Si un paciente NO tiene historiales, creamos un "pseudo-registro" para que aparezca en la lista
        const patientsWithRecords = new Set(records?.map(r => r.patient_id));
        const standalonePatients = patients
            ?.filter(p => !patientsWithRecords.has(p.id))
            .map(p => ({
                id: `p-${p.id}`,
                patient_id: p.id,
                note: 'Paciente registrado - Sin notas clínicas aún.',
                created_at: p.created_at,
                patients: p,
                isPlaceholder: true
            }));

        return [...(records || []), ...(standalonePatients || [])].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    },

    // 📅 GESTIÓN DE AGENDA (MOCK con LocalStorage)
    async getAppointments() {
        const data = localStorage.getItem('dc_appointments');
        return data ? JSON.parse(data) as Appointment[] : [];
    },

    async saveAppointment(appointment: Appointment) {
        const appointments = await this.getAppointments();
        const index = appointments.findIndex(a => a.id === appointment.id);
        if (index >= 0) {
            appointments[index] = appointment;
        } else {
            appointments.push(appointment);
        }
        localStorage.setItem('dc_appointments', JSON.stringify(appointments));
        return appointment;
    },

    async deleteAppointment(id: string) {
        const appointments = await this.getAppointments();
        const filtered = appointments.filter(a => a.id !== id);
        localStorage.setItem('dc_appointments', JSON.stringify(filtered));
    },

    // 📦 GESTIÓN DE INVENTARIO (MOCK con LocalStorage)
    async getInventory() {
        const data = localStorage.getItem('dc_inventory');
        if (!data) {
            // Datos demo premium
            const demo: InventoryItem[] = [
                { id: '1', name: 'Resina Fluida A2', category: 'Material', stock: 12, min_stock: 5, unit: 'Jeringas', unit_price: 45 },
                { id: '2', name: 'Anestesia Lidocaína', category: 'Anestesia', stock: 2, min_stock: 10, unit: 'Cajas', unit_price: 85 },
                { id: '3', name: 'Campos Desechables', category: 'Desechable', stock: 150, min_stock: 50, unit: 'Piezas', unit_price: 2.5 },
            ];
            localStorage.setItem('dc_inventory', JSON.stringify(demo));
            return demo;
        }
        return JSON.parse(data) as InventoryItem[];
    },

    async saveInventoryItem(item: InventoryItem) {
        const inventory = await this.getInventory();
        const index = inventory.findIndex(i => i.id === item.id);
        if (index >= 0) {
            inventory[index] = item;
        } else {
            inventory.push(item);
        }
        localStorage.setItem('dc_inventory', JSON.stringify(inventory));
        return item;
    },

    async deleteInventoryItem(id: string) {
        const inventory = await this.getInventory();
        const filtered = inventory.filter(i => i.id !== id);
        localStorage.setItem('dc_inventory', JSON.stringify(filtered));
    },

    // 🏥 GESTIÓN DE PLANES DE TRATAMIENTO (MOCK con LocalStorage)
    async getTreatmentPlans(patientId: string) {
        const data = localStorage.getItem(`dc_plans_${patientId}`);
        return data ? JSON.parse(data) as TreatmentPlan[] : [];
    },

    async saveTreatmentPlan(plan: TreatmentPlan) {
        localStorage.setItem(`dc_plans_${plan.patient_id}`, JSON.stringify([plan])); // Por ahora 1 plan por paciente para simplificar
        return plan;
    },

    async updateTreatmentStatus(patientId: string, status: 'Diagnóstico' | 'En Proceso' | 'Completado') {
        try {
            const { error } = await supabase
                .from('patients')
                .update({ treatment_status: status })
                .eq('id', patientId);

            if (error) {
                // Si la columna no existe o hay error de caché, guardamos localmente como fallback
                if (error.code === 'PGRST204' || error.message.includes('column')) {
                    localStorage.setItem(`dc_status_${patientId}`, status);
                    return;
                }
                throw error;
            }

            // Si funciona en DB, limpiamos local para evitar desincronía
            localStorage.removeItem(`dc_status_${patientId}`);
        } catch (e: any) {
            // Fallback total ante cualquier error de red/esquema
            localStorage.setItem(`dc_status_${patientId}`, status);
            console.warn('Usando LocalStorage para estado de tratamiento:', e.message);
        }
    },

    // 📈 ESTADÍSTICAS PARA DASHBOARD
    async getDashboardStats() {
        try {
            // 1. Pacientes (Supabase)
            const { data: patients, count: patientCount, error: pError } = await supabase
                .from('patients')
                .select('*', { count: 'exact' });

            if (pError) throw pError;

            // 2. Citas (LocalStorage)
            const appointments = await this.getAppointments() || [];

            // Obtener fecha YYYY-MM-DD local
            const now = new Date();
            const offset = now.getTimezoneOffset();
            const localDate = new Date(now.getTime() - (offset * 60 * 1000));
            const todayStr = localDate.toISOString().split('T')[0];

            const todayAppointments = appointments.filter(a => a && a.date === todayStr);
            const upcomingAppointments = appointments
                .filter(a => a && a.date >= todayStr && (a.status === 'Pendiente' || !a.status))
                .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
                .slice(0, 5);

            // 3. Inventario (LocalStorage)
            const inventory = await this.getInventory() || [];
            const lowStock = inventory.filter(i => i && i.stock <= i.min_stock);
            const inventoryValue = inventory.reduce((acc, item) => acc + ((item?.stock || 0) * (item?.unit_price || 0)), 0);

            // 4. Tratamientos y Finanzas (Optimizado)
            let diagnostico = 0, enProceso = 0, completado = 0;
            let totalIncome = 0, totalPending = 0, activePlansCount = 0;

            // Recalcular Ingresos Reales desde Transacciones (Fuente de Verdad única)
            const transactions = await this.getTransactions();
            totalIncome = transactions
                .filter(t => t.type === 'Ingreso' && t.status === 'Completado')
                .reduce((acc, t) => acc + t.amount, 0);

            // Procesar solo datos necesarios de pacientes
            (patients || []).forEach(p => {
                const status = p.treatment_status || 'Diagnóstico';
                if (status === 'Diagnóstico') diagnostico++;
                else if (status === 'En Proceso') enProceso++;
                else if (status === 'Completado') completado++;

                const plansData = localStorage.getItem(`dc_plans_${p.id}`);
                if (plansData) {
                    try {
                        const plans = JSON.parse(plansData);
                        plans.forEach((plan: any) => {
                            totalPending += ((plan.total_amount || 0) - (plan.paid_amount || 0));
                            if (plan.items?.some((it: any) => it.status === 'Aprobado')) activePlansCount++;
                        });
                    } catch (e) { }
                }
            });

            // 5. Actividad Reciente Unificada (Clínica + Financiera)
            const [recentRecords, transactionsList] = await Promise.all([
                this.searchAllClinicalRecords().catch(() => []),
                this.getTransactions().catch(() => [])
            ]);

            const clinicalActivity = (recentRecords || []).map(r => ({
                id: r.id,
                type: r.isPlaceholder ? 'Registro' : 'Clínico',
                patient_name: r.patients?.full_name || 'Paciente',
                description: r.note || '',
                date: r.created_at || new Date().toISOString()
            }));

            const financialActivity = (transactionsList || []).map(t => ({
                id: t.id,
                type: 'Financiero',
                patient_name: t.patient_name || 'Clínica',
                description: `${t.type}: ${t.description} ($${t.amount.toLocaleString()})`,
                date: t.created_at || new Date().toISOString()
            }));

            const combinedActivity = [...clinicalActivity, ...financialActivity]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 8); // Aumentamos un poco el rango para ver más

            return {
                totalPatients: patientCount || 0,
                appointmentsToday: todayAppointments.length,
                lowStockItems: lowStock.length,
                upcomingAppointments,
                treatmentStats: {
                    diagnostico, enProceso, completado,
                    especialidades: [], // Simplificado para velocidad
                    financials: {
                        activePlans: activePlansCount,
                        approvedBudgets: totalIncome, // Ahora viene de transacciones reales
                        pendingClozure: totalPending,
                        inventoryValue: inventoryValue
                    }
                },
                recentActivity: combinedActivity
            };
        } catch (error) {
            console.error('Critical failure in getDashboardStats:', error);
            // Retorno de emergencia para que la UI no crashee
            return {
                totalPatients: 0,
                appointmentsToday: 0,
                lowStockItems: 0,
                upcomingAppointments: [],
                treatmentStats: {
                    diagnostico: 0, enProceso: 0, completado: 0,
                    especialidades: [],
                    financials: { activePlans: 0, approvedBudgets: 0, pendingClozure: 0, inventoryValue: 0 }
                },
                recentActivity: []
            };
        }
    },

    async getFinancialDetails() {
        const patients = await this.getAll();
        const debtors: any[] = [];

        if (patients) {
            patients.forEach(p => {
                const plansData = localStorage.getItem(`dc_plans_${p.id}`);
                if (plansData) {
                    const plans = JSON.parse(plansData) as TreatmentPlan[];
                    let patientPending = 0;
                    plans.forEach(plan => {
                        // Un paciente debe si el total del plan es mayor a lo pagado
                        const pendingAmount = plan.total_amount - (plan.paid_amount || 0);
                        if (pendingAmount > 0) {
                            patientPending += pendingAmount;
                        }
                    });

                    if (patientPending > 0) {
                        debtors.push({
                            id: p.id,
                            name: p.full_name,
                            pending: patientPending,
                            lastVisit: p.last_visit || 'Pendiente',
                            status: p.treatment_status || 'En Proceso'
                        });
                    }
                }
            });
        }

        return {
            debtors: debtors.sort((a, b) => b.pending - a.pending),
            totalPending: debtors.reduce((sum, d) => sum + d.pending, 0)
        };
    },

    // 💰 GESTIÓN DE TRANSACCIONES (MOCK con LocalStorage)
    async getTransactions() {
        const data = localStorage.getItem('dc_transactions');
        if (!data) {
            return []; // Iniciar vacío para evitar confusión
        }
        return JSON.parse(data) as Transaction[];
    },

    async recordTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
        const transactions = await this.getTransactions();
        const newTx: Transaction = {
            ...transaction,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        };
        const updated = [newTx, ...transactions];
        localStorage.setItem('dc_transactions', JSON.stringify(updated.slice(0, 100))); // Guardar últimas 100
        return newTx;
    },

    async recordIncomeFromPayment(patient_id: string, patient_name: string, amount: number, description: string, payment_method: Transaction['payment_method'] = 'Efectivo') {
        return this.recordTransaction({
            type: 'Ingreso',
            category: 'Tratamiento',
            amount,
            date: new Date().toISOString(),
            description: description || `Abono de tratamiento: ${patient_name}`,
            patient_id,
            patient_name,
            payment_method,
            status: 'Completado'
        });
    },

    // ⚡ REINICIO MAESTRO (BORRADO TOTAL)
    async hardResetDatabase() {
        // 1. Borrar en Supabase (Orden importa por FKs)
        try {
            // Borrar Notas Clínicas
            const { error: e1 } = await supabase.from('clinical_records').delete().neq('id', '0');
            if (e1) console.warn('Error clearing clinical_records:', e1);

            // Borrar Odontogramas
            const { error: e2 } = await supabase.from('odontograms').delete().neq('id', '0');
            if (e2) console.warn('Error clearing odontograms:', e2);

            // Borrar Pacientes (Cascada si está config, sino manual)
            const { error: e3 } = await supabase.from('patients').delete().neq('id', '0');
            if (e3) console.warn('Error clearing patients:', e3);
        } catch (err) {
            console.error('Database reset failed:', err);
        }

        // 2. Limpiar LocalStorage (Todo lo que empiece por dc_)
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('dc_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        return { success: true };
    },

    // 🛡️ CURACIÓN DE DATOS (Backfill de seguridad)
    async backfillSecurityData() {
        const { data: patients } = await supabase.from('patients').select('*');
        if (!patients) return;

        for (const p of patients) {
            if (!p.readable_id || !p.digital_seal) {
                const readable_id = p.readable_id || await generateReadableId();
                const digital_seal = p.digital_seal || generateDigitalSeal({ ...p, readable_id });
                await supabase.from('patients').update({ readable_id, digital_seal }).eq('id', p.id);
            }
        }
        return { success: true };
    }
};
