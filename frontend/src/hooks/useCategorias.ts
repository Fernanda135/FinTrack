import { useMemo } from 'react';
import { useTransacoesFiltradas } from './useTransacoesFiltradas';

interface UseCategoriasProps {
    mes?: number;
    ano?: number;
}

export function useCategorias({ mes, ano }: UseCategoriasProps = {}) {
    const { despesas, carregando } = useTransacoesFiltradas({
        mes,
        ano,
        tipo: 'despesa'
    });

    const categorias = useMemo(() => {

        const categoriasMap = new Map();

        despesas.forEach(transacao => {
            const categoriaLabel = transacao.categoria?.label || 'Outros';
            const valor = transacao.valor || 0;

            if (categoriasMap.has(categoriaLabel)) {
                const existente = categoriasMap.get(categoriaLabel);
                existente.valor += valor;
                existente.transacoes += 1;
            } else {
                categoriasMap.set(categoriaLabel, {
                    id: categoriaLabel.toLowerCase().replace(/\s/g, '_'),
                    label: categoriaLabel,
                    valor: valor,
                    transacoes: 1,
                    progresso: 0,
                    porcentagem: 0,
                });
            }
        });

        const categoriasArray = Array.from(categoriasMap.values());
        const totalGastos = categoriasArray.reduce((soma, cat) => soma + cat.valor, 0);


        return categoriasArray.map(cat => ({
            ...cat,
            progresso: totalGastos > 0 ? cat.valor / totalGastos : 0,
            porcentagem: totalGastos > 0 ? Math.round((cat.valor / totalGastos) * 100) : 0,
        }));
    }, [despesas]);

    const totalGastos = useMemo(() => {
        return categorias.reduce((soma, cat) => soma + cat.valor, 0);
    }, [categorias]);

    return {
        categoriasComPorcentagem: categorias,
        totalGastos,
        carregando,
    };
}