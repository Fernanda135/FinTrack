import { useCallback, useEffect, useState } from "react";
import { Transactions } from "@/api/endpoints";
import { onDataChanged } from "@/utils/events";

export function useTransacoes(limite?: number) {
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    const recarregar = useCallback(() => {
        setCarregando(true);
        Transactions.list(limite)
            .then((linhas) =>
                linhas.map((t) => ({
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
            .finally(() => setCarregando(false));
    }, [limite]);

    useEffect(() => {
        recarregar();
        return onDataChanged(recarregar);
    }, [recarregar]);


    const receitas = transacoes.filter(t => t.tipo === "receita");
    const despesas = transacoes.filter(t => t.tipo === "despesa");

    return { 
        transacoes, 
        receitas,
        despesas,
        carregando, 
        recarregar 
    };
}