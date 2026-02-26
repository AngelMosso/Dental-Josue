import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardList,
    Plus,
    Search,
    AlertTriangle,
    Package,
    RefreshCcw,
    TrendingDown,
    Layers,
    ShoppingCart,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import type { InventoryItem } from '../types';

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl rounded-[2.5rem] ${className}`}>
        {children}
    </div>
);

const InventoryPage = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        category: InventoryItem['category'];
        stock: number;
        min_stock: number;
        unit: string;
        unit_price: number;
    }>({
        name: '',
        category: 'Material',
        stock: 0,
        min_stock: 0,
        unit: 'Piezas',
        unit_price: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await patientService.getInventory();
            setInventory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: InventoryItem = {
            id: editingItem?.id || Math.random().toString(36).substr(2, 9),
            ...formData
        };
        await patientService.saveInventoryItem(newItem);
        await loadData();
        setIsModalOpen(false);
        setEditingItem(null);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este insumo?')) {
            await patientService.deleteInventoryItem(id);
            await loadData();
        }
    };

    const handleQuickAdd = async (item: InventoryItem) => {
        const updated = { ...item, stock: item.stock + 1 };
        await patientService.saveInventoryItem(updated);
        await loadData();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Material',
            stock: 0,
            min_stock: 0,
            unit: 'Piezas',
            unit_price: 0
        });
    };

    const openCreateModal = () => {
        setEditingItem(null);
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            stock: item.stock,
            min_stock: item.min_stock,
            unit: item.unit,
            unit_price: item.unit_price || 0
        });
        setIsModalOpen(true);
    };

    const categories = ['Todos', 'Material', 'Instrumental', 'Anestesia', 'Desechable'];

    const filteredItems = inventory.filter(item => {
        const matchesFilter = filter === 'Todos' ? true : item.category === filter;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const lowStockCount = inventory.filter(item => item.stock <= item.min_stock).length;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <ClipboardList className="text-white" size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Inventario Quirúrgico</h2>
                    </div>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] px-1">Control de Insumos y Bioseguridad</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/finanzas')}
                        className="hidden md:flex items-center gap-2 bg-white border border-gray-100 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
                    >
                        Ver Impacto Financiero <ArrowRight size={12} />
                    </button>
                    <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block" />
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar insumo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-none rounded-2xl py-4 pl-12 pr-6 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 w-[250px]"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                    >
                        <Plus size={20} />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Nuevo Item</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-8 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Insumos</p>
                            <h4 className="text-4xl font-black text-slate-800">{inventory.length}</h4>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><Package size={20} /></div>
                    </div>
                </GlassCard>

                <GlassCard className={`p-8 border-l-4 ${lowStockCount > 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bajo Stock</p>
                            <h4 className={`text-4xl font-black ${lowStockCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{lowStockCount}</h4>
                        </div>
                        <div className={`p-3 rounded-2xl ${lowStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {lowStockCount > 0 ? <AlertTriangle size={20} /> : <Package size={20} />}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Inventario</p>
                            <h4 className="text-4xl font-black text-slate-800">
                                ${inventory.reduce((acc, i) => acc + (i.stock * (i.unit_price || 0)), 0).toLocaleString()}
                            </h4>
                        </div>
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Layers size={20} /></div>
                    </div>
                </GlassCard>
            </div>

            {/* Filtros de Categoría */}
            <div className="flex gap-2 p-1 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Inventory List */}
            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Insumo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Stock Actual</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-4" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando almacén...</p>
                                    </td>
                                </tr>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400">
                                        No se encontraron insumos con ese criterio.
                                    </td>
                                </tr>
                            ) : filteredItems.map((item, idx) => (
                                <motion.tr
                                    key={item.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="hover:bg-slate-50/30 transition-colors group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <Package size={20} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-black text-slate-800">{item.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Ref: {item.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                            {item.category}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-sm font-black text-slate-800">{item.stock} <span className="text-[10px] text-slate-400 font-bold">{item.unit}</span></p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            {item.stock <= item.min_stock ? (
                                                <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-full">
                                                    <TrendingDown size={12} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Bajo Stock</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                                                    <RefreshCcw size={12} className="animate-spin-slow" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Óptimo</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleQuickAdd(item)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Entrada rápida (+1)"
                                            >
                                                <Plus size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-600 transition-all"
                                                title="Editar"
                                            >
                                                <RefreshCcw size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                                title="Eliminar"
                                            >
                                                <AlertTriangle size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Alerta de Pedido Sugerido (Premium Look) */}
            {lowStockCount > 0 && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-8 bg-gradient-to-r from-red-600 to-rose-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-red-200"
                >
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-[2rem] backdrop-blur-md">
                            <ShoppingCart size={32} />
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                            <h5 className="text-xl font-black uppercase tracking-tight">Reabastecimiento Necesario</h5>
                            <p className="text-xs font-bold opacity-80 uppercase tracking-[0.2em]">Hay {lowStockCount} insumos críticos bajo el mínimo sugerido.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => alert(`Sugerencia de compra:\n${inventory.filter(i => i.stock <= i.min_stock).map(i => `- ${i.name}: Pedir ${i.min_stock * 2 - i.stock} ${i.unit}`).join('\n')}`)}
                        className="px-8 py-4 bg-white text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95 whitespace-nowrap"
                    >
                        Generar Orden de Compra
                    </button>
                </motion.div>
            )}

            {/* Modal de Gestión (Glassmorphism Modal) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsModalOpen(false)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[3rem] border border-white shadow-2xl overflow-hidden"
                    >
                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800">{editingItem ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Almacén Central DentalCare</p>
                            </div>

                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre del Insumo</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Ej. Guantes Nitrilo Medianos"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Categoría</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value as InventoryItem['category'] })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {categories.filter(c => c !== 'Todos').map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unidad de Medida</label>
                                            <input
                                                type="text"
                                                value={formData.unit}
                                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Cajas, Piezas, etc."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Stock Actual</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.stock}
                                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-center"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mínimo Crítico</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.min_stock}
                                                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) })}
                                                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 text-center"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Precio Unit.</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.unit_price}
                                                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                                                    className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-8 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-5 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"
                                    >
                                        {editingItem ? 'Guardar Cambios' : 'Registrar Insumo'}
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

export default InventoryPage;
