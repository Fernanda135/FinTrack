import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";
import Svg, { Circle } from "react-native-svg";

import { categories } from "@/data/categories";

export default function GastCateg() {

    const categorias = [...categories]
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3);

    const total = categorias.reduce(
        (sum, item) => sum + item.valor,
        0
    );

    const colors = ["#1E1E1E", "#9CFF19", "#BDBDBD"];

    const radius = 38;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;

    let cumulativePercentage = 0;

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>
                    Gastos por categoria
                </Text>
                <Link
                    href={"/Categorias"}
                    style={styles.link}
                >
                    Ver tudo
                </Link>
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
                                    strokeLinecap="round"
                                    origin="55,55"
                                    rotation={rotation - 90}
                                />
                            );
                        })}
                    </Svg>
                </View>

                <View style={styles.legendContainer}>
                    {categorias.map((item, index) => (
                        <View
                            key={item.id}
                            style={styles.legendItem}
                        >

                            <View
                                style={[
                                    styles.legendDot,
                                    {
                                        backgroundColor:
                                            colors[index],
                                    },
                                ]}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.legendText}>
                                    {item.label}
                                </Text>
                            </View>
                            <Text style={styles.legendValue} >
                                {item.valor.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
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
        color: "#1A1A1A",
    },
    link: {
        fontSize: 14,
        color: "#AAAAAA",
    },
    categoryCard: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 18,
        padding: 18,
        backgroundColor: "#FFFFFF",
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
    chartCenter: {
        position: "absolute",
        width: 48,
        height: 48,
        borderRadius: 999,
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    centerText: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#1A1A1A",
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
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        marginRight: 10,
    },
    legendText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1A1A1A",
    },
    legendPercent: {
        fontSize: 10,
        color: "#777",
        marginTop: 2,
    },
    legendValue: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1A1A1A",
    },
});