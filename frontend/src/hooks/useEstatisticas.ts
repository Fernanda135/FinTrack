import { useCallback, useEffect, useMemo, useState } from "react";
import { Accounts } from "@/api/endpoints";
import { COLORS, CATEGORY_COLORS } from "@/constants/colors";
import { onDataChanged } from "@/utils/events";
import { useTransacoesFiltradas } from "./useTransacoesFiltradas";

function gerarGraficoAcumulado(
    transacoes: any[],
    obterValor: (transacao: any) => number,
    cor: string
) {
    const mapaDatas = new Map<string, number>();

    const ordenadas = [...transacoes].sort(
        (a, b) =>
            new Date(a.data).getTime() -
            new Date(b.data).getTime()
    );

    ordenadas.forEach((t) => {
        const data = t.data;
        const valorAtual = mapaDatas.get(data) || 0;

        mapaDatas.set(
            data,
            valorAtual + obterValor(t)
        );
    });

    const labels: string[] = [];
    const valores: number[] = [];

    let acumulado = 0;

    mapaDatas.forEach((valor, data) => {
        acumulado += valor;

        labels.push(data.substring(8, 10));
        valores.push(acumulado);
    });

    return {
        labels: labels.length ? labels : ["0"],
        datasets: [
            {
                data: valores.length ? valores : [0],
                color: (opacity = 1) =>
                    `${cor}${opacity})`,
                strokeWidth: 2,
            },
        ],
    };
}

export function useEstatisticas(mes?: number, ano?: number) {
    const [contas, setContas] = useState<any[]>([]);
    const [carregandoContas, setCarregandoContas] = useState(true);

    const {
        transacoes: transacoesFiltradas,
        despesas: despesasFiltradas,
        receitas: receitasFiltradas,
        totais,
        carregando: carregandoTransacoes,
    } = useTransacoesFiltradas({
        mes,
        ano,
    });

    const recarregar = useCallback(() => {
        setCarregandoContas(true);

        Accounts.list()
            .then((dados) => {
                setContas(dados);
            })
            .catch(() => {
                setContas([]);
            })
            .finally(() => {
                setCarregandoContas(false);
            });
    }, []);

    useEffect(() => {
        recarregar();

        return onDataChanged(recarregar);
    }, [recarregar]);

    const distribuicaoContas = useMemo(() => {
        return contas.map((conta) => ({
            nome: conta.label,
            valor: conta.balance || 0,
            cor: conta.color || COLORS.primary,
            corLegenda: COLORS.darkBackground,
            tamanhoFonteLegenda: 14,
        }));
    }, [contas]);

    const gastosCategorias = useMemo(() => {
        const mapa = new Map();

        despesasFiltradas.forEach((t) => {
            if (!t.categoria) return;

            const chave = t.categoria.value || t.categoria.label;

            const atual = mapa.get(chave);

            if (atual) {
                atual.valor += t.valor || 0;
            } else {
                mapa.set(chave, {
                    nome: t.categoria.label,
                    valor: t.valor || 0,
                    cor:
                        CATEGORY_COLORS[
                        t.categoria.label as keyof typeof CATEGORY_COLORS
                        ] || COLORS.gray,
                    corLegenda: COLORS.darkBackground,
                    tamanhoFonteLegenda: 14,
                });
            }
        });

        return Array.from(mapa.values());
    }, [despesasFiltradas]);

    const saldoAcumulado = useMemo(() => {
        return gerarGraficoAcumulado(
            transacoesFiltradas,
            (t) =>
                t.tipo === "receita"
                    ? t.valor || 0
                    : -(t.valor || 0),
            "rgba(156, 255, 25, "
        );
    }, [transacoesFiltradas]);

    const despesaAcumulado = useMemo(() => {
        return gerarGraficoAcumulado(
            despesasFiltradas,
            (t) => t.valor || 0,
            "rgba(167, 2, 5, "
        );
    }, [despesasFiltradas]);

    // NOVO: Receitas acumuladas (mesma lógica da despesa)
    const receitasAcumulado = useMemo(() => {
        return gerarGraficoAcumulado(
            receitasFiltradas,
            (t) => t.valor || 0,
            "rgba(31, 122, 61, " // Cor verde para receitas
        );
    }, [receitasFiltradas]);

    const receitasDespesas = useMemo(() => {
        const mapa = new Map();

        transacoesFiltradas.forEach((t) => {
            const data = t.data;

            if (!mapa.has(data)) {
                mapa.set(data, {
                    receitas: 0,
                    despesas: 0,
                });
            }

            const item = mapa.get(data);

            if (t.tipo === "receita") {
                item.receitas += t.valor || 0;
            } else {
                item.despesas += t.valor || 0;
            }
        });

        const datas = Array.from(mapa.keys()).sort();

        return {
            labels: datas.map((d) => d.substring(8, 10)),
            datasets: [
                {
                    data: datas.map((d) => mapa.get(d).receitas),
                    color: (opacity = 1) =>
                        `rgba(31, 122, 61, ${opacity})`,
                    strokeWidth: 2,
                },
                {
                    data: datas.map((d) => mapa.get(d).despesas),
                    color: (opacity = 1) =>
                        `rgba(255, 107, 107, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
            legenda: ["Receitas", "Despesas"],
        };
    }, [transacoesFiltradas]);

    return {
        carregando: carregandoContas || carregandoTransacoes,
        recarregar,

        transacoes: transacoesFiltradas,
        totais,
        distribuicaoContas,
        gastosCategorias,
        saldoAcumulado,
        despesaAcumulado,
        receitasAcumulado, // <-- NOVO: retornando a progressão de receitas
        receitasDespesas,
    };
}