import { useMemo } from 'react';
import { useTransacoes } from './useTransacoes';

interface UseTransacoesFiltradasProps {
    mes?: number;
    ano?: number;
    tipo?: 'receita' | 'despesa' | 'todas';
}

export function useTransacoesFiltradas({
    mes,
    ano,
    tipo = 'todas'
}: UseTransacoesFiltradasProps = {}) {
    const { transacoes, carregando } = useTransacoes();

    const transacoesFiltradas = useMemo(() => {
        let filtradas = transacoes;


        if (mes !== undefined && ano !== undefined) {
            filtradas = filtradas.filter(t => {
                const data = new Date(t.data);
                return data.getMonth() === mes &&
                    data.getFullYear() === ano;
            });
        }


        if (tipo !== 'todas') {
            filtradas = filtradas.filter(t => t.tipo === tipo);
        }

        return filtradas;
    }, [transacoes, mes, ano, tipo]);

    const receitas = useMemo(() =>
        transacoesFiltradas.filter(t => t.tipo === 'receita'),
        [transacoesFiltradas]
    );

    const despesas = useMemo(() =>
        transacoesFiltradas.filter(t => t.tipo === 'despesa'),
        [transacoesFiltradas]
    );

    const totais = useMemo(() => {
        const totalReceitas = receitas.reduce((soma, t) => soma + (t.valor || 0), 0);
        const totalDespesas = despesas.reduce((soma, t) => soma + (t.valor || 0), 0);
        return {
            totalReceitas,
            totalDespesas,
            saldo: totalReceitas - totalDespesas
        };
    }, [receitas, despesas]);

    return {
        transacoes: transacoesFiltradas,
        receitas,
        despesas,
        totais,
        carregando
    };
}