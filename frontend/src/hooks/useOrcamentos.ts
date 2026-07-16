import { useMemo, useEffect, useState, useCallback } from 'react';
import { COLORS } from "@/constants/colors";
import { Categories } from "@/api/endpoints";
import { useTransacoesFiltradas } from './useTransacoesFiltradas';

export function useOrcamentos(mes?: number, ano?: number) {
    const [categorias, setCategorias] = useState<any[]>([]);
    const [carregandoCategorias, setCarregandoCategorias] = useState(true);

    const { despesas, carregando: carregandoTransacoes } = useTransacoesFiltradas({ 
        mes, 
        ano, 
        tipo: 'despesa' 
    });

    useEffect(() => {
        setCarregandoCategorias(true);
        Categories.list()
            .then((data) => {
                setCategorias(data || []);
            })
            .catch(() => {
                setCategorias([]);
            })
            .finally(() => {
                setCarregandoCategorias(false);
            });
    }, []);

    const getGasto = useCallback((item: any) => {
        if (!item) return 0;
        return item.gasto || item.spent || 0;
    }, []);

    const getLimite = useCallback((item: any) => {
        if (!item) return 0;
        return item.limite || item.limit || 0;
    }, []);

    const getDescricao = useCallback((item: any) => {
        if (!item) return "";
        return item.descricao || item.description || "";
    }, []);

    const getCategoriaNome = useCallback((orcamento: any) => {
        if (!orcamento) return "Sem categoria";
        
        if (orcamento.categoria?.label) return orcamento.categoria.label;
        if (orcamento.category?.label) return orcamento.category.label;
        
        const categoriaId = orcamento.categoriaId || orcamento.categoryId;
        if (categoriaId) {
            const categoria = categorias.find(c => c.id === categoriaId);
            if (categoria) {
                return categoria.label || categoria.name || "Sem categoria";
            }
        }
        
        return "Sem categoria";
    }, [categorias]);

    const getCategoriaIcon = useCallback((orcamento: any) => {
        if (!orcamento) return null;
        
        if (orcamento.categoria?.icon) return orcamento.categoria.icon;
        if (orcamento.category?.icon) return orcamento.category.icon;
        
        const categoriaId = orcamento.categoriaId || orcamento.categoryId;
        if (categoriaId) {
            const categoria = categorias.find(c => c.id === categoriaId);
            if (categoria) {
                return categoria.icon || categoria.emoji || null;
            }
        }
        
        return null;
    }, [categorias]);

    const getCategoriaCor = useCallback((orcamento: any) => {
        if (!orcamento) return COLORS.primary;
        
        if (orcamento.categoria?.color) return orcamento.categoria.color;
        if (orcamento.category?.color) return orcamento.category.color;
        
        const categoriaId = orcamento.categoriaId || orcamento.categoryId;
        if (categoriaId) {
            const categoria = categorias.find(c => c.id === categoriaId);
            if (categoria) {
                return categoria.color || COLORS.primary;
            }
        }
        
        return COLORS.primary;
    }, [categorias]);

    const gastosPorCategoria = useMemo(() => {
        const mapa = new Map();
        despesas.forEach(t => {
            const categoria = t.categoria?.label || t.category?.label || 'Outros';
            const valor = t.valor || t.amount || 0;
            mapa.set(categoria, (mapa.get(categoria) || 0) + valor);
        });
        return mapa;
    }, [despesas]);
    const obterPorcentagem = useCallback((gasto: number, limite: number) => {
        if (limite === 0) return 0;
        return Math.round((gasto / limite) * 100);
    }, []);

    const obterCor = useCallback((porcentagem: number) => {
        if (porcentagem < 80) {
            return COLORS.progressGreen;
        }
        if (porcentagem < 100) {
            return COLORS.warning;
        }
        return COLORS.error;
    }, []);

    const gastoTotal = useMemo(() => 
        despesas.reduce((soma, t) => soma + (t.valor || t.amount || 0), 0),
        [despesas]
    );

    const carregando = carregandoTransacoes || carregandoCategorias;

    return {
        getGasto,
        getLimite,
        getDescricao,
        getCategoriaNome,
        getCategoriaIcon,
        getCategoriaCor,
        obterPorcentagem,
        obterCor,
        
        gastoTotal,
        gastosPorCategoria,
        categorias,
        carregando,
    };
}