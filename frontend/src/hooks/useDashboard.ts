import {
    contas,
    transacoes,
    orcamentos,
} from "@/data/data";

export function useDashboard() {

    // calcula o saldo total de todas as contas
    const saldoTotal = contas.reduce(
        (total, conta) => total + conta.saldo,
        0
    );

    // calcula o gasto total de todas as contas
    const gastoTotal = transacoes
        .filter((t) => t.tipo === "despesa")
        .reduce((total, t) => total + t.valor, 0);

    // calcula a receita total de todas as contas
    const receitaTotal = transacoes
        .filter((t) => t.tipo === "receita")
        .reduce((total, t) => total + t.valor, 0);

    // calcula o gasto total de todas os orçamentos
    const gastoOrcaTotal = orcamentos.reduce(
        (total, orc) => total + orc.gasto,
        0
    );

    // calcula o limite total de todas os orçamentos
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
        ultimasTransacoes: transacoes.slice(0, 5),  // separa as cinco últimas transações
        orcAtivos: orcamentos.length,   // quantidade de orçamentos
    };
}