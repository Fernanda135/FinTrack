import { categories } from "@/data/data";

export function useCategorias() {
    const categoriasGastos = categories.filter(
        (item) => item.value !== "renda"
    );

    const totalGastos = categoriasGastos.reduce(
        (total, item) => total + item.valor,
        0
    );

    const categoriasComPorcentagem = categoriasGastos
        .map((item) => ({
            ...item,
            porcentagem: Number(
                ((item.valor / totalGastos) * 100).toFixed(1)
            ),
            progresso: item.valor / totalGastos,
        }))
        .sort((a, b) => b.valor - a.valor);

    return {
        categoriasComPorcentagem,
        totalGastos,
    };
}