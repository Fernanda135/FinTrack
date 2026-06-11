import { api, tokens } from "./client";

export const Auth = {
    async login(email: string, password: string) {
        const d = await api<{ accessToken: string; refreshToken: string }>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        await tokens.save(d.accessToken, d.refreshToken);
    },
    async register(email: string, name: string, password: string) {
        const d = await api<{ accessToken: string; refreshToken: string }>("/auth/register", {
            method: "POST",
            body: JSON.stringify({ email, name, password }),
        });
        await tokens.save(d.accessToken, d.refreshToken);
    },
    logout: () => api("/auth/logout", { method: "POST" }).finally(tokens.clear),
    me: () => api<{ id: string; name: string; email: string }>("/auth/me"),
};

export const Accounts = {
    list: () => api<any[]>("/accounts"),
    types: () => api<{ label: string; value: string }[]>("/accounts/types"),
    create: (b: any) => api("/accounts", { method: "POST", body: JSON.stringify(b) }),
    update: (id: string, b: any) => api(`/accounts/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
    remove: (id: string) => api(`/accounts/${id}`, { method: "DELETE" }),
};

export const Categories = {
    list: () => api<any[]>("/categories"),
    create: (b: any) => api("/categories", { method: "POST", body: JSON.stringify(b) }),
};

export const Transactions = {
    list: (limit?: number) => api<any[]>(`/transactions${limit ? `?limit=${limit}` : ""}`),
    create: (b: any) => api("/transactions", { method: "POST", body: JSON.stringify(b) }),
    update: (id: string, b: any) => api(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
    remove: (id: string) => api(`/transactions/${id}`, { method: "DELETE" }),
};

export const Budgets = {
    list: () => api<any[]>("/budgets"),
    create: (b: any) => api("/budgets", { method: "POST", body: JSON.stringify(b) }),
    update: (id: string, b: any) => api(`/budgets/${id}`, { method: "PATCH", body: JSON.stringify(b) }),
    remove: (id: string) => api(`/budgets/${id}`, { method: "DELETE" }),
};

export const Dashboard = {
    summary: () => api<any>("/dashboard"),
};
