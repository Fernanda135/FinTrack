import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Platform, ScrollView } from "react-native";
import { X, ChevronDown, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Accounts, Categories, Transactions } from "@/api/endpoints";
import { formatCurrency, parseMoney } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { emitDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showInfo, showSuccess } from "@/components/Toast/toast";

export default function NovaTransacaoModal({ visible, onClose }: any) {

    const [tipo, setTipo] = useState("entrada");
    const [valor, setValor] = useState("");
    const [conta, setConta] = useState("");
    const [categoria, setCategoria] = useState("");
    const [titulo, setTitulo] = useState("");
    const [data, setData] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [contaModal, setContaModal] = useState(false);
    const [categoriaModal, setCategoriaModal] = useState(false);
    const [contas, setContas] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!visible) return;
        Accounts.list().then(setContas).catch(() => setContas([]));
        Categories.list().then(setCategories).catch(() => setCategories([]));
    }, [visible]);

    const getContaLabel = () => {
        const contaEncontrada = contas.find((c) => c.id === conta);
        return contaEncontrada ? contaEncontrada.label : "selecione uma conta";
    };

    const getCategoriaLabel = () => {
        const categoriaEncontrada = categories.find((c) => c.id === categoria);
        return categoriaEncontrada ? categoriaEncontrada.label : "selecione uma categoria";
    };

    const handleConfirmar = async () => {
        const amount = parseMoney(valor);
        if (!titulo.trim() || !conta || !categoria || amount <= 0) {
            showInfo("Preencha título, valor, conta e categoria");
            return;
        }

        const contaSelecionada = contas.find(c => c.id === conta);
        if (!contaSelecionada) {
            showError("Conta não encontrada");
            return;
        }

        const isCreditCard = contaSelecionada.type === "CREDIT_CARD" ||
            contaSelecionada.isCreditCard === true;

        if (tipo === "saida") {
            if (isCreditCard) {
                const limiteDisponivel = (contaSelecionada.limit || 0) - (contaSelecionada.used || 0);

                if (amount > limiteDisponivel) {
                    showError(`Limite do cartão insuficiente. Disponível: ${formatCurrency(limiteDisponivel)}`);
                    return;
                }
            } else {
                const saldoDisponivel = contaSelecionada.balance || 0;

                if (amount > saldoDisponivel) {
                    showError(`Saldo insuficiente. Disponível: ${formatCurrency(saldoDisponivel)}`);
                    return;
                }
            }
        }

        setSaving(true);
        try {
            await Transactions.create({
                title: titulo.trim(),
                amount,
                type: tipo === "entrada" ? "RECEITA" : "DESPESA",
                accountId: conta,
                categoryId: categoria,
                date: data.toISOString(),
            });
            setValor("");
            setConta("");
            setCategoria("");
            setTitulo("");
            setTipo("entrada");
            setData(new Date());
            showSuccess("Transação realizada com sucesso!");
            emitDataChanged();
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Não foi possível salvar a transação");
        } finally {
            setSaving(false);
        }
    };

    const formatarValor = (text: string) => {
        let value = text.replace(/\D/g, '');
        if (value === '') return '';
        value = formatCurrency((parseInt(value) / 100));
        return value;
    };

    const handleValorChange = (text: string) => {
        const formatted = formatarValor(text);
        setValor(formatted);
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
                            <Text style={styles.modalTitle}>Nova Transação</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color={COLORS.darkBackground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.modalBody}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.typeContainer}>
                                <TouchableOpacity onPress={() => setTipo("entrada")} style={[
                                    styles.typeButton,
                                    tipo === "entrada" && styles.typeButtonActive
                                ]} >
                                    <Text style={[
                                        styles.typeText,
                                        tipo === "entrada" && styles.typeTextActive
                                    ]}>Entrada</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setTipo("saida")} style={[
                                    styles.typeButton,
                                    tipo === "saida" && styles.typeButtonActive
                                ]} >
                                    <Text style={[
                                        styles.typeText,
                                        tipo === "saida" && styles.typeTextActive]}
                                    >Saída</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.valueContainer}>
                                <Text style={styles.valueLabel}>insira o valor</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    placeholder="R$ 0,00"
                                    placeholderTextColor={COLORS.gray}
                                    keyboardType="numeric"
                                    value={valor}
                                    onChangeText={handleValorChange}
                                />
                            </View>

                            <View style={styles.titleContainer}>
                                <Text style={styles.titleLabel}>Título</Text>
                                <TextInput
                                    style={styles.titleInput}
                                    placeholder="título da transação"
                                    placeholderTextColor={COLORS.gray}
                                    value={titulo}
                                    onChangeText={setTitulo}
                                />
                            </View>

                            <TouchableOpacity style={styles.selectContainer} onPress={() => setContaModal(true)} >
                                <Text style={styles.selectLabel}>Conta</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !conta && styles.placeholderText
                                    ]}>{getContaLabel()}</Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.selectContainer} onPress={() => setCategoriaModal(true)} >
                                <Text style={styles.selectLabel}>Categoria</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !categoria && styles.placeholderText
                                    ]}>{getCategoriaLabel()}</Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.selectContainer}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.selectLabel}>Data</Text>
                                <View style={styles.selectButton}>
                                    <Text style={styles.selectText}>
                                        {formatDate(data.toISOString())}
                                    </Text>
                                    <Calendar size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmar} disabled={saving} >
                                <Text style={styles.confirmText}>{saving ? "salvando..." : "confirmar"}</Text>
                            </TouchableOpacity>
                            
                            {/* Espaço extra no final para garantir rolagem */}
                            <View style={styles.bottomSpacer} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={contaModal}
                animationType="fade"
                onRequestClose={() => setContaModal(false)}
            >
                <TouchableOpacity style={styles.selectModalOverlay} activeOpacity={1} onPress={() => setContaModal(false)} >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma conta</Text>
                        <FlatList
                            data={contas}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectOption} onPress={() => {
                                    setConta(item.id);
                                    setContaModal(false);
                                }}>
                                    <Text style={styles.selectOptionText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                transparent={true}
                visible={categoriaModal}
                animationType="fade"
                onRequestClose={() => setCategoriaModal(false)}
            >
                <TouchableOpacity style={styles.selectModalOverlay} activeOpacity={1} onPress={() => setCategoriaModal(false)} >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma categoria</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectOption} onPress={() => {
                                    setCategoria(item.id);
                                    setCategoriaModal(false);
                                }}>
                                    <Text style={styles.selectOptionText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {showDatePicker && (
                <DateTimePicker
                    value={data}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setData(selectedDate);
                        }
                    }}
                />
            )}
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
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || "#f0f0f0",
    },
    modalTitle: {
        color: COLORS.darkBackground,
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    modalBody: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    bottomSpacer: {
        height: 20,
    },
    typeContainer: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 20,
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    typeButtonActive: {
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    typeText: {
        color: COLORS.gray || "#999",
        fontSize: 15,
        fontWeight: "600",
    },
    typeTextActive: {
        color: COLORS.darkBackground,
        fontWeight: "700",
    },
    valueContainer: {
        marginBottom: 20,
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
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
    titleContainer: {
        marginBottom: 16,
    },
    titleLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 6,
        fontWeight: "600",
    },
    titleInput: {
        backgroundColor: COLORS.background || "#f5f5f5",
        padding: 14,
        borderRadius: 12,
        color: COLORS.darkBackground,
        fontSize: 15,
        borderWidth: 1,
        borderColor: "transparent",
    },
    selectContainer: {
        marginBottom: 16,
    },
    selectLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 6,
        fontWeight: "600",
    },
    selectButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.background || "#f5f5f5",
        padding: 14,
        borderRadius: 12,
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
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmButtonDisabled: {
        opacity: 0.7,
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
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 24,
        width: "90%",
        maxHeight: "70%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    selectModalTitle: {
        color: COLORS.darkBackground,
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 20,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    selectOption: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray || "#f0f0f0",
    },
    selectOptionLast: {
        borderBottomWidth: 0,
    },
    selectOptionText: {
        color: COLORS.darkBackground,
        fontSize: 16,
        textAlign: "center",
        fontWeight: "500",
    },
    selectOptionActive: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    selectOptionTextActive: {
        color: COLORS.white,
    },
});