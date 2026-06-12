import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { useCategorias } from "@/hooks/useCategorias";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";

export default function GastCateg() {

    const { categoriasComPorcentagem, totalGastos } = useCategorias();

    // Verifica se não há gastos
    if (totalGastos === 0 || categoriasComPorcentagem.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Gastos por categoria</Text>
                    <Link href={"/Categorias"} style={styles.link}>Ver tudo</Link>
                </View>

                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Nenhum gasto registrado</Text>
                    <Text style={styles.emptyText}>
                        Adicione suas primeiras despesas para ver os gastos por categoria
                    </Text>
                </View>
            </View>
        );
    }

    // Pega apenas as 3 categorias com maiores gastos
    const categorias = [...categoriasComPorcentagem]
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

    const total = categorias.reduce((sum, item) => sum + item.valor, 0);
    const colors = [COLORS.primary, COLORS.gray, COLORS.black];
    const radius = 38;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Gastos por categoria</Text>
                <Link href={"/Categorias"} style={styles.link}>Ver tudo</Link>
            </View>

            <View style={styles.categoryCard}>
                
                {/* GRÁFICO COM TOP 3 CATEGORIAS */}
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
                    
                    {/* Texto central do gráfico */}
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
                            <View style={{ flex: 1 }}>
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
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        width: "100%",
        marginTop: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
    },
    link: {
        fontSize: 14,
        color: COLORS.gray,
    },
    categoryCard: {
        width: "100%",
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        borderRadius: 10,
        padding: 18,
        backgroundColor: COLORS.white,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    chartContainer: {
        width: 110,
        height: 110,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    chartCenter: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    chartTotal: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.black,
    },
    legendContainer: {
        flex: 1,
        marginLeft: 10,
        gap: 10,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 50,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.black,
    },
    legendPercent: {
        fontSize: 10,
        color: COLORS.gray,
        marginTop: 2,
    },
    legendValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.black,
    },
    otherContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderGray,
    },
    otherText: {
        fontSize: 11,
        color: COLORS.gray,
        textAlign: "center",
    },
    emptyContainer: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 30,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.borderGray,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.black,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 12,
        color: COLORS.gray,
        textAlign: "center",
        lineHeight: 18,
    },
});