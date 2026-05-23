export const categories = [
    {
        id: "1",
        label: "Alimentação",
        value: "alimentacao",
        transacoes: 14,
        valor: 1620,
    },
    {
        id: "2",
        label: "Transporte",
        value: "transporte",
        transacoes: 9,
        valor: 480,
    },
    {
        id: "3",
        label: "Moradia",
        value: "moradia",
        transacoes: 3,
        valor: 2300,
    },
];

export const contas = [
    {
        id: "1",
        label: "Nubank",
        value: "nubank",
        tipo: "Conta Corrente",
        saldo: 3431.5,
        cor: "#8A05BE",
    },
    {
        id: "2",
        label: "Banco do Brasil",
        value: "banco_brasil",
        tipo: "Conta Corrente",
        saldo: 5120.9,
        cor: "#F7D117",
    },
];

export const orcamentos = [
    {
        id: 1,
        categoriaId: "1",
        title: "Alimentação",
        descricao:
            "Controle dos gastos com mercado, delivery e restaurantes.",
        gasto: 968.5,
        limite: 1200,
    },
    {
        id: 2,
        categoriaId: "2",
        title: "Transporte",
        descricao:
            "Despesas com combustível, Uber e transporte público.",
        gasto: 626.6,
        limite: 600,
    },
];

export const transacoes = [
    {
        id: "1",
        titulo: "Salário",
        categoriaId: "9",
        contaId: "1",
        data: "01 Jun",
        valor: 1621,
        tipo: "receita",
    },
    {
        id: "2",
        titulo: "Netflix",
        categoriaId: "4",
        contaId: "1",
        data: "05 Jun",
        valor: 39.9,
        tipo: "despesa",
    },
    {
        id: "3",
        titulo: "Supermercado",
        categoriaId: "1",
        contaId: "2",
        data: "03 Jun",
        valor: 287.5,
        tipo: "despesa",
    },
];

export const dashboard = {
    saldoTotal: contas.reduce(
        (total, conta) => total + conta.saldo,
        0
    ),

    gastoTotal: transacoes
        .filter((t) => t.tipo === "despesa")
        .reduce((total, t) => total + t.valor, 0),

    receitaTotal: transacoes
        .filter((t) => t.tipo === "receita")
        .reduce((total, t) => total + t.valor, 0),
};