import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateMasterCredentials: (email: string) => void;
    isMasterUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMasterUser, setIsMasterUser] = useState(false);

    // Credenciales maestras por defecto o desde localStorage (Solo Email, NO Password)
    const getMasterEmail = () => localStorage.getItem('dc_master_email') || 'JosueConsultorioR1@gmail.com';

    useEffect(() => {
        // Verificar si hay una "sesión maestra" activa
        const masterSession = localStorage.getItem('dc_master_session');
        if (masterSession === 'active') {
            setIsMasterUser(true);
            setUser({ email: getMasterEmail() } as User);
            setLoading(false);
            return;
        }

        // Obtener sesión inicial de Supabase
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (localStorage.getItem('dc_master_session') === 'active') return;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const updateMasterCredentials = (email: string) => {
        localStorage.setItem('dc_master_email', email.toLowerCase());
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('dc_master_session');
        window.location.href = '/login';
    };

    const value = {
        user,
        session,
        loading,
        signOut,
        updateMasterCredentials,
        isMasterUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
