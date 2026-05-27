import { COLORS } from "@/constants/colors";

export function useOrcamentos() {

    // calcula a porcentagem do gasto em relação ao limite
    const getPorcentagem = (
        gasto: number,
        limite: number
    ) => {
        return Math.round((gasto / limite) * 100);
    };

    const getColor = (percentage: number) => {
        if (percentage < 80) {
            return COLORS.progressGreen;
        }

        if (percentage < 100) {
            return COLORS.warning;
        }

        return COLORS.error;
    };

    return {
        getPorcentagem,
        getColor,
    };
}