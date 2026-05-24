export function useOrcamentos() {

    const getPorcentagem = (
        gasto: number,
        limite: number
    ) => {
        return Math.round((gasto / limite) * 100);
    };

    const getColor = (percentage: number) => {
        if (percentage < 80) {
            return "#1F7A1F";
        }

        if (percentage < 100) {
            return "#D8A300";
        }

        return "#B00000";
    };

    return {
        getPorcentagem,
        getColor,
    };
}