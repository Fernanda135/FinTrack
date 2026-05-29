import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/api/endpoints";
import { onDataChanged } from "@/utils/events";

// The backend returns transactions with joined account/category and English
// field names; the UI expects the legacy Portuguese shape. Map it here once.
function mapTransacao(t: any) {
    return {
        id: t.id,
        titulo: t.title,
        valor: t.amount,
        tipo: t.type === "RECEITA" ? "receita" : "despesa",
        data: t.date,
        categoria: t.category ? { label: t.category.label, value: t.category.value } : undefined,
        conta: t.account ? { label: t.account.label } : undefined,
    };
}

const EMPTY = {
    saldoTotal: 0,
    gastoTotal: 0,
    receitaTotal: 0,
    gastoOrcaTotal: 0,
    limiteOrcTotal: 0,
    orcAtivos: 0,
    ultimasTransacoes: [] as any[],
};

export function useDashboard() {
    const [data, setData] = useState(EMPTY);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(() => {
        setLoading(true);
        Dashboard.summary()
            .then((d) =>
                setData({ ...d, ultimasTransacoes: (d.ultimasTransacoes ?? []).map(mapTransacao) }),
            )
            .catch(() => setData(EMPTY))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        reload();
        return onDataChanged(reload);
    }, [reload]);

    return { ...data, loading, reload };
}
