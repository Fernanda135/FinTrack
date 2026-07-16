import {
    StyleSheet,
    Text,
    View,
    ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
    Utensils,
    Bus,
    Home,
    CreditCard,
    TrendingUp,
    Activity,
    Gamepad2,
    GraduationCap,
    Circle,
} from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import { useCategorias } from "@/hooks/useCategorias";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";
import EmptyCont from "@/components/EmptyCont";



export function getCategoryIcon(category: string, size: number, color: string) {
    const icons: Record<string, React.ReactNode> = {
        'Alimentação': <Utensils size={size} color={color} />,
        'Transporte': <Bus size={size} color={color} />,
        'Moradia': <Home size={size} color={color} />,
        'Assinaturas': <CreditCard size={size} color={color} />,
        'Renda': <TrendingUp size={size} color={color} />,
        'Saúde': <Activity size={size} color={color} />,
        'Lazer': <Gamepad2 size={size} color={color} />,
        'Educação': <GraduationCap size={size} color={color} />,
    };
    return icons[category] || <Circle size={size} color={color} />;
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
    return colors[category] || '#6C757D';
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
    return colors[category] || '#6C757D';
}



export default function Categorias() {

    const { mesAtual, anoAtual, carregando } = useDashboard();

    const { categoriasComPorcentagem, totalGastos } = useCategorias({ mes: mesAtual, ano: anoAtual });

    const categoriasOrdenadas = [...categoriasComPorcentagem].sort((a, b) => b.valor - a.valor);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >

                        <View style={styles.header}>
                            <Text style={styles.title}>Categorias</Text>
                        </View>

                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total de gastos do mês</Text>
                            {!carregando ? (
                                <Text style={styles.totalValue}>
                                    {formatCurrency(totalGastos)}
                                </Text>
                            ) : (
                                <Text style={styles.totalValue}>---</Text>
                            )}
                        </View>

                        {totalGastos === 0 || categoriasOrdenadas.length === 0 ? (
                            <EmptyCont
                                titulo="Nenhum gasto registrado esse mês"
                                texto="Adicione suas primeiras despesas do mês para ver os gastos por categoria"
                            />
                        ) : (
                            <View style={styles.cardsContainer}>
                                {categoriasOrdenadas.map((item) => (
                                    <View key={item.id} style={styles.card}>
                                        <View style={styles.cardTop}>
                                            <View style={styles.leftContent}>
                                                <View style={[
                                                    styles.icon,
                                                    { backgroundColor: getCategoryColor(item.label) }
                                                ]}>
                                                    {getCategoryIcon(item.label, 20, COLORS.white)}
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
        marginBottom: 20,
    },
    title: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: "bold",
    },
    totalContainer: {
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    totalLabel: {
        color: COLORS.gray,
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 6,
        fontWeight: "600",
        letterSpacing: 1,
    },
    totalValue: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: "bold",
    },
    cardsContainer: {
        gap: 12,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    icon: {
        width: 44,
        height: 44,
        borderRadius: 12,
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
        backgroundColor: '#E9ECEF',
        borderRadius: 999,
        overflow: "hidden",
    },
    progress: {
        height: "100%",
        borderRadius: 999,
    },
    percent: {
        color: COLORS.gray,
        fontSize: 12,
        fontWeight: "600",
        width: 45,
        textAlign: "right",
    },
});