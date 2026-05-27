import {
    transacoes,
    categories,
    contas,
} from "@/data/data";

export function useTransacoes() {

    const transacoesFormatadas = transacoes.map((item) => {

        // econtra e a categoria correspondente pelo id
        const categoria = categories.find(
            (cat) => cat.id === item.categoriaId
        );

        // econtra e a conta correspondente pelo id
        const conta = contas.find(
            (conta) => conta.id === item.contaId
        );

        return {
            ...item,
            categoria,
            conta,
        };
    });

    return {
        transacoes: transacoesFormatadas,
    };
}