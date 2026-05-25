export function formatCurrency(value?: number | null) {
    const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}