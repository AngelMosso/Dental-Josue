import { useState } from 'react';
import type { ToothStatus, OdontogramData } from '../types';

interface OdontogramProps {
    data?: OdontogramData;
    onChange?: (data: OdontogramData) => void;
    readOnly?: boolean;
}

const statusColors: Record<ToothStatus, string> = {
    'Sano': 'fill-white bg-white',
    'Caries': 'fill-red-500 bg-red-500',
    'Ausente': 'fill-gray-100 bg-gray-100',
    'Tratado': 'fill-blue-500 bg-blue-500',
    'Tratado (Oro)': 'fill-yellow-500 bg-yellow-500',
    'Tratado (Zirconia)': 'fill-gray-300 bg-gray-300'
};

const statusBorders: Record<ToothStatus, string> = {
    'Sano': 'border-gray-100',
    'Caries': 'border-red-600',
    'Ausente': 'border-gray-300',
    'Tratado': 'border-blue-600',
    'Tratado (Oro)': 'border-yellow-600',
    'Tratado (Zirconia)': 'border-gray-400'
};

export const Odontogram = ({ data = {}, onChange, readOnly = false }: OdontogramProps) => {
    const [teeth, setTeeth] = useState<OdontogramData>(data);

    const handleToothClick = (number: number) => {
        if (readOnly) return;

        const statuses: ToothStatus[] = ['Sano', 'Caries', 'Ausente', 'Tratado', 'Tratado (Oro)', 'Tratado (Zirconia)'];
        const currentStatus = teeth[number] || 'Sano';
        const nextIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length;
        const nextStatus = statuses[nextIdx];

        const newData = { ...teeth, [number]: nextStatus };
        setTeeth(newData);
        onChange?.(newData);
    };

    const renderTooth = (num: number, position: 'top' | 'bottom') => {
        const status = teeth[num] || 'Sano';
        return (
            <button
                key={num}
                onClick={() => handleToothClick(num)}
                className={`
                    relative w-10 h-12 md:w-12 md:h-16 border-2 transition-all flex flex-col items-center justify-center 
                    active:scale-95 shadow-sm
                    ${statusBorders[status]} ${statusColors[status]}
                    ${position === 'top' ? 'rounded-t-2xl' : 'rounded-b-2xl'}
                    ${status === 'Sano' ? 'hover:bg-gray-50' : 'hover:opacity-90'}
                `}
            >
                <span className={`text-[10px] font-black ${status === 'Sano' ? 'text-gray-400' : 'text-white'}`}>{num}</span>
                {status !== 'Sano' && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className="w-full h-full border-4 border-white/50 rounded-full scale-50" />
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-col gap-10">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-center">
                {['Sano', 'Caries', 'Ausente', 'Tratado'].map((s) => (
                    <div key={s} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                        <div className={`w-3 h-3 rounded-full border border-black/5 ${statusColors[s as ToothStatus]}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{s}</span>
                    </div>
                ))}
            </div>

            {/* Teeth Container with horizontal scroll on small mobile */}
            <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="min-w-[600px] flex flex-col gap-4">
                    {/* Upper Arch */}
                    <div className="flex justify-center gap-1.5">
                        {/* Right side (18-11) */}
                        <div className="flex gap-1">
                            {[18, 17, 16, 15, 14, 13, 12, 11].map(n => renderTooth(n, 'top'))}
                        </div>
                        <div className="w-4" /> {/* Midline gap */}
                        {/* Left side (21-28) */}
                        <div className="flex gap-1">
                            {[21, 22, 23, 24, 25, 26, 27, 28].map(n => renderTooth(n, 'top'))}
                        </div>
                    </div>

                    {/* Lower Arch */}
                    <div className="flex justify-center gap-1.5">
                        {/* Right side (48-41) */}
                        <div className="flex gap-1">
                            {[48, 47, 46, 45, 44, 43, 42, 41].map(n => renderTooth(n, 'bottom'))}
                        </div>
                        <div className="w-4" /> {/* Midline gap */}
                        {/* Left side (31-38) */}
                        <div className="flex gap-1">
                            {[31, 32, 33, 34, 35, 36, 37, 38].map(n => renderTooth(n, 'bottom'))}
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Desliza horizontalmente para ver todos los dientes en móvil</p>
        </div>
    );
};
