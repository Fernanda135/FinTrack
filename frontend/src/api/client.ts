import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333/api";
const ACCESS = "ft_access";
const REFRESH = "ft_refresh";

// SecureStore is unavailable on web — fall back to localStorage there.
const store = {
    async get(key: string) {
        if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
        return SecureStore.getItemAsync(key);
    },
    async set(key: string, value: string) {
        if (Platform.OS === "web") return void globalThis.localStorage?.setItem(key, value);
        return SecureStore.setItemAsync(key, value);
    },
    async del(key: string) {
        if (Platform.OS === "web") return void globalThis.localStorage?.removeItem(key);
        return SecureStore.deleteItemAsync(key);
    },
};

export const tokens = {
    save: async (a: string, r: string) => {
        await store.set(ACCESS, a);
        await store.set(REFRESH, r);
    },
    clear: async () => {
        await store.del(ACCESS);
        await store.del(REFRESH);
    },
    access: () => store.get(ACCESS),
    refresh: () => store.get(REFRESH),
};

async function raw(path: string, init: RequestInit, useRefresh = false): Promise<Response> {
    const token = await (useRefresh ? tokens.refresh() : tokens.access());
    return fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init.headers ?? {}),
        },
    });
}

/**
 * Token-aware fetch wrapper. On a 401 it transparently tries ONE refresh
 * (rotating the stored tokens) and replays the original request.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res = await raw(path, init);
    if (res.status === 401 && (await tokens.refresh())) {
        const r = await raw("/auth/refresh", { method: "POST" }, true);
        if (r.ok) {
            const data = await r.json();
            await tokens.save(data.accessToken, data.refreshToken);
            res = await raw(path, init);
        } else {
            await tokens.clear();
        }
    }
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
        throw new Error(msg ?? `HTTP ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : res.json();
}