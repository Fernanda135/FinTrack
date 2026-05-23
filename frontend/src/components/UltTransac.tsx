import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

import {
    contas,
    categories,
    transacoes,
    orcamentos,
    dashboard,
} from "@/data/data";

export default function UltTransac() {

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Text style={styles.title}>
                    Últimas transações
                </Text>

                <Link
                    href={"/Transferencias"}
                    style={styles.link}
                >
                    Ver tudo
                </Link>
            </View>

            <View style={{ width: "100%" }}>

                {dashboard.ultimasTransacoes.map((item) => {
                    const categoria = categories.find(
                        (cat) => cat.id === item.categoriaId
                    );

                    return (
                        <View
                            key={item.id}
                            style={styles.transactionCard}
                        >

                            <View>
                                <Text style={styles.transactionTitle}>
                                    {item.titulo}
                                </Text>

                                <Text style={styles.transactionCategory}>
                                    {categoria?.label}
                                </Text>
                            </View>

                            <Text
                                style={[
                                    styles.transactionValue,
                                    {
                                        color:
                                            item.tipo === "receita"
                                                ? "#116e1f"
                                                : "#a70205",
                                    },
                                ]}
                            >
                                {item.tipo === "receita"
                                    ? "+"
                                    : "-"}

                                {item.valor.toLocaleString(
                                    "pt-BR",
                                    {
                                        style: "currency",
                                        currency: "BRL",
                                    }
                                )}
                            </Text>

                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        width: "100%",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1A1A1A",
    },
    link: {
        fontSize: 14,
        color: "#AAAAAA",
    },
    transactionCard: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#F3F4F6",
        borderRadius: 10,
        marginBottom: 10,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1A1A1A",
    },
    transactionCategory: {
        fontSize: 12,
        color: "#AAAAAA",
        marginTop: 4,
    },
    transactionValue: {
        fontSize: 16,
    },
});
