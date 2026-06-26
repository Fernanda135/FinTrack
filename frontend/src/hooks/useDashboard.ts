import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "@/api/endpoints";
import { onDataChanged } from "@/utils/events";
import { useTransacoesFiltradas } from "./useTransacoesFiltradas";
import { useFiltroMes } from "./useFiltroMes";

interface UseDashboardProps {
    mesInicial?: number;
    anoInicial?: number;
    aoMudarMes?: (ano: number, mes: number) => void;
}

export function useDashboard({
    mesInicial,
    anoInicial,
    aoMudarMes
}: UseDashboardProps = {}) {
    const [dados, setDados] = useState({
        saldoTotal: 0,
        gastoTotal: 0,
        receitaTotal: 0,
        gastoOrcamentoTotal: 0,
        limiteOrcamentoTotal: 0,
        orcamentosAtivos: 0,
        ultimasTransacoes: [] as any[],
    });

    const [carregando, setCarregando] = useState(true);

    const {
        mesAtual,
        anoAtual,
        exibicaoMes,
        temMesAnterior,
        temProximoMes,
        mesAnterior,
        proximoMes
    } = useFiltroMes({
        transacoes: dados.ultimasTransacoes,
        mesInicial,
        anoInicial,
        aoMudarMes
    });

    const {
        transacoes: transacoesDoMes,
        totais: totaisDoMes,
        carregando: carregandoTransacoes
    } = useTransacoesFiltradas({
        mes: mesAtual,
        ano: anoAtual
    });

    const recarregar = useCallback(() => {
        setCarregando(true);

        Dashboard.summary()
            .then(d => {
                setDados({
                    ...d,
                    ultimasTransacoes: d.ultimasTransacoes ?? []
                });
            })
            .catch(() => {
                setDados({
                    saldoTotal: 0,
                    gastoTotal: 0,
                    receitaTotal: 0,
                    gastoOrcamentoTotal: 0,
                    limiteOrcamentoTotal: 0,
                    orcamentosAtivos: 0,
                    ultimasTransacoes: []
                });
            })
            .finally(() => {
                setCarregando(false);
            });

    }, []);

    useEffect(() => {
        recarregar();

        return onDataChanged(recarregar);
    }, [recarregar]);

    return {
        ...dados,

        carregando: carregando || carregandoTransacoes,
        recarregar,

        mesAtual,
        anoAtual,
        exibicaoMes,
        temMesAnterior,
        temProximoMes,
        mesAnterior,
        proximoMes,

        transacoesDoMes,
        totaisDoMes,

        receitaTotal: totaisDoMes.totalReceitas,
        gastoTotal: totaisDoMes.totalDespesas
    };
}