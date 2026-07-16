import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { useCategorias } from "@/hooks/useCategorias";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";
import EmptyCont from "./EmptyCont";

export default function GastCateg() {

    const { mesAtual, anoAtual, carregando } = useDashboard();
    const { categoriasComPorcentagem, totalGastos } = useCategorias({ mes: mesAtual, ano: anoAtual });

    if (totalGastos === 0 || categoriasComPorcentagem.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Gastos por categoria</Text>
                    <Link href={"/Categorias"} style={styles.link}>Ver tudo</Link>
                </View>

                <EmptyCont 
                titulo="Nenhum gasto registrado esse mês"
                texto="Adicione suas primeiras despesas do mês para ver os gastos por categoria"
                />
            </View>
        );
    }

    const categorias = [...categoriasComPorcentagem]
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

    const total = categorias.reduce((sum, item) => sum + item.valor, 0);
    const colors = [COLORS.primary, COLORS.gray, COLORS.black];
    const radius = 40;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Gastos por categoria</Text>
                <Link href={"/Categorias"} style={styles.link}>Ver tudo</Link>
            </View>

            <View style={styles.categoryCard}>
                
                <View style={styles.chartContainer}>
                    <Svg width={110} height={110} viewBox="0 0 100 100">
                        {categorias.map((item, index) => {
                            const percentage = item.valor / total;
                            const strokeDashoffset = circumference * (1 - percentage);
                            const rotation = cumulativePercentage * 360;

                            cumulativePercentage += percentage;

                            return (
                                <Circle
                                    key={item.id}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    originX="50"
                                    originY="50"
                                    rotation={rotation - 90}
                                />
                            );
                        })}
                    </Svg>
                    
                    <View style={styles.chartCenter}>
                        <Text style={styles.chartTotal}>{formatCurrency(total)}</Text>
                    </View>
                </View>

                <View style={styles.legendContainer}>
                    {categorias.map((item, index) => (
                        <View key={item.id} style={styles.legendItem}>
                            <View
                                style={[
                                    styles.legendColor,
                                    { backgroundColor: colors[index % colors.length] }
                                ]}
                            />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendText} numberOfLines={1}>
                                    {item.label}
                                </Text>
                                <Text style={styles.legendPercent}>
                                    {item.porcentagem}%
                                </Text>
                            </View>
                            <Text style={styles.legendValue}>
                                {formatCurrency(item.valor)}
                            </Text>
                        </View>
                    ))}
                    
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        marginTop: 10,
        width: "100%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        width: "100%",
        marginTop: 20,
        paddingHorizontal: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        letterSpacing: 0.3,
    },
    link: {
        fontSize: 14,
        color: COLORS.gray,
        fontWeight: "500",
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    categoryCard: {
        width: "100%",
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        borderRadius: 12,
        padding: 20,
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    chartContainer: {
        width: 110,
        height: 110,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        flexShrink: 0,
    },
    chartCenter: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    chartTotal: {
        fontSize: 13,
        fontWeight: "bold",
        color: COLORS.black,
        textAlign: "center",
    },
    legendContainer: {
        flex: 1,
        marginLeft: 16,
        gap: 12,
        justifyContent: "center",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 2,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 50,
        flexShrink: 0,
    },
    legendTextContainer: {
        flex: 1,
        minWidth: 0,
    },
    legendText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.black,
        letterSpacing: 0.2,
    },
    legendPercent: {
        fontSize: 11,
        color: COLORS.gray,
        marginTop: 1,
        letterSpacing: 0.1,
    },
    legendValue: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.black,
        flexShrink: 0,
        marginLeft: 4,
    },
});