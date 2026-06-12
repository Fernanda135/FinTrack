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
        login: async (e, p) => {
            await Auth.login(e, p);
            setSignedIn(true);
        },
        register: async (e, n, p) => {
            await Auth.register(e, n, p);
            setSignedIn(true);
        },
        logout: async () => {
            await Auth.logout();
            await tokens.clear?.(); 
            setSignedIn(false);
        },
    };
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
