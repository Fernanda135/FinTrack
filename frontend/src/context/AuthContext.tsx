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
            const t = await tokens.access();

            if (t) {
                try {
                    const me = await Auth.me();
                    setUser(me);
                    setSignedIn(true);
                } catch (err) {
                    await tokens.clear();
                    setUser(null);
                    setSignedIn(false);
                }
            } else {
                setUser(null);
                setSignedIn(false);
            }

            setReady(true);
        };

        init();
    }, []);

    const value: AuthState = {
        ready,
        signedIn,
        user,
login: async (e, p) => {
    try {
        await Auth.login(e, p);
        
        const access = await tokens.access();
        const refresh = await tokens.refresh();
        
        const me = await Auth.me();
        
        setUser(me);
        setSignedIn(true);
    } catch (err) {
        throw err;
    }
},
        register: async (e, n, p) => {
            try {
                await Auth.register(e, n, p);
                const access = await tokens.access();
                const refresh = await tokens.refresh();
                
                const me = await Auth.me();
                setUser(me);
                setSignedIn(true);
            } catch (err) {
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
