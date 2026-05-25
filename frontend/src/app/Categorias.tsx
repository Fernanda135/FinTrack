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

                        {/* CARDS DE CATEGORIAS */}
                        <View style={styles.cardsContainer}>
                            {categoriasComPorcentagem.map((item) => (
                                <View key={item.id} style={styles.card} >
                                    <View style={styles.cardTop}>
                                        <View style={styles.leftContent}>
                                            <View style={styles.icon} />
                                            <View>
                                                <Text style={styles.cardCateg}>{item.label}</Text>
                                                <Text style={styles.cardQtd}>{item.transacoes} transações</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.cardValue}> {formatCurrency(item.valor)}</Text>
                                    </View>

                                    <View style={styles.progressArea}>
                                        <View style={styles.progressBar}>
                                            <View style={[
                                                styles.progress,
                                                { width: `${item.progresso * 100}%` }
                                            ]}
                                            />
                                        </View>
                                        <Text style={styles.percent}>{item.porcentagem}%</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <BottomNav />
            </SafeAreaView>
        </SafeAreaProvider>
    );
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
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: COLORS.lightGray,
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
        height: 5,
        backgroundColor: COLORS.borderGray,
        borderRadius: 999,
        overflow: "hidden",
    },
    progress: {
        height: "100%",
        backgroundColor: COLORS.progressGreen,
        borderRadius: 999,
    },
    percent: {
        color: "#AAAAAA",
        fontSize: 11,
        fontWeight: "600",
        width: 40,
        textAlign: "right",
    },
});
