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
import {
    contas,
    categories,
    transacoes,
    orcamentos,
    dashboard,
} from "@/data/data";


export default function Orcamentos() {

    const [modalVisible, setModalVisible] = useState(false);
    const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<any>(null);
    const [novoModalVisible, setNovoModalVisible] = useState(false);

    const getPorcentagem = (gasto: number, limite: number) => {
        return Math.round((gasto / limite) * 100);
    };

    const getColor = (percentage: number) => {
        if (percentage < 80) {
            return "#1F7A1F";
        }
        if (percentage < 100) {
            return "#D8A300";
        }
        return "#B00000";
    };

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
                                <Text style={styles.topCardText}>{dashboard.gastoOrcaTotal} de</Text>
                                <Text style={styles.topCardText}>{dashboard.limiteOrcTotal}</Text>
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
                                            <Text style={styles.value}>
                                                {item.gasto.toLocaleString("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                })}
                                            </Text>
                                            <Text style={styles.limit}>
                                                de{" "}
                                                {item.limite.toLocaleString("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                })}
                                            </Text>
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
                                                color: "#B00000",
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
                            <Plus size={30} color="#AAAAAA" />
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
                                    <X size={22} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>{orcamentoSelecionado?.title}</Text>
                                <Text style={styles.modalDescription}>{orcamentoSelecionado?.descricao}</Text>
                            </View>

                            <View style={styles.modalBody}>
                                <View style={styles.infoCard}>
                                    <Text style={styles.infoLabel}>Gasto Atual</Text>
                                    <Text style={styles.infoValue}>
                                        {orcamentoSelecionado?.gasto?.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.infoCard}>
                                    <Text style={styles.infoLabel}>Limite</Text>
                                    <Text style={styles.infoValue}>
                                        {orcamentoSelecionado?.limite?.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })}
                                    </Text>
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
        backgroundColor: "#F8F8F8",
    },
    scrollContainer: {
        paddingBottom: 50,
    },
    header: {
        backgroundColor: "#9CFF19",
        height: 220,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        justifyContent: "center",
        paddingHorizontal: 20,
        position: "relative",
    },
    title: {
        color: "#1A1A1A",
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
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        elevation: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    topCardText: {
        color: "#222222",
        fontWeight: "bold",
        fontSize: 16,
    },
    listContainer: {
        paddingHorizontal: 10,
        marginTop: 45,
        gap: 25,
    },
    budgetCard: {
        backgroundColor: "#FFFFFF",
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
        backgroundColor: "#AAAAAA",
        borderRadius: 8,
        marginTop: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#222222",
    },
    cardDescription: {
        fontSize: 12,
        color: "#AAAAAA",
        marginTop: 4,
        width: 180,
    },
    infoArea: {
        alignItems: "flex-end",
    },
    value: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#222222",
    },
    limit: {
        fontSize: 12,
        color: "#AAAAAA",
        marginTop: 2,
    },
    progressLine: {
        width: "100%",
        height: 5,
        backgroundColor: "#EFEFEF",
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
        color: "#222222",
        fontWeight: "600",
    },
    percent: {
        fontSize: 12,
        color: "#AAAAAA",
        fontWeight: "600",
    },
    addButton: {
        height: 75,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#AAAAAA",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        marginBottom: 20,
        backgroundColor: "#EFEFEF",
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
        backgroundColor: "#FFF",
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
        color: "#FFF",
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
        backgroundColor: "#F8F8F8",
        borderRadius: 16,
        padding: 16,
    },
    infoLabel: {
        color: "#AAAAAA",
        fontSize: 12,
        textTransform: "uppercase",
        marginBottom: 5,
    },
    infoValue: {
        color: "#222222",
        fontSize: 22,
        fontWeight: "bold",
    },
});
