export function formatCurrency(value?: number | null) {
    const amount = typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

/**
 * Parse a BR-formatted money string (e.g. "R$ 1.234,56") back into a number.
 * Strips everything except digits and the decimal comma, then normalises the
 * comma to a dot. Returns 0 for empty/invalid input.
 */
export function parseMoney(value?: string | null): number {
    if (!value) return 0;
    const normalized = value.replace(/[^\d,]/g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
}