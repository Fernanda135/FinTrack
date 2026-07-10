// components/EditarOrcamentoModal.tsx
import React, { useEffect, useState } from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    FlatList,
    ScrollView,
} from "react-native";
import { X, ChevronDown } from "lucide-react-native";
import { Budgets, Categories } from "@/api/endpoints";
import { formatCurrency, parseMoney } from "@/utils/formatCurrency";
import { emitDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showInfo, showSuccess } from "./Toast/toast";

interface EditarOrcamentoModalProps {
    visible: boolean;
    onClose: () => void;
    orcamento: any;
}

export default function EditarOrcamentoModal({ visible, onClose, orcamento }: EditarOrcamentoModalProps) {
    const [categoria, setCategoria] = useState("");
    const [limite, setLimite] = useState("");
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoriaModal, setCategoriaModal] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Categories.list()
            .then(setCategories)
            .catch(() => setCategories([]));
    }, []);

    // Preencher os campos com os dados do orçamento quando o modal abrir
    useEffect(() => {
        if (visible && orcamento) {
            setTitulo(orcamento.title || "");
            setCategoria(orcamento.categoryId || "");
            setLimite(formatCurrency(orcamento.limit || 0));
            setDescricao(orcamento.description || "");
        }
    }, [visible, orcamento]);

    const getCategoriaLabel = () => {
        const categoriaEncontrada = categories.find((c) => c.id === categoria);
        return categoriaEncontrada ? categoriaEncontrada.label : "selecione uma categoria";
    };

    const formatarValor = (text: string) => {
        let value = text.replace(/\D/g, "");
        if (value === "") return "";
        value = formatCurrency((parseInt(value) / 100));
        return value;
    };

    const handleLimiteChange = (text: string) => {
        const formatted = formatarValor(text);
        setLimite(formatted);
    };

    const handleConfirmar = async () => {
        const limit = parseMoney(limite);
        const cat = categories.find((c) => c.id === categoria);
        
        if (!titulo.trim()) {
            showInfo("Por favor, informe um título para o orçamento");
            return;
        }
        
        if (!cat || limit <= 0) {
            showInfo("Selecione uma categoria e informe um limite válido");
            return;
        }
        
        setSaving(true);
        try {
            await Budgets.update(orcamento.id, {
                title: titulo.trim(),
                description: descricao,
                limit,
                categoryId: categoria,
            });
            
            showSuccess("Orçamento atualizado com sucesso!");
            emitDataChanged();
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Não foi possível atualizar o orçamento");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Modal
                animationType="slide"
                transparent={true}
                visible={visible}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Orçamento</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color={COLORS.darkBackground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Título</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Mercado do mês"
                                    placeholderTextColor={COLORS.gray}
                                    value={titulo}
                                    onChangeText={setTitulo}
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.valueContainer}>
                                <Text style={styles.valueLabel}>limite do orçamento</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    placeholder="R$ 0,00"
                                    placeholderTextColor={COLORS.gray}
                                    keyboardType="numeric"
                                    value={limite}
                                    onChangeText={handleLimiteChange}
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.selectContainer} 
                                onPress={() => setCategoriaModal(true)}
                            >
                                <Text style={styles.selectLabel}>Categoria</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !categoria && styles.placeholderText,
                                    ]}>
                                        {getCategoriaLabel()}
                                    </Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Descrição (opcional)</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.textArea,
                                    ]}
                                    multiline
                                    placeholder="descrição do orçamento..."
                                    placeholderTextColor={COLORS.gray}
                                    value={descricao}
                                    onChangeText={setDescricao}
                                />
                            </View>

                            <TouchableOpacity 
                                style={styles.confirmButton} 
                                onPress={handleConfirmar} 
                                disabled={saving}
                            >
                                <Text style={styles.confirmText}>
                                    {saving ? "salvando..." : "atualizar"}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={categoriaModal}
                animationType="fade"
                onRequestClose={() => setCategoriaModal(false)}
            >
                <TouchableOpacity 
                    style={styles.selectModalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setCategoriaModal(false)}
                >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma categoria</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.selectOption} 
                                    onPress={() => {
                                        setCategoria(item.id);
                                        setCategoriaModal(false);
                                    }}
                                >
                                    <Text style={styles.selectOptionText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: "85%",
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || "#f0f0f0",
    },
    modalTitle: {
        color: COLORS.darkBackground,
        fontSize: 24,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    modalBody: {
        flex: 1,
        paddingBottom: 10,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: "600",
    },
    input: {
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 14,
        padding: 16,
        color: COLORS.darkBackground,
        fontSize: 15,
        borderWidth: 1,
        borderColor: "transparent",
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
        paddingTop: 16,
    },
    valueContainer: {
        marginBottom: 24,
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 18,
        padding: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.lightGray || "#f0f0f0",
    },
    valueLabel: {
        color: COLORS.gray || "#999",
        fontSize: 13,
        marginBottom: 8,
        fontWeight: "500",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    valueInput: {
        color: COLORS.darkBackground,
        fontSize: 36,
        fontWeight: "700",
        padding: 0,
        textAlign: "center",
        minWidth: 200,
    },
    selectContainer: {
        marginBottom: 24,
    },
    selectLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: "600",
    },
    selectButton: {
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 14,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "transparent",
    },
    selectText: {
        color: COLORS.darkBackground,
        fontSize: 15,
    },
    placeholderText: {
        color: COLORS.gray || "#999",
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmText: {
        color: COLORS.white || "#fff",
        fontSize: 17,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    selectModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    selectModalContent: {
        width: "90%",
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 24,
        maxHeight: "70%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    selectModalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
        color: COLORS.darkBackground,
        letterSpacing: 0.5,
    },
    selectOption: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || "#f0f0f0",
    },
    selectOptionText: {
        textAlign: "center",
        color: COLORS.darkBackground,
        fontSize: 16,
        fontWeight: "500",
    },
});