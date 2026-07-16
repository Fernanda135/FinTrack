import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
    Alert,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Plus, X, Trash2, SquarePen } from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import NovoOrcamentoModal from "@/components/NovoOrcamentoModal";
import EditarOrcamentoModal from "@/components/EditarOrcamentoModal";
import { Budgets, Categories } from "@/api/endpoints";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { formatCurrency } from "@/utils/formatCurrency";
import { onDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showSuccess } from "@/components/Toast/toast";
import { getCategoryIcon } from "./Categorias";

export default function Orcamentos() {

    const {
        getGasto,
        getLimite,
        getDescricao,
        getCategoriaNome: getCategoriaNomeFromHook,
        obterPorcentagem,
        obterCor,
        carregando: carregandoOrcamentos
    } = useOrcamentos();

    const [modalVisible, setModalVisible] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<any | null>(null);
    const [novoModalVisible, setNovoModalVisible] = useState(false);
    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [deletando, setDeletando] = useState(false);
    const [editarModalVisible, setEditarModalVisible] = useState(false);
    const [orcamentoEditando, setOrcamentoEditando] = useState<any | null>(null);
    const [categorias, setCategorias] = useState<any[]>([]);

    const totais = useMemo(() => {
        let totalGasto = 0;
        let totalLimite = 0;

        orcamentos.forEach(item => {
            totalGasto += getGasto(item);
            totalLimite += getLimite(item);
        });

        return {
            gastoTotal: totalGasto,
            limiteTotal: totalLimite,
        };
    }, [orcamentos, getGasto, getLimite]);

    const getCategoriaNome = (orcamento: any) => {
        if (!orcamento) return "Sem categoria";

        const nome = getCategoriaNomeFromHook(orcamento);
        if (nome && nome !== "Sem categoria") return nome;

        if (orcamento.categoria?.label) return orcamento.categoria.label;
        if (orcamento.category?.label) return orcamento.category.label;

        const categoriaId = orcamento.categoriaId || orcamento.categoryId;
        if (categoriaId) {
            const categoria = categorias.find(c => c.id === categoriaId);
            if (categoria) {
                return categoria.label || categoria.name || "Sem categoria";
            }
        }

        return "Sem categoria";
    };

    const reload = useCallback(() => {
        Promise.all([
            Budgets.list(),
            Categories.list()
        ])
            .then(([budgetsData, categoriesData]) => {
                setOrcamentos(budgetsData || []);
                setCategorias(categoriesData || []);
            })
            .catch((error) => {
                console.error('Erro ao carregar:', error);
                setOrcamentos([]);
                setCategorias([]);
            });
    }, []);

    useEffect(() => {
        reload();
        return onDataChanged(reload);
    }, [reload]);

    const handleDeleteBudget = async () => {
        if (!orcamentoSelecionado) return;

        Alert.alert(
            "Excluir Orçamento",
            `Tem certeza que deseja excluir o orçamento "${orcamentoSelecionado.title}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        setDeletando(true);
                        try {
                            await Budgets.remove(orcamentoSelecionado.id);
                            showSuccess("Orçamento excluído com sucesso!");
                            setModalVisible(false);
                            reload();
                        } catch (error) {
                            showError("Não foi possível excluir o orçamento");
                            console.error(error);
                        } finally {
                            setDeletando(false);
                        }
                    },
                },
            ]
        );
    };

    const handleEdit = () => {
        setEditarModalVisible(true);
        setModalVisible(false);
    };

    if (carregandoOrcamentos) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Carregando orçamentos...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                >

                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Orçamentos</Text>
                            <Text style={styles.subtitle}>Controle seus gastos mensais</Text>
                        </View>

                        <View style={styles.cardsContainer}>
                            <View style={styles.topCard}>
                                <Text style={styles.topCardLabel}>Gasto</Text>
                                <Text style={styles.topCardValue}>{formatCurrency(totais.gastoTotal)}</Text>
                            </View>
                            <View style={styles.topCard}>
                                <Text style={styles.topCardLabel}>Limite</Text>
                                <Text style={styles.topCardValue}>{formatCurrency(totais.limiteTotal)}</Text>
                            </View>
                            <View style={styles.topCard}>
                                <Text style={styles.topCardLabel}>Orçamentos</Text>
                                <Text style={styles.topCardValue}>{orcamentos.length}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.listContainer}>
                        {orcamentos.map((item) => {
                            const gasto = getGasto(item);
                            const limite = getLimite(item);
                            const descricao = getDescricao(item);
                            const percentage = obterPorcentagem(gasto, limite);
                            const color = obterCor(percentage);
                            const isExceeded = percentage >= 100;

                            const iconElement = getCategoryIcon(item.title, 22, color);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.budgetCard}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        setOrcamentoSelecionado(item);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View style={styles.cardTop}>
                                        <View style={styles.leftArea}>
                                            <View style={[styles.iconPlaceholder, { backgroundColor: color + '20' }]}>
                                                {iconElement}
                                            </View>
                                            <View style={styles.textArea}>
                                                <Text style={styles.cardTitle}>{item.title}</Text>
                                                {descricao ? (
                                                    <Text style={styles.cardDescription} numberOfLines={1}>
                                                        {descricao}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>

                                        <View style={styles.infoArea}>
                                            <Text style={styles.value}>{formatCurrency(gasto)}</Text>
                                            <Text style={styles.limit}>de {formatCurrency(limite)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressLine}>
                                        <View
                                            style={[
                                                styles.progressBar,
                                                {
                                                    width: `${Math.min(percentage, 100)}%`,
                                                    backgroundColor: color,
                                                },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.percentContainer}>
                                            <Text
                                                style={[
                                                    styles.percent,
                                                    isExceeded && styles.percentExceeded
                                                ]}
                                            >
                                                {percentage}%
                                            </Text>
                                            {isExceeded && (
                                                <Text style={styles.exceededLabel}>Excedido</Text>
                                            )}
                                        </View>

                                        <View style={styles.footerRight}>
                                            <Text style={styles.details}>Ver detalhes</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => setNovoModalVisible(true)}
                            activeOpacity={0.7}
                        >
                            <Plus size={32} color={COLORS.gray} />
                            <Text style={styles.addButtonText}>Criar novo orçamento</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <BottomNav />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            {orcamentoSelecionado ? (
                                <>
                                    <View
                                        style={[
                                            styles.modalHeader,
                                            {
                                                backgroundColor: obterCor(
                                                    obterPorcentagem(
                                                        getGasto(orcamentoSelecionado),
                                                        getLimite(orcamentoSelecionado) || 1
                                                    )
                                                ),
                                            },
                                        ]}
                                    >
                                        <View style={styles.modalHeaderTop}>
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={() => setModalVisible(false)}
                                            >
                                                <X size={24} color={COLORS.white} />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={handleDeleteBudget}
                                                disabled={deletando}
                                            >
                                                <Trash2 size={22} color={COLORS.white} />
                                            </TouchableOpacity>
                                        </View>

                                        <View style={styles.modalIconContainer}>
                                            <View style={[styles.modalIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                                {getCategoryIcon(
                                                    orcamentoSelecionado.title,
                                                    32,
                                                    COLORS.white
                                                )}
                                            </View>
                                        </View>

                                        <Text style={styles.modalTitle}>{orcamentoSelecionado.title}</Text>
                                        <Text style={styles.modalSubtitle}>{getCategoriaNome(orcamentoSelecionado)}</Text>
                                        
                                        {getDescricao(orcamentoSelecionado) ? (
                                            <Text style={styles.modalDescription}>
                                                {getDescricao(orcamentoSelecionado)}
                                            </Text>
                                        ) : null}
                                    </View>

                                    <View style={styles.modalBody}>
                                        <View style={styles.infoGrid}>
                                            {getDescricao(orcamentoSelecionado) ? (
                                                <View style={styles.infoCardDesc}>
                                                    <Text style={styles.infoLabel}>Descrição</Text>
                                                    <Text style={styles.infoDesc}>
                                                        {getDescricao(orcamentoSelecionado)}
                                                    </Text>
                                                </View>
                                            ) : null}

                                            <View style={styles.infoCard}>
                                                <Text style={styles.infoLabel}>Gasto Atual</Text>
                                                <Text style={styles.infoValue}>
                                                    {formatCurrency(getGasto(orcamentoSelecionado))}
                                                </Text>
                                            </View>

                                            <View style={styles.infoCard}>
                                                <Text style={styles.infoLabel}>Limite</Text>
                                                <Text style={styles.infoValue}>
                                                    {formatCurrency(getLimite(orcamentoSelecionado))}
                                                </Text>
                                            </View>

                                            <View style={styles.infoCard}>
                                                <Text style={styles.infoLabel}>Utilizado</Text>
                                                <Text style={[
                                                    styles.infoValue,
                                                    {
                                                        color: obterCor(
                                                            obterPorcentagem(
                                                                getGasto(orcamentoSelecionado),
                                                                getLimite(orcamentoSelecionado) || 1
                                                            )
                                                        )
                                                    }
                                                ]}>
                                                    {obterPorcentagem(
                                                        getGasto(orcamentoSelecionado),
                                                        getLimite(orcamentoSelecionado) || 1
                                                    )}
                                                    %
                                                </Text>
                                            </View>

                                            <View style={styles.infoCard}>
                                                <Text style={styles.infoLabel}>Status</Text>
                                                <Text
                                                    style={[
                                                        styles.infoValue,
                                                        {
                                                            color:
                                                                obterPorcentagem(
                                                                    getGasto(orcamentoSelecionado),
                                                                    getLimite(orcamentoSelecionado) || 1
                                                                ) >= 100
                                                                    ? COLORS.danger
                                                                    : COLORS.success,
                                                        },
                                                    ]}
                                                >
                                                    {obterPorcentagem(
                                                        getGasto(orcamentoSelecionado),
                                                        getLimite(orcamentoSelecionado) || 1
                                                    ) >= 100
                                                        ? "Limite Excedido"
                                                        : "Dentro do Limite"}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.editBtn}
                                                onPress={handleEdit}
                                            >
                                                <SquarePen color={COLORS.white} />
                                                <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 18 }}>Editar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.loadingContainer}>
                                    <Text style={styles.loadingText}>Carregando...</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Modal>

                <EditarOrcamentoModal
                    visible={editarModalVisible}
                    onClose={() => {
                        setEditarModalVisible(false);
                        setOrcamentoEditando(null);
                        reload();
                    }}
                    orcamento={orcamentoSelecionado}
                />

                <NovoOrcamentoModal
                    visible={novoModalVisible}
                    onClose={() => {
                        setNovoModalVisible(false);
                        reload();
                    }}
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
    scrollContainer: {
        paddingBottom: 50,
    },
    header: {
        backgroundColor: COLORS.darkBackground,
        paddingTop: 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        color: COLORS.primary,
        fontSize: 30,
        fontWeight: "bold",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    subtitle: {
        color: COLORS.gray,
        fontSize: 14,
        fontWeight: "500",
        letterSpacing: 0.3,
        marginBottom: 20,
    },
    cardsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    topCard: {
        flex: 1,
        backgroundColor: COLORS.primary + '15',
        borderWidth: 1,
        borderColor: COLORS.primary + '60',
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
    },
    topCardLabel: {
        color: COLORS.white,
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0.3,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    topCardValue: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
    listContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 16,
        paddingBottom: 20,
    },
    budgetCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    leftArea: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    textArea: {
        flex: 1,
        minWidth: 0,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.black,
        letterSpacing: 0.2,
    },
    cardDescription: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 2,
    },
    infoArea: {
        alignItems: "flex-end",
        flexShrink: 0,
        marginLeft: 8,
    },
    value: {
        fontWeight: "bold",
        fontSize: 18,
        color: COLORS.black,
        letterSpacing: 0.2,
    },
    limit: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 2,
        letterSpacing: 0.1,
    },
    progressLine: {
        width: "100%",
        height: 6,
        backgroundColor: COLORS.borderGray,
        borderRadius: 10,
        marginTop: 16,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 10,
    },
    cardFooter: {
        marginTop: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    percentContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    percent: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.black,
        letterSpacing: 0.2,
    },
    percentExceeded: {
        color: COLORS.danger,
    },
    exceededLabel: {
        fontSize: 11,
        color: COLORS.danger,
        fontWeight: "600",
        backgroundColor: COLORS.chart_expense + '15',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    footerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    details: {
        fontSize: 13,
        color: COLORS.darkGray,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    addButton: {
        height: 80,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.borderGray,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 25,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        padding: 24,
        paddingTop: 20,
    },
    modalHeaderTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    iconButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    modalIconContainer: {
        alignItems: "center",
        marginBottom: 12,
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: 26,
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: 0.3,
    },
    modalSubtitle: {
        color: COLORS.white,
        fontSize: 18,
        textAlign: "center",
        letterSpacing: 0.3,
        marginTop: 4,
    },
    modalDescription: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginTop: 8,
        lineHeight: 22,
        textAlign: "center",
    },
    modalBody: {
        padding: 20,
    },
    infoGrid: {
        gap: 12,
    },
    infoCard: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    infoCardDesc: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        padding: 16,
        flexDirection: "column",
        gap: 8,
    },
    infoLabel: {
        color: COLORS.gray,
        fontSize: 13,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    infoValue: {
        color: COLORS.black,
        fontSize: 20,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
    infoDesc: {
        color: COLORS.black,
        fontSize: 16,
        letterSpacing: 0.3,
        lineHeight: 22,
    },
    editBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.gray,
    },
});