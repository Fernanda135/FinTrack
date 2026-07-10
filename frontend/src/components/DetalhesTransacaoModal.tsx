import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import { X, Trash2, SquarePen, Calendar, Wallet, Tag, ArrowUpRight, ArrowDownRight } from "lucide-react-native";
import { COLORS } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { Transactions } from "@/api/endpoints";
import { emitDataChanged } from "@/utils/events";
import { showError, showSuccess } from "./Toast/toast";

interface DetalhesTransacaoModalProps {
    visible: boolean;
    onClose: () => void;
    transacao: any;
    onEdit: () => void;
    onDelete?: () => void;
}

export default function DetalhesTransacaoModal({ 
    visible, 
    onClose, 
    transacao, 
    onEdit,
    onDelete 
}: DetalhesTransacaoModalProps) {
    
    if (!transacao) return null;

    const isReceita = transacao.tipo === "receita";
    const Icon = isReceita ? ArrowDownRight : ArrowUpRight;
    const iconColor = isReceita ? COLORS.success : COLORS.danger;
    const backgroundColor = isReceita ? COLORS.chart_income + '15' : COLORS.chart_expense + '15';

    const handleDelete = () => {
        Alert.alert(
            "Excluir Transação",
            `Tem certeza que deseja excluir "${transacao.titulo}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await Transactions.remove(transacao.id);
                            showSuccess("Transação excluída com sucesso!");
                            emitDataChanged();
                            onClose();
                            if (onDelete) onDelete();
                        } catch (e: any) {
                            showError(e?.message ?? "Não foi possível excluir a transação");
                        }
                    },
                },
            ]
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.gray} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Detalhes da Transação</Text>
                        <View style={styles.headerRight} />
                    </View>


                    <View style={styles.amountContainer}>
                        <View style={[styles.iconCircle, { backgroundColor }]}>
                            <Icon size={32} color={iconColor} strokeWidth={2} />
                        </View>
                        <Text style={[
                            styles.amount,
                            { color: isReceita ? COLORS.success : COLORS.danger }
                        ]}>
                            {isReceita ? "+" : "-"}{formatCurrency(transacao.valor)}
                        </Text>
                        <Text style={styles.typeLabel}>
                            {isReceita ? "Receita" : "Despesa"}
                        </Text>
                    </View>


                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Tag size={20} color={COLORS.gray} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Título</Text>
                                <Text style={styles.detailValue}>{transacao.titulo}</Text>
                            </View>
                        </View>

                        {transacao.descricao && (
                            <View style={styles.detailItem}>
                                <View style={styles.detailIconContainer}>
                                    <SquarePen size={20} color={COLORS.gray} />
                                </View>
                                <View style={styles.detailContent}>
                                    <Text style={styles.detailLabel}>Descrição</Text>
                                    <Text style={styles.detailValue}>{transacao.descricao}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Wallet size={20} color={COLORS.gray} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Conta</Text>
                                <Text style={styles.detailValue}>
                                    {transacao.conta?.label || "Conta não especificada"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Tag size={20} color={COLORS.gray} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Categoria</Text>
                                <Text style={styles.detailValue}>
                                    {transacao.categoria?.label || "Sem categoria"}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailItem}>
                            <View style={styles.detailIconContainer}>
                                <Calendar size={20} color={COLORS.gray} />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Data</Text>
                                <Text style={styles.detailValue}>
                                    {formatDate(transacao.data)}
                                </Text>
                            </View>
                        </View>
                    </View>


                    <View style={styles.actionsContainer}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.editButton]} 
                            onPress={onEdit}
                            activeOpacity={0.7}
                        >
                            <SquarePen size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]} 
                            onPress={handleDelete}
                            activeOpacity={0.7}
                        >
                            <Trash2 size={20} color={COLORS.white} />
                            <Text style={styles.actionButtonText}>Excluir</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContainer: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 25,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        maxHeight: "90%",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    closeButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        letterSpacing: 0.3,
    },
    headerRight: {
        width: 32,
    },
    amountContainer: {
        alignItems: "center",
        marginBottom: 24,
        paddingVertical: 16,
        backgroundColor: COLORS.background,
        borderRadius: 16,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    amount: {
        fontSize: 34,
        fontWeight: "bold",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    typeLabel: {
        fontSize: 14,
        color: COLORS.gray,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    detailsContainer: {
        marginBottom: 24,
        gap: 4,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderGray,
    },
    detailIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: "500",
        letterSpacing: 0.2,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        color: COLORS.black,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    editButton: {
        backgroundColor: COLORS.primary,
    },
    deleteButton: {
        backgroundColor: COLORS.danger,
    },
    actionButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 0.3,
    },
});