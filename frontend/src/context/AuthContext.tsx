import React, { createContext, useContext, useEffect, useState } from "react";
import { tokens } from "@/api/client";
import { Auth } from "@/api/endpoints";

type AuthState = {
    ready: boolean;
    signedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, name: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const Ctx = createContext<AuthState>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [ready, setReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        tokens.access().then((t) => {
            setSignedIn(!!t);
            setReady(true);
        });
    }, []);

    const value: AuthState = {
        ready,
        signedIn,
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
            setSignedIn(false);
        },
    };
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
