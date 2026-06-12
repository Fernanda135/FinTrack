import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { COLORS } from "@/constants/colors";


export default function UltTransac() {

    const { ultimasTransacoes } = useDashboard();

    if (ultimasTransacoes.length === 0) {
            return (
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Gastos por categoria</Text>
                        <Link href={"/Categorias"} style={styles.link}>Ver tudo</Link>
                    </View>
    
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
                        <Text style={styles.emptyText}>
                            Comece a registrar suas receitas e despesas para acompanhar seu fluxo financeiro
                        </Text>
                    </View>
                </View>
            );
        }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Últimas transações</Text>
                <Link href={"/Transferencias"} style={styles.link}>Ver tudo</Link>
            </View>

            <View style={{ width: "100%" }}>{ultimasTransacoes.map((item) => {
                return (
                    <View key={item.id} style={styles.transactionCard}>
                        <View>
                            <Text style={styles.transactionTitle}>{item.titulo}</Text>
                            <Text style={styles.transactionCategory}>{item.categoria?.label}</Text>
                            <Text style={styles.transDate}>{item.conta?.label} | {formatDate(item.data)}</Text>
                        </View>

                        <Text style={[
                            styles.transactionValue,
                            { color: item.tipo === "receita" ? COLORS.success : COLORS.danger },
                        ]} >
                            {item.tipo === "receita" ? "+" : "-"}
                            {formatCurrency(item.valor)}
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
        color: COLORS.black,
    },
    link: {
        fontSize: 14,
        color: COLORS.gray,
    },
    transactionCard: {
        width: "100%",
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        borderRadius: 10,
        marginBottom: 10,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.white,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.black,
    },
    transactionCategory: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 4,
    },
    transactionValue: {
        fontSize: 16,
    },
    transDate: {
        fontSize: 11,
        color: COLORS.gray,
        marginTop: 4,
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
