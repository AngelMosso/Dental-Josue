import { useState, useEffect, useCallback } from 'react';
import {
    Users,
    LayoutDashboard,
    Calendar,
    Settings,
    LogOut,
    Stethoscope,
    ClipboardList,
    Menu,
    Search,
    Command,
    Bell,
    TrendingUp,
    Shield,
    ShieldCheck,
    DollarSign
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { patientService } from '../services/patientService';
import ErrorBoundary from './ui/ErrorBoundary';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) =>
            `flex items-center gap-3 px-6 py-4 rounded-2xl transition-all group ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]'
                : 'text-slate-400 hover:bg-white/80 hover:text-blue-600'
            }`
        }
    >
        <Icon size={20} className="transition-transform group-hover:scale-110" />
        <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    </NavLink>
);

const HealthRing = ({ color, percent, size = 40 }: { color: string, percent: number, size?: number }) => {
    const radius = (size - 4) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="rotate-[-90deg]" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-white/10" strokeWidth="4" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    className={`fill-none transition-all duration-1000 ${color}`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                />
            </svg>
        </div>
    );
};

export const DashboardLayout = () => {
    const { signOut } = useAuth();
    const [stats, setStats] = useState({ totalPatients: 0, appointmentsToday: 0, efficiency: 85 });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, [location.pathname]); // Recargar al cambiar de página para ver cambios en stats

    const loadStats = async () => {
        try {
            const data = await patientService.getDashboardStats();
            // Simulación de eficiencia basada en citas vs capacidad (ej: 20 citas max)
            const efficiency = Math.min(Math.round((data.appointmentsToday / 15) * 100), 100) || 85;
            setStats({
                totalPatients: data.totalPatients,
                appointmentsToday: data.appointmentsToday,
                efficiency
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Smart Search Shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape') setIsSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    const activeSearch = useCallback((cmd: string) => {
        setIsSearchOpen(false);
        if (cmd.toLowerCase().includes('nuevo paciente')) navigate('/pacientes?new=true');
        else if (cmd.toLowerCase().includes('paciente')) navigate('/pacientes');
        if (cmd.toLowerCase().includes('cita') || cmd.toLowerCase().includes('agenda')) navigate('/citas');
        if (cmd.toLowerCase().includes('stock') || cmd.toLowerCase().includes('inventario')) navigate('/inventario');
        if (cmd.toLowerCase().includes('finanzas') || cmd.toLowerCase().includes('factura')) navigate('/finanzas');
        if (cmd.toLowerCase().includes('ajustes') || cmd.toLowerCase().includes('configuracion')) navigate('/configuracion');
        setSearchValue('');
    }, [navigate]);

    return (
        <div className="flex h-screen bg-[#f1f5f9] font-sans selection:bg-blue-100 overflow-hidden">
            {/* Sidebar Glassmorphism */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                flex flex-col w-72 bg-white/40 backdrop-blur-3xl border-r border-white/40 p-8 h-full
                transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-y-auto custom-scrollbar
                ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 p-2.5 rounded-[1.2rem] shadow-xl shadow-slate-200">
                            <Stethoscope className="text-white" size={22} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-slate-800 leading-none tracking-tighter">
                                DentalCare
                            </h1>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Professional</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-3">
                    <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Módulos Clínicos</p>
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/pacientes" icon={Users} label="Pacientes" />
                    <SidebarItem to="/citas" icon={Calendar} label="Agenda" />
                    <SidebarItem to="/inventario" icon={ClipboardList} label="Inventario" />
                    <SidebarItem to="/finanzas" icon={DollarSign} label="Finanzas" />
                    <SidebarItem to="/normativa" icon={ShieldCheck} label="Normativa" />
                </nav>

                <div className="mt-8 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-white/10 rounded-xl"><TrendingUp size={14} /></div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Salud Clínica</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <HealthRing color="stroke-blue-500" percent={stats.efficiency} />
                                <div className="flex flex-col">
                                    <p className="text-xl font-black">{stats.efficiency}%</p>
                                    <p className="text-[8px] font-bold uppercase opacity-50">Eficiencia Operativa</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                            <Shield size={64} />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200/50 space-y-2 relative z-10">
                        <SidebarItem to="/configuracion" icon={Settings} label="Ajustes" />
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-3 px-6 py-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest cursor-pointer relative z-20"
                        >
                            <LogOut size={18} />
                            <span>Salir del Sistema</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-24 bg-white/40 backdrop-blur-md border-b border-white/40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setIsMenuOpen(true)} className="p-3 bg-white border border-slate-100 rounded-xl md:hidden text-slate-400">
                            <Menu size={20} />
                        </button>

                        {/* Smart Search Bar (Functional) */}
                        <div className="relative group hidden lg:block">
                            <div
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center gap-4 px-6 py-3 bg-slate-100 hover:bg-white border-2 border-transparent hover:border-blue-100 rounded-[1.5rem] transition-all cursor-pointer w-[400px]"
                            >
                                <Search className="text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
                                <div className="flex-1 text-[11px] font-bold text-slate-400">Buscar en la clínica...</div>
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                    <Command size={10} className="text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-500">K</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all relative">
                            <Bell size={20} />
                            <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full" />
                        </button>
                        <div className="h-10 w-[1px] bg-slate-200 mx-2" />
                        <div className="text-right hidden sm:block">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">
                                {localStorage.getItem('dc_user_name') || 'Admin'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">
                                {localStorage.getItem('dc_user_role') || 'Odontólogo Pro'}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-100">
                            {(localStorage.getItem('dc_user_name') || 'Admin').substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-12">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </div>
            </main>

            {/* Premium Smart Search Modal (Cmd+K) */}
            <AnimatePresence>
                {isSearchOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsSearchOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0, y: -20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.98, opacity: 0, y: -20 }}
                            className="relative w-full max-w-2xl"
                        >
                            <div className="bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden">
                                <div className="flex items-center gap-6 p-8 border-b border-slate-50">
                                    <Search className="text-blue-600" size={28} />
                                    <input
                                        autoFocus
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && activeSearch(searchValue)}
                                        type="text"
                                        placeholder="Escribe 'pacientes', 'citas' o 'stock'..."
                                        className="flex-1 bg-transparent border-none text-2xl font-black text-slate-800 placeholder:text-slate-200 focus:ring-0 outline-none"
                                    />
                                    <button onClick={() => setIsSearchOpen(false)} className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase">Esc</button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sugerencias Inteligentes</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { label: 'Ver Pacientes', cmd: 'paciente', key: 'P' },
                                                { label: 'Agenda Semanal', cmd: 'agenda', key: 'A' },
                                                { label: 'Revisar Inventario', cmd: 'stock', key: 'I' },
                                                { label: 'Configuración', cmd: 'ajustes', key: 'S' }
                                            ].map(item => (
                                                <button
                                                    key={item.label}
                                                    onClick={() => activeSearch(item.cmd)}
                                                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-600 group rounded-2xl transition-all"
                                                >
                                                    <span className="text-[11px] font-black uppercase text-slate-600 group-hover:text-white transition-colors">{item.label}</span>
                                                    <span className="text-[10px] font-mono text-slate-300 group-hover:text-white/50">{item.key}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
