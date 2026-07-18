import { Text, View, StyleSheet } from "react-native";
import { Link } from "expo-router";

import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { COLORS } from "@/constants/colors";
import EmptyCont from "./EmptyCont";

import { SquareArrowUp, SquareArrowDown } from "lucide-react-native";

export default function UltTransac() {

    const { transacoesDoMes } = useDashboard();
    const recentTransactions = transacoesDoMes.slice(0, 5);

    if (transacoesDoMes.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Últimas transações</Text>
                    <Link href={"/Transferencias"} style={styles.link}>Ver tudo</Link>
                </View>
                
                <EmptyCont
                    titulo="Nenhuma transação registrada esse mês"
                    texto="Comece a registrar suas receitas e despesas para acompanhar seu fluxo financeiro mensal"
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Últimas transações</Text>
                <Link href={"/Transferencias"} style={styles.link}>Ver tudo</Link>
            </View>

            <View style={styles.transactionsList}>
                {recentTransactions.map((item, index) => {
                    const isLast = index === recentTransactions.length - 1;
                    const Icon = item.tipo === "receita" ? SquareArrowDown : SquareArrowUp;
                    const iconColor = item.tipo === "receita" ? COLORS.success : COLORS.danger;

                    return (
                        <View
                            key={item.id}
                            style={[
                                styles.transactionCard,
                                !isLast && styles.transactionCardBorder
                            ]}
                        >
                            <View style={styles.transactionLeft}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: item.tipo === "receita" ? COLORS.chart_income + '15' : COLORS.chart_expense + '15' }
                                ]}>
                                    <Icon
                                        size={24}
                                        color={iconColor}
                                    />
                                </View>

                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionTitle} numberOfLines={1}>
                                        {item.titulo}
                                    </Text>
                                    <View style={styles.transactionMeta}>
                                        <Text style={styles.transactionCategory}>
                                            {item.categoria?.label}
                                        </Text>
                                        <Text style={styles.transDate}>
                                            {item.conta?.label} | {formatDate(item.data)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.transactionRight}>
                                <Text style={[
                                    styles.transactionValue,
                                    { color: item.tipo === "receita" ? COLORS.success : COLORS.danger },
                                ]}>
                                    {item.tipo === "receita" ? "+" : "-"}
                                    {formatCurrency(item.valor)}
                                </Text>
                            </View>
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
        paddingHorizontal: 24,
        paddingVertical: 10,
        width: "100%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        width: "100%",
        paddingHorizontal: 4,
        marginTop: 20,
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
    transactionsList: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    transactionCard: {
        width: "100%",
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.white,
    },
    transactionCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderGray,
    },
    transactionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 12,
        minWidth: 0,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        flexShrink: 0,
    },
    transactionInfo: {
        flex: 1,
        minWidth: 0,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.black,
        letterSpacing: 0.2,
        marginBottom: 3,
    },
    transactionMeta: {
        flexWrap: "wrap",
    },
    transactionCategory: {
        fontSize: 12,
        color: COLORS.gray,
        letterSpacing: 0.1,
    },
    transactionDot: {
        fontSize: 12,
        color: COLORS.gray,
        marginHorizontal: 6,
    },
    transDate: {
        fontSize: 11,
        color: COLORS.gray,
        letterSpacing: 0.1,
    },
    transactionRight: {
        flexShrink: 0,
        marginLeft: 8,
    },
    transactionValue: {
        fontSize: 16,
        fontWeight: "bold",
    },
});