import { useCallback, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Plus, Trash2, CreditCard, Wallet, PiggyBank, Building2, TrendingUp, MoreHorizontal, SquarePen } from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import NovaContaModal from "@/components/NovaContaModal";
import EditarContaModal from "@/components/EditarContaModal";
import { Accounts } from "@/api/endpoints";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { onDataChanged, emitDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showSuccess } from "@/components/Toast/toast";



const TIPO_LABELS: Record<string, string> = {
    CONTA_CORRENTE: "Conta Corrente",
    CONTA_POUPANCA: "Conta Poupança",
    CARTEIRA: "Carteira",
    CARTAO_CREDITO: "Cartão de Crédito",
    INVESTIMENTOS: "Investimentos",
    OUTROS: "Outros",
};

const TIPO_ICONS: Record<string, any> = {
    CONTA_CORRENTE: Building2,
    CONTA_POUPANCA: PiggyBank,
    CARTEIRA: Wallet,
    CARTAO_CREDITO: CreditCard,
    INVESTIMENTOS: TrendingUp,
    OUTROS: MoreHorizontal,
};


export default function Contas() {

    const { saldoTotal } = useDashboard();

    const [modalVisible, setModalVisible] = useState(false);
    const [contas, setContas] = useState<any[]>([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [contaSelecionada, setContaSelecionada] = useState<any>(null);

    const reload = useCallback(() => {
        Accounts.list()
            .then(setContas)
            .catch(() => setContas([]));
    }, []);

    useEffect(() => {
        reload();
        return onDataChanged(reload);
    }, [reload]);

    const handleDelete = async (id: string, label: string) => {
        Alert.alert(
            "Excluir conta",
            `Tem certeza que deseja excluir a conta "${label}"?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await Accounts.remove(id);
                            showSuccess("Conta excluída com sucesso!");
                            emitDataChanged();
                        } catch (e: any) {
                            showError(e?.message ?? "Não foi possível excluir a conta");
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = (conta: any) => {
        setContaSelecionada(conta);
        setEditModalVisible(true);
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >

                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Minhas Contas</Text>
                            </View>
                        </View>

                        <View style={styles.balanceContainer}>
                            <View>
                                <Text style={styles.subtitle}>Saldo total consolidado</Text>
                                <Text style={styles.totalBalance}>{formatCurrency(saldoTotal)}</Text>
                            </View>
                            <View style={styles.balanceBadge}>
                                <Text style={styles.balanceBadgeText}>
                                    {contas.length} {contas.length === 1 ? "conta" : "contas"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardsContainer}>
                            {contas.map((conta) => {
                                const IconComponent = TIPO_ICONS[conta.type] || MoreHorizontal;
                                const isNegative = conta.balance < 0;
                                
                                return (
                                    <View key={conta.id} style={[styles.card, { backgroundColor: conta.color }]}>
                                        <View style={styles.cardTop}>
                                            <View style={styles.leftContent}>
                                                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                                    <IconComponent size={20} color={COLORS.white} />
                                                </View>
                                                <View>
                                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                                        {conta.label}
                                                    </Text>
                                                    <Text style={styles.cardSubtitle}>
                                                        {TIPO_LABELS[conta.type] ?? conta.type}
                                                    </Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity 
                                                style={styles.deleteButton} 
                                                onPress={() => handleEdit(conta)}
                                            >
                                                <SquarePen size={18} color={COLORS.white} />
                                            </TouchableOpacity>
                                            
                                        </View>
                                        
                                        <View style={styles.line} />
                                        
                                        <View style={styles.cardBottom}>
                                            <Text style={[
                                                styles.balance,
                                                isNegative && styles.balanceNegative
                                            ]}>
                                                {formatCurrency(conta.balance)}
                                            </Text>

                                            <TouchableOpacity 
                                                style={styles.deleteButton}
                                                onPress={() => handleDelete(conta.id, conta.label)}
                                            >
                                                <Trash2 size={18} color={COLORS.white}/>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}

                            <TouchableOpacity 
                                style={styles.addButton} 
                                onPress={() => setModalVisible(true)}
                                activeOpacity={0.7}
                            >
                                <Plus size={32} color={COLORS.gray} />
                                <Text style={styles.addButtonText}>Adicionar nova conta</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>

                <BottomNav />

                <EditarContaModal
                    visible={editModalVisible}
                    onClose={() => {
                        setEditModalVisible(false);
                        setContaSelecionada(null);
                    }}
                    conta={contaSelecionada}
                />

                <NovaContaModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                />

            </SafeAreaView>
        </SafeAreaProvider>
    );
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 50,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 24,
        paddingTop: 30,
        marginBottom: 8,
    },
    title: {
        color: COLORS.black,
        fontSize: 28,
        fontWeight: "bold",
        letterSpacing: 0.3,
        marginBottom: 4,
    },
    subtitle: {
        color: COLORS.gray,
        fontSize: 13,
        fontWeight: "500",
        letterSpacing: 0.5,
    },
    addHeaderButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    balanceContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginBottom: 8,
    },
    totalBalance: {
        color: COLORS.black,
        fontSize: 34,
        fontWeight: "bold",
        letterSpacing: 0.5,
    },
    balanceBadge: {
        backgroundColor: COLORS.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    balanceBadgeText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 16,
        marginTop: 10,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
    cardSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 2,
        letterSpacing: 0.2,
    },
    deleteButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    line: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 16,
    },
    cardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    balance: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
    balanceNegative: {
        color: '#FF6B6B',
    },
    addButton: {
        height: 80,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.borderGray,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: COLORS.white,
        gap: 6,
        flexDirection: "row",
    },
    addButtonText: {
        color: COLORS.gray,
        fontSize: 15,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
});