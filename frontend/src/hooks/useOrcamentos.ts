import { useMemo } from 'react';
import { COLORS } from "@/constants/colors";
import { useTransacoesFiltradas } from './useTransacoesFiltradas';

export function useOrcamentos(mes?: number, ano?: number) {
    const { despesas, carregando } = useTransacoesFiltradas({ 
        mes, 
        ano, 
        tipo: 'despesa' 
    });


    const gastosPorCategoria = useMemo(() => {
        const mapa = new Map();
        despesas.forEach(t => {
            const categoria = t.categoria?.label || 'Outros';
            mapa.set(categoria, (mapa.get(categoria) || 0) + (t.valor || 0));
        });
        return mapa;
    }, [despesas]);


    const obterPorcentagem = (gasto: number, limite: number) => {
        if (limite === 0) return 0;
        return Math.round((gasto / limite) * 100);
    };

    const obterCor = (porcentagem: number) => {
        if (porcentagem < 80) {
            return COLORS.progressGreen;
        }
        if (porcentagem < 100) {
            return COLORS.warning;
        }
        return COLORS.error;
    };


    const gastoTotal = useMemo(() => 
        despesas.reduce((soma, t) => soma + (t.valor || 0), 0),
        [despesas]
    );

    return {
        obterPorcentagem,
        obterCor,
        gastoTotal,
        gastosPorCategoria,
        carregando
    };
}