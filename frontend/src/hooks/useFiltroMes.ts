import { useState, useMemo, useCallback } from "react";

interface UseFiltroMesProps {
    transacoes?: { data: string }[];
    mesInicial?: number;
    anoInicial?: number;
    aoMudarMes?: (ano: number, mes: number) => void;
}

const NOMES_MESES = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL",
    "MAIO", "JUNHO", "JULHO", "AGOSTO",
    "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

export function useFiltroMes({
    transacoes = [],
    mesInicial = new Date().getMonth(),
    anoInicial = new Date().getFullYear(),
    aoMudarMes
}: UseFiltroMesProps = {}) {

    const [dataAtual, setDataAtual] = useState(
        new Date(anoInicial, mesInicial, 1)
    );

    const mesAtual = dataAtual.getMonth();
    const anoAtual = dataAtual.getFullYear();


    const temMesAnterior = useMemo(() => {
        const mes = mesAtual === 0 ? 11 : mesAtual - 1;
        const ano = mesAtual === 0 ? anoAtual - 1 : anoAtual;

        return transacoes.some(t => {
            const data = new Date(t.data);
            return data.getMonth() === mes &&
                data.getFullYear() === ano;
        });
    }, [transacoes, mesAtual, anoAtual]);


    const temProximoMes = useMemo(() => {
        const mes = mesAtual === 11 ? 0 : mesAtual + 1;
        const ano = mesAtual === 11 ? anoAtual + 1 : anoAtual;

        return transacoes.some(t => {
            const data = new Date(t.data);
            return data.getMonth() === mes &&
                data.getFullYear() === ano;
        });
    }, [transacoes, mesAtual, anoAtual]);


    const mesAnterior = useCallback(() => {
        if (!temMesAnterior) return;

        const novaData = new Date(dataAtual);
        novaData.setMonth(novaData.getMonth() - 1);

        setDataAtual(novaData);
        aoMudarMes?.(
            novaData.getFullYear(),
            novaData.getMonth()
        );
    }, [dataAtual, temMesAnterior, aoMudarMes]);


    const proximoMes = useCallback(() => {
        if (!temProximoMes) return;

        const novaData = new Date(dataAtual);
        novaData.setMonth(novaData.getMonth() + 1);

        setDataAtual(novaData);
        aoMudarMes?.(
            novaData.getFullYear(),
            novaData.getMonth()
        );
    }, [dataAtual, temProximoMes, aoMudarMes]);


    return {
        dataAtual,
        mesAtual,
        anoAtual,
        exibicaoMes: `${NOMES_MESES[mesAtual]} ${anoAtual}`,
        temMesAnterior,
        temProximoMes,
        mesAnterior,
        proximoMes
    };
}