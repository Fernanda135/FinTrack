import {
    transacoes,
    categories,
    contas,
} from "@/data/data";

export function useTransacoes() {

    const transacoesFormatadas = transacoes.map((item) => {

        const categoria = categories.find(
            (cat) => cat.id === item.categoriaId
        );

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