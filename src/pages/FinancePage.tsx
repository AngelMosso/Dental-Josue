import { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown,
    Package, Users, ArrowUpRight, ArrowDownRight,
    Download, Activity, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { patientService } from '../services/patientService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Transaction } from '../types';

const FinanceCard = ({ title, amount, trend, icon: Icon, gradient, shadow, onClick }: any) => (
    <div
        onClick={onClick}
        className={`bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group hover-lift relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-indigo-100' : ''}`}
    >
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-[1.2rem] ${gradient} ${shadow} text-white transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend > 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                    {Math.abs(trend)}%
                </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-gray-400 font-bold text-sm">$</span>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
                    {amount.toLocaleString()}
                </h3>
            </div>
        </div>

        {/* Decorative Background Element */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full ${gradient} opacity-[0.03] group-hover:scale-150 transition-transform duration-700`} />
    </div>
);

const FinancePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [stats, setStats] = useState<any>(null);
    const [debtors, setDebtors] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const currentView = searchParams.get('view') || 'overview';

    // Formulario de Transacción
    const [formData, setFormData] = useState({
        type: 'Egreso' as 'Ingreso' | 'Egreso',
        category: 'Otro' as Transaction['category'],
        amount: 0,
        description: '',
        payment_method: 'Efectivo' as Transaction['payment_method']
    });

    useEffect(() => {
        loadFinanceData();
    }, []);

    const loadFinanceData = async () => {
        try {
            setIsLoading(true);
            const [statsData, financialDetails, txs] = await Promise.all([
                patientService.getDashboardStats(),
                patientService.getFinancialDetails(),
                patientService.getTransactions()
            ]);
            setStats(statsData);
            setDebtors(financialDetails.debtors);
            setTransactions(txs);
        } catch (error) {
            console.error('Error cargando finanzas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        await patientService.recordTransaction({
            ...formData,
            status: 'Completado',
            date: new Date().toISOString()
        });
        await loadFinanceData();
        setIsModalOpen(false);
        setFormData({
            type: 'Egreso',
            category: 'Otro',
            amount: 0,
            description: '',
            payment_method: 'Efectivo'
        });
    };

    if (isLoading || !stats) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-30">
                <Activity className="animate-spin text-indigo-600" size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Calculando Balances...</p>
            </div>
        );
    }

    // Cálculos dinámicos
    const totalIncome = transactions
        .filter(t => t.type === 'Ingreso' && t.status === 'Completado')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'Egreso' && t.status === 'Completado')
        .reduce((acc, t) => acc + t.amount, 0);

    const netMargin = totalIncome - totalExpenses;
    const estIVA = totalIncome * 0.16;
    const estISR = netMargin > 0 ? netMargin * 0.30 : 0;

    return (
        <div className="space-y-8 pb-20 px-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-100">
                            <DollarSign className="text-emerald-400" size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Centro de Control Financiero</h2>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest px-1">Transparencia, Rentabilidad y Fiscalidad</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                    >
                        <Plus size={16} /> Registrar Movimiento
                    </button>
                    <button className="hidden md:flex items-center gap-2 bg-white border border-gray-100 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all shadow-sm">
                        <Download size={14} /> Reporte PDF
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FinanceCard
                    title="Ingresos Reales"
                    amount={totalIncome}
                    trend={12}
                    icon={DollarSign}
                    gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                    shadow="shadow-indigo-200/50"
                />
                <FinanceCard
                    title="Gastos Totales"
                    amount={totalExpenses}
                    trend={-5}
                    icon={TrendingDown}
                    gradient="bg-gradient-to-br from-rose-500 to-red-600"
                    shadow="shadow-rose-200/50"
                />
                <FinanceCard
                    title="Margen Operativo"
                    amount={netMargin}
                    trend={15}
                    icon={TrendingUp}
                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                    shadow="shadow-emerald-200/50"
                />
                <FinanceCard
                    title="Adeudos Pendientes"
                    amount={stats.treatmentStats.financials.pendingClozure}
                    trend={8}
                    icon={Users}
                    gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                    shadow="shadow-amber-200/50"
                    onClick={() => navigate('/finanzas?view=debtors')}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Tabla de Movimientos */}
                <div className="xl:col-span-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[3rem] p-8 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-800">
                                {currentView === 'debtors' ? 'Listado de Deudores' : 'Flujo de Caja Reciente'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizado con Almacén y Agenda</p>
                        </div>
                        {currentView === 'debtors' && (
                            <button onClick={() => navigate('/finanzas')} className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-4 py-2 rounded-xl">
                                Volver a Resumen
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {currentView === 'debtors' ? (
                            debtors.map((debtor) => (
                                <div key={debtor.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] hover:bg-white transition-all group border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black shadow-lg shadow-amber-100">
                                            {debtor.name.split(' ').map((n: string) => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{debtor.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{debtor.status} • Última Visita: {debtor.lastVisit}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-rose-600">
                                            -${debtor.pending.toLocaleString()}
                                        </p>
                                        <button
                                            onClick={() => navigate(`/pacientes/${debtor.id}`)}
                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:underline mt-1"
                                        >
                                            Gestionar Cobro
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            transactions.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] hover:bg-white transition-all group border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${tx.type === 'Ingreso' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' : 'bg-rose-50 text-rose-600 shadow-rose-50'
                                            }`}>
                                            {tx.type === 'Ingreso' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{tx.description}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${tx.type === 'Ingreso' ? 'text-slate-800' : 'text-rose-600'}`}>
                                            {tx.type === 'Ingreso' ? '+' : '-'}${tx.amount.toLocaleString()}
                                        </p>
                                        <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${tx.payment_method === 'Tarjeta' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                            }`}>{tx.payment_method}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sección Fiscal y Reportes */}
                <div className="space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-200">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-400/20 rounded-xl">
                                        <Activity className="text-emerald-400" size={18} />
                                    </div>
                                    <h3 className="text-base font-black tracking-tight uppercase tracking-widest text-indigo-200">Previsión Fiscal</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IVA Estimado (16%)</p>
                                            <p className="text-2xl font-black">${estIVA.toLocaleString()}</p>
                                        </div>
                                        <p className="text-[9px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-lg">PROVISIÓN</p>
                                    </div>

                                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISR Estimado (30%)</p>
                                            <p className="text-2xl font-black">${estISR.toLocaleString()}</p>
                                        </div>
                                        <p className="text-[9px] font-black text-rose-400 bg-rose-400/10 px-2 py-1 rounded-lg">PROVISIÓN</p>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Utilidad Estimada</p>
                                            <p className="text-xl font-black text-white">${(netMargin - estISR).toLocaleString()}</p>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 transition-all duration-1000"
                                                style={{ width: `${totalIncome > 0 ? Math.max(0, Math.min(100, ((netMargin - estISR) / totalIncome) * 100)) : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-xl shadow-indigo-100 cursor-pointer hover:bg-slate-900 transition-all" onClick={() => navigate('/inventario')}>
                        <div className="flex items-center gap-4 mb-4">
                            <Package className="text-indigo-200" />
                            <h4 className="text-sm font-black uppercase tracking-widest">Valor de Almacén</h4>
                        </div>
                        <p className="text-3xl font-black">${(stats.treatmentStats.financials.inventoryValue || 0).toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-indigo-200 mt-2">Deducible como costo de operación</p>
                    </div>
                </div>
            </div>

            {/* Modal de Transacción Premium */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[3.5rem] border border-white shadow-3xl overflow-hidden"
                    >
                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800">Registrar Movimiento</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contabilidad Clínica DentalCare Pro</p>
                            </div>

                            <form onSubmit={handleSaveTransaction} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Ingreso' })}
                                        className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'Ingreso' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        Ingreso (+)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Egreso' })}
                                        className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === 'Egreso' ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        Egreso (-)
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Ej. Pago Resinas Proveedor X / Renta"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Monto</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    required
                                                    type="number"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                                    className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-8 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Método</label>
                                            <select
                                                value={formData.payment_method}
                                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                                                className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="Efectivo">Efectivo</option>
                                                <option value="Tarjeta">Tarjeta</option>
                                                <option value="Transferencia">Transferencia</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 px-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                            className="w-full bg-slate-100 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="Tratamiento">Tratamiento</option>
                                            <option value="Inventario">Inventario</option>
                                            <option value="Renta">Renta</option>
                                            <option value="Servicios">Servicios</option>
                                            <option value="Nómina">Nómina</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                                    >
                                        Concluir Registro
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default FinancePage;
