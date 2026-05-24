import {
    contas,
    transacoes,
    orcamentos,
} from "@/data/data";

export function useDashboard() {

    const saldoTotal = contas.reduce(
        (total, conta) => total + conta.saldo,
        0
    );

    const gastoTotal = transacoes
        .filter((t) => t.tipo === "despesa")
        .reduce((total, t) => total + t.valor, 0);

    const receitaTotal = transacoes
        .filter((t) => t.tipo === "receita")
        .reduce((total, t) => total + t.valor, 0);

    const gastoOrcaTotal = orcamentos.reduce(
        (total, orc) => total + orc.gasto,
        0
    );

    const limiteOrcTotal = orcamentos.reduce(
        (total, orc) => total + orc.limite,
        0
    );

    return {
        saldoTotal,
        gastoTotal,
        receitaTotal,
        gastoOrcaTotal,
        limiteOrcTotal,
        ultimasTransacoes: transacoes.slice(0, 5),
        orcAtivos: orcamentos.length,
    };
}