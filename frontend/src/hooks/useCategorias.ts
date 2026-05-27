import { categories } from "@/data/data";

export function useCategorias() {

    // separa a renda das demais categorias de gastos
    const categoriasGastos = categories.filter(
        (item) => item.value !== "renda"
    );

    // calcula o gasto total das categorias
    const totalGastos = categoriasGastos.reduce(
        (total, item) => total + item.valor,
        0
    );

    // calcula a porcentagem de cada categoria em relação ao total
    const categoriasComPorcentagem = categoriasGastos
        .map((item) => ({
            ...item,
            porcentagem: Number(
                ((item.valor / totalGastos) * 100).toFixed(1)
            ),
            progresso: item.valor / totalGastos,
        }))
        .sort((a, b) => b.valor - a.valor); // organiza da maior para a menor

    return {
        categoriasComPorcentagem,
        totalGastos,
    };
}

console.log(categories)