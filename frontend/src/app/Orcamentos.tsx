import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Modal,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Plus, X } from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import NovoOrcamentoModal from "@/components/NovoOrcamentoModal";
import { orcamentos } from "@/data/data";
import { useOrcamentos } from "@/hooks/userOrcamentos";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";



export default function Orcamentos() {

    const [modalVisible, setModalVisible] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<typeof orcamentos[number] | null>(null);
    const [novoModalVisible, setNovoModalVisible] = useState(false);

    const { getPorcentagem, getColor } = useOrcamentos();
    const { gastoOrcaTotal, limiteOrcTotal } = useDashboard();

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                >

                    {/* HEADER */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Orçamentos</Text>
                        <View style={styles.cardsContainer}>
                            <View style={styles.topCard}>
                                <Text style={styles.topCardText}>{formatCurrency(gastoOrcaTotal)} de</Text>
                                <Text style={styles.topCardText}>{formatCurrency(limiteOrcTotal)}</Text>
                            </View>
                            <View style={styles.topCard}>
                                <Text style={styles.topCardText}>{orcamentos.length} ativos</Text>
                            </View>
                        </View>
                    </View>

                    {/* CARDS DE ORÇAMENTOS */}
                    <View style={styles.listContainer}>
                        {orcamentos.map((item) => {
                            const percentage = getPorcentagem(item.gasto, item.limite);
                            const color = getColor(percentage);

                            return (
                                <View key={item.id} style={styles.budgetCard}>
                                    <View style={styles.cardTop}>
                                        <View style={styles.leftArea}>
                                            <View style={styles.iconPlaceholder} />
                                            <View>
                                                <Text style={styles.cardTitle}>{item.title}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.infoArea}>
                                            <Text style={styles.value}>{formatCurrency(item.gasto)}</Text>
                                            <Text style={styles.limit}>de {formatCurrency(item.limite)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressLine}>
                                        <View style={[
                                            styles.progressBar,
                                            {
                                                width: `${Math.min(percentage, 100)}%`,
                                                backgroundColor: color,
                                            },]}
                                        />
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <TouchableOpacity onPress={() => {
                                            setOrcamentoSelecionado(item);
                                            setModalVisible(true);
                                        }}
                                        >
                                            <Text style={styles.details}>Ver Detalhes</Text>
                                        </TouchableOpacity>

                                        <Text style={[
                                            styles.percent,
                                            percentage >= 100 && {
                                                color: COLORS.error,
                                            },
                                        ]}
                                        >
                                            {percentage >= 100 ? "Limite Excedido! " : ""}
                                            {percentage}%
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        <TouchableOpacity style={styles.addButton} onPress={() => setNovoModalVisible(true)}>
                            <Plus size={30} color={COLORS.gray} />
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                <BottomNav />

                {/* MODAL COM DETALHES DO CARD */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={[
                                styles.modalHeader,
                                {
                                    backgroundColor: getColor(
                                        getPorcentagem(
                                            orcamentoSelecionado?.gasto || 0,
                                            orcamentoSelecionado?.limite || 1,
                                        ),
                                    ),
                                }
                            ]} >
                                <TouchableOpacity style={styles.closeIcon} onPress={() => setModalVisible(false)} >
                                    <X size={22} color={COLORS.white} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>{orcamentoSelecionado?.title}</Text>
                                <Text style={styles.modalDescription}>{orcamentoSelecionado?.descricao}</Text>
                            </View>

                            <View style={styles.modalBody}>
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoLabel}>Gasto Atual</Text>
                                    <Text style={styles.infoValue}>{formatCurrency(orcamentoSelecionado?.gasto ?? 0)}</Text>
                                </View>

                                <View style={styles.infoCard}>
                                    <Text style={styles.infoLabel}>Limite</Text>
                                    <Text style={styles.infoValue}>{formatCurrency(orcamentoSelecionado?.limite ?? 0)}</Text>
                                </View>

                                <View style={styles.infoCard}>
                                    <Text style={styles.infoLabel}>Utilizado</Text>
                                    <Text style={styles.infoValue}>
                                        {getPorcentagem(
                                            orcamentoSelecionado?.gasto || 0,
                                            orcamentoSelecionado?.limite || 1,
                                        )}
                                        %
                                    </Text>
                                </View>

                            </View>
                        </View>
                    </View>
                </Modal>

                <NovoOrcamentoModal visible={novoModalVisible} onClose={() => setNovoModalVisible(false)} />
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
        backgroundColor: COLORS.primary,
        height: 220,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        justifyContent: "center",
        paddingHorizontal: 20,
        position: "relative",
    },
    title: {
        color: COLORS.black,
        fontSize: 30,
        fontWeight: "bold",
    },
    cardsContainer: {
        position: "absolute",
        bottom: -25,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
    },
    topCard: {
        width: 150,
        height: 55,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        elevation: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    topCardText: {
        color: COLORS.darkBackground,
        fontWeight: "bold",
        fontSize: 16,
    },
    listContainer: {
        paddingHorizontal: 10,
        marginTop: 45,
        gap: 25,
    },
    budgetCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 18,
        elevation: 2,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    leftArea: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    iconPlaceholder: {
        width: 30,
        height: 30,
        backgroundColor: COLORS.gray,
        borderRadius: 8,
        marginTop: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.darkBackground,
    },
    cardDescription: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 4,
        width: 180,
    },
    infoArea: {
        alignItems: "flex-end",
    },
    value: {
        fontWeight: "bold",
        fontSize: 18,
        color: COLORS.darkBackground,
    },
    limit: {
        fontSize: 12,
        color: COLORS.gray,
        marginTop: 2,
    },
    progressLine: {
        width: "100%",
        height: 5,
        backgroundColor: COLORS.borderGray,
        borderRadius: 20,
        marginTop: 15,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        borderRadius: 20,
    },
    cardFooter: {
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    details: {
        fontSize: 12,
        color: COLORS.darkBackground,
        fontWeight: "600",
    },
    percent: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: "600",
    },
    addButton: {
        height: 75,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: COLORS.gray,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        marginBottom: 20,
        backgroundColor: COLORS.borderGray,
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
    },
    modalHeader: {
        padding: 24,
    },
    closeIcon: {
        alignSelf: "flex-end",
        marginBottom: 15,
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: 28,
        fontWeight: "bold",
    },
    modalDescription: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 14,
        marginTop: 10,
        lineHeight: 22,
    },
    modalBody: {
        padding: 20,
        gap: 15,
    },
    infoCard: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
    },
    infoLabel: {
        color: COLORS.gray,
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 5,
    },
    infoValue: {
        color: COLORS.darkBackground,
        fontSize: 22,
        fontWeight: "bold",
    },
});
