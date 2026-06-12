import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

import BottomNav from "@/components/BottomNav";
import { useCategorias } from "@/hooks/useCategorias";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";

export default function Categorias() {
    const router = useRouter();
    const { categoriasComPorcentagem, totalGastos } = useCategorias();

    // Ordena por maior gasto
    const categoriasOrdenadas = [...categoriasComPorcentagem].sort((a, b) => b.valor - a.valor);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* HEADER */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()}>
                                <ArrowLeft size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                            <Text style={styles.title}>Categorias</Text>
                        </View>

                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total de gastos</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(totalGastos)}
                            </Text>
                        </View>

                        {/* MENSAGEM QUANDO NÃO HÁ GASTOS */}
                        {totalGastos === 0 || categoriasOrdenadas.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyTitle}>Nenhum gasto registrado</Text>
                                <Text style={styles.emptyText}>
                                    Comece a adicionar suas despesas para acompanhar seus gastos por categoria
                                </Text>
                            </View>
                        ) : (
                            /* CARDS DE CATEGORIAS */
                            <View style={styles.cardsContainer}>
                                {categoriasOrdenadas.map((item) => (
                                    <View key={item.id} style={styles.card}>
                                        <View style={styles.cardTop}>
                                            <View style={styles.leftContent}>
                                                <View style={[
                                                    styles.icon,
                                                    { backgroundColor: getCategoryColor(item.label) }
                                                ]}>
                                                </View>
                                                <View>
                                                    <Text style={styles.cardCateg}>{item.label}</Text>
                                                    <Text style={styles.cardQtd}>
                                                        {item.transacoes} {item.transacoes === 1 ? 'transação' : 'transações'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <Text style={styles.cardValue}>
                                                {formatCurrency(item.valor)}
                                            </Text>
                                        </View>

                                        <View style={styles.progressArea}>
                                            <View style={styles.progressBar}>
                                                <View
                                                    style={[
                                                        styles.progress,
                                                        { 
                                                            width: `${item.progresso * 100}%`,
                                                            backgroundColor: getCategoryProgressColor(item.label)
                                                        }
                                                    ]}
                                                />
                                            </View>
                                            <Text style={styles.percent}>{item.porcentagem}%</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </View>

                <BottomNav />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        'Alimentação': '#FF6B6B',
        'Transporte': '#4ECDC4',
        'Moradia': '#45B7D1',
        'Assinaturas': '#96CEB4',
        'Renda': '#FFEAA7',
        'Saúde': '#DDA0DD',
        'Lazer': '#98D8C8',
        'Educação': '#F7B731',
    };
    return colors[category] || COLORS.lightGray;
}

function getCategoryProgressColor(category: string): string {
    const colors: Record<string, string> = {
        'Alimentação': '#FF6B6B',
        'Transporte': '#4ECDC4',
        'Moradia': '#45B7D1',
        'Assinaturas': '#96CEB4',
        'Renda': '#FFEAA7',
        'Saúde': '#DDA0DD',
        'Lazer': '#98D8C8',
        'Educação': '#F7B731',
    };
    return colors[category] || COLORS.progressGreen;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    content: {
        flex: 1,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 35,
    },
    title: {
        color: COLORS.primary,
        fontSize: 32,
        fontWeight: "bold",
    },
    totalContainer: {
        marginBottom: 30,
    },
    totalLabel: {
        color: COLORS.gray,
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 6,
        fontWeight: "600",
    },
    totalValue: {
        color: COLORS.white,
        fontSize: 34,
        fontWeight: "bold",
    },
    cardsContainer: {
        gap: 16,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 16,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    icon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    iconText: {
        fontSize: 20,
    },
    cardCateg: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: "bold",
    },
    cardQtd: {
        color: COLORS.gray,
        fontSize: 11,
        marginTop: 2,
    },
    cardValue: {
        color: COLORS.black,
        fontSize: 18,
        fontWeight: "bold",
    },
    progressArea: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.borderGray,
        borderRadius: 999,
        overflow: "hidden",
    },
    progress: {
        height: "100%",
        borderRadius: 999,
    },
    percent: {
        color: "#AAAAAA",
        fontSize: 12,
        fontWeight: "600",
        width: 45,
        textAlign: "right",
    },
    emptyContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 10,
        padding: 40,
        alignItems: "center",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: "center",
        lineHeight: 20,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    addButtonText: {
        color: COLORS.white,
        fontWeight: "bold",
        fontSize: 14,
    },
});