import { useCallback, useEffect, useState } from "react";
import { Transactions } from "@/api/endpoints";
import { onDataChanged } from "@/utils/events";

export function useTransacoes(limit?: number) {
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(() => {
        setLoading(true);
        Transactions.list(limit)
            // backend returns title/amount/account/category — map to the shape the UI expects
            .then((rows) =>
                rows.map((t) => ({
                    id: t.id,
                    titulo: t.title,
                    valor: t.amount,
                    tipo: t.type === "RECEITA" ? "receita" : "despesa",
                    data: t.date,
                    categoria: t.category ? { label: t.category.label, value: t.category.value } : undefined,
                    conta: t.account ? { label: t.account.label } : undefined,
                })),
            )
            .then(setTransacoes)
            .catch(() => setTransacoes([]))
            .finally(() => setLoading(false));
    }, [limit]);

    useEffect(() => {
        reload();
        return onDataChanged(reload);
    }, [reload]);

    return { transacoes, loading, reload };
}
