import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { categories } from "@/data/data";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";

export default function GastCateg() {

    const categorias = [...categories]
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

    const total = categorias.reduce((sum, item) => sum + item.valor, 0);
    const colors = [COLORS.black, COLORS.primary, COLORS.gray];
    const radius = 38;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>Gastos por categoria</Text>
                <Link href={"/Categorias"} style={styles.link} >Ver tudo</Link>
            </View>

            <View style={styles.categoryCard}>
                
                {/* GRÁFICO COM TOP 3 CATEGORIAS */}
                <View style={styles.chartContainer}>
                    <Svg width={110} height={110}>
                        {categorias.map((item, index) => {

                            const percentage =
                                item.valor / total;

                            const strokeDashoffset =
                                circumference *
                                (1 - percentage);

                            const rotation =
                                cumulativePercentage * 360;

                            cumulativePercentage +=
                                percentage;

                            return (
                                <Circle
                                    key={item.id}
                                    cx="55"
                                    cy="55"
                                    r={radius}
                                    stroke={colors[index]}
                                    strokeWidth={strokeWidth}
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    origin="55,55"
                                    rotation={rotation - 90}
                                />
                            );
                        })}
                    </Svg>
                </View>

                <View style={styles.legendContainer}>
                    {categorias.map((item, index) => (
                        <View key={item.id} style={styles.legendItem} >
                            <View
                                style={[styles.legendColor,
                                {
                                    backgroundColor:
                                        colors[index],
                                },
                                ]}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.legendText}>{item.label}</Text>
                            </View>
                            <Text style={styles.legendValue} >{formatCurrency(item.valor)}</Text>

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
        width: 120,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    legendContainer: {
        flex: 1,
        marginLeft: 10,
        gap: 14,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 50,
        marginRight: 10,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.black,
    },
    legendValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: COLORS.black,
    },
});