import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
                        <AlertCircle size={40} />
                    </div>

                    <div className="max-w-md space-y-2">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Vaya, algo salió mal</h2>
                        <p className="text-gray-500 text-sm font-medium">
                            Hubo un problema al cargar este módulo. No te preocupes, tus datos están seguros.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                        >
                            <RefreshCcw size={18} /> Reintentar Carga
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95"
                        >
                            <Home size={18} /> Volver al Inicio
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest pt-8">
                        DentalCare Pro • Sistema de Resiliencia Activo
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
