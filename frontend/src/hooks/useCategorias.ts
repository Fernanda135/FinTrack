import { useCallback, useEffect, useState } from "react";
import { Categories } from "@/api/endpoints";
import { onDataChanged } from "@/utils/events";

export function useCategorias() {
    const [raw, setRaw] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(() => {
        setLoading(true);
        Categories.list()
            .then(setRaw)
            .catch(() => setRaw([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        reload();
        return onDataChanged(reload);
    }, [reload]);

    // income categories ("renda") are excluded from the gastos breakdown
    const categoriasGastos = raw.filter((c) => !c.isIncome);
    const totalGastos = categoriasGastos.reduce((t, c) => t + (c.valor ?? 0), 0);

    const categoriasComPorcentagem = categoriasGastos
        .map((c) => ({
            ...c,
            porcentagem: totalGastos ? Number(((c.valor / totalGastos) * 100).toFixed(1)) : 0,
            progresso: totalGastos ? c.valor / totalGastos : 0,
        }))
        .sort((a, b) => b.valor - a.valor);

    return { categoriasComPorcentagem, totalGastos, loading, reload };
}
