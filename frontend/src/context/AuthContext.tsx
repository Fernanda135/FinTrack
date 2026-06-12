import React, { createContext, useContext, useEffect, useState } from "react";
import { tokens } from "@/api/client";
import { Auth } from "@/api/endpoints";


type User = {
    id: string;
    name: string;
    email: string;
};

type AuthState = {
    ready: boolean;
    signedIn: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, name: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};


const Ctx = createContext<AuthState>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const init = async () => {
            console.log("1. Iniciando auth...");
            const t = await tokens.access();
            console.log("2. Token encontrado:", !!t);

            if (t) {
                try {
                    console.log("3. Buscando dados do usuário...");
                    const me = await Auth.me();
                    console.log("4. Dados recebidos:", me); // <-- VERIFICAR SE AQUI VEM OS DADOS
                    setUser(me);
                    setSignedIn(true);
                    console.log("5. User setado no estado");
                } catch (err) {
                    console.log("Erro no me():", err);
                    await tokens.clear();
                    setUser(null);
                    setSignedIn(false);
                }
            } else {
                console.log("Sem token, usuário não autenticado");
                setUser(null);
                setSignedIn(false);
            }

            setReady(true);
            console.log("6. Ready finalizado");
        };

        init();
    }, []);

    const value: AuthState = {
        ready,
        signedIn,
        user,
        // AuthContext.tsx
        login: async (e, p) => {
            console.log("Tentando login:", e);
            try {
                await Auth.login(e, p);
                console.log("Login realizado, verificando tokens...");
                const access = await tokens.access();
                const refresh = await tokens.refresh();
                console.log("Access token existe?", !!access);
                console.log("Refresh token existe?", !!refresh);
                
                // Buscar dados do usuário
                const me = await Auth.me();
                console.log("Dados do usuário:", me);
                setUser(me);
                setSignedIn(true);
            } catch (err) {
                console.log("Erro no login:", err);
                throw err;
            }
        },
        // AuthContext.tsx
        register: async (e, n, p) => {
            console.log("Tentando registrar:", e);
            try {
                await Auth.register(e, n, p);
                console.log("Registro realizado, verificando tokens...");
                const access = await tokens.access();
                const refresh = await tokens.refresh();
                console.log("Access token existe?", !!access);
                console.log("Refresh token existe?", !!refresh);
                
                // Buscar dados do usuário APÓS o registro
                const me = await Auth.me();
                console.log("Dados do usuário registrado:", me);
                setUser(me);
                setSignedIn(true);
            } catch (err) {
                console.log("Erro no registro:", err);
                throw err;
            }
        },
        logout: async () => {
            await Auth.logout();
            await tokens.clear?.(); 
            setSignedIn(false);
        },
    };
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
