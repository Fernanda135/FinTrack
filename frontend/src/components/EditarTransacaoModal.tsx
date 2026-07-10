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
    Platform,
} from "react-native";
import { X, ChevronDown, Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Transactions, Accounts, Categories } from "@/api/endpoints";
import { formatCurrency, parseMoney } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { emitDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showInfo, showSuccess } from "./Toast/toast";

interface EditarTransacaoModalProps {
    visible: boolean;
    onClose: () => void;
    transacao: any;
}

export default function EditarTransacaoModal({ visible, onClose, transacao }: EditarTransacaoModalProps) {
    const [titulo, setTitulo] = useState("");
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
    const [categoria, setCategoria] = useState("");
    const [conta, setConta] = useState("");
    const [data, setData] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [categoriaModal, setCategoriaModal] = useState(false);
    const [contaModal, setContaModal] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Categories.list().then(setCategories).catch(() => setCategories([]));
        Accounts.list().then(setAccounts).catch(() => setAccounts([]));
    }, []);

    useEffect(() => {
        if (visible && transacao) {
            const dataObj = transacao.data ? new Date(transacao.data) : new Date();
            setTitulo(transacao.titulo || "");
            setValor(formatCurrency(transacao.valor || 0));
            setDescricao(transacao.descricao || "");
            setTipo(transacao.tipo || "receita");
            setCategoria(transacao.categoriaId || "");
            setConta(transacao.contaId || "");
            setData(dataObj);
        }
    }, [visible, transacao]);

    const getCategoriaLabel = () => {
        const cat = categories.find(c => c.id === categoria);
        return cat ? cat.label : "selecione uma categoria";
    };

    const getContaLabel = () => {
        const acc = accounts.find(a => a.id === conta);
        return acc ? acc.label : "selecione uma conta";
    };

    const formatarValor = (text: string) => {
        let value = text.replace(/\D/g, "");
        if (value === "") return "";
        value = formatCurrency((parseInt(value) / 100));
        return value;
    };

    const handleValorChange = (text: string) => {
        const formatted = formatarValor(text);
        setValor(formatted);
    };

    const handleConfirmar = async () => {
        if (!titulo.trim() || !valor || !categoria || !conta) {
            showInfo("Preencha todos os campos obrigatórios");
            return;
        }

        const valorNumerico = parseMoney(valor);
        if (valorNumerico <= 0) {
            showInfo("Informe um valor válido");
            return;
        }

        setSaving(true);
        try {
            await Transactions.update(transacao.id, {
                title: titulo.trim(),
                description: descricao,
                value: valorNumerico,
                type: tipo,
                categoryId: categoria,
                accountId: conta,
                date: data.toISOString(),
            });
            
            showSuccess("Transação atualizada com sucesso!");
            emitDataChanged();
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Não foi possível atualizar a transação");
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
                            <Text style={styles.modalTitle}>Editar Transação</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color={COLORS.darkBackground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Título *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Salário, Compras..."
                                    placeholderTextColor={COLORS.gray}
                                    value={titulo}
                                    onChangeText={setTitulo}
                                />
                            </View>

                            <View style={styles.valueContainer}>
                                <Text style={styles.valueLabel}>valor *</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    placeholder="R$ 0,00"
                                    placeholderTextColor={COLORS.gray}
                                    keyboardType="numeric"
                                    value={valor}
                                    onChangeText={handleValorChange}
                                />
                            </View>

                            <View style={styles.tipoContainer}>
                                <Text style={styles.label}>Tipo *</Text>
                                <View style={styles.tipoButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.tipoButton,
                                            tipo === "receita" && styles.tipoButtonActiveReceita,
                                        ]}
                                        onPress={() => setTipo("receita")}
                                    >
                                        <Text style={[
                                            styles.tipoButtonText,
                                            tipo === "receita" && styles.tipoButtonTextActive,
                                        ]}>
                                            Receita
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.tipoButton,
                                            tipo === "despesa" && styles.tipoButtonActiveDespesa,
                                        ]}
                                        onPress={() => setTipo("despesa")}
                                    >
                                        <Text style={[
                                            styles.tipoButtonText,
                                            tipo === "despesa" && styles.tipoButtonTextActive,
                                        ]}>
                                            Despesa
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.selectContainer} 
                                onPress={() => setCategoriaModal(true)}
                            >
                                <Text style={styles.selectLabel}>Categoria *</Text>
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

                            <TouchableOpacity 
                                style={styles.selectContainer} 
                                onPress={() => setContaModal(true)}
                            >
                                <Text style={styles.selectLabel}>Conta *</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !conta && styles.placeholderText,
                                    ]}>
                                        {getContaLabel()}
                                    </Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.selectContainer} 
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.selectLabel}>Data *</Text>
                                <View style={styles.selectButton}>
                                    <Text style={styles.selectText}>
                                        {formatDate(data.toISOString())}
                                    </Text>
                                    <Calendar size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Descrição (opcional)</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    placeholder="descrição da transação..."
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


            <Modal
                transparent={true}
                visible={contaModal}
                animationType="fade"
                onRequestClose={() => setContaModal(false)}
            >
                <TouchableOpacity 
                    style={styles.selectModalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setContaModal(false)}
                >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma conta</Text>
                        <FlatList
                            data={accounts}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    style={styles.selectOption} 
                                    onPress={() => {
                                        setConta(item.id);
                                        setContaModal(false);
                                    }}
                                >
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
                    onValueChange={(event, selectedDate) => {
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
        height: "90%",
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
        marginBottom: 20,
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
        marginBottom: 20,
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
    tipoContainer: {
        marginBottom: 20,
    },
    tipoButtons: {
        flexDirection: "row",
        gap: 12,
    },
    tipoButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        borderWidth: 2,
        borderColor: COLORS.borderGray,
        alignItems: "center",
    },
    tipoButtonActiveReceita: {
        backgroundColor: COLORS.chart_income + '20',
        borderColor: COLORS.success,
    },
    tipoButtonActiveDespesa: {
        backgroundColor: COLORS.chart_expense + '20',
        borderColor: COLORS.danger,
    },
    tipoButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.gray,
    },
    tipoButtonTextActive: {
        color: COLORS.black,
    },
    selectContainer: {
        marginBottom: 20,
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