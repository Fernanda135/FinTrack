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
import ColorPicker from "react-native-wheel-color-picker";

import { Accounts } from "@/api/endpoints";
import { formatCurrency, parseMoney } from "@/utils/formatCurrency";
import { emitDataChanged } from "@/utils/events";
import { COLORS } from "@/constants/colors";
import { showError, showInfo, showSuccess } from "./Toast/toast";


export default function NovaContaModal({ visible, onClose }: any) {

    const [nome, setNome] = useState("");
    const [saldo, setSaldo] = useState("");
    const [tipo, setTipo] = useState("");
    const [cor, setCor] = useState(COLORS.gray);
    const [tipoModal, setTipoModal] = useState(false);
    const [tiposConta, setTiposConta] = useState<{ label: string; value: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Accounts.types()
            .then(setTiposConta)
            .catch(() => setTiposConta([]));
    }, []);

    const getTipoLabel = () => {
        const tipoEncontrado = tiposConta.find(
            (t) => t.value === tipo);

        return tipoEncontrado
            ? tipoEncontrado.label
            : "selecione o tipo de conta";
    };

    const formatarValor = (text: string) => {
        let value = text.replace(/\D/g, "");
        if (value === "") return "";
        value = formatCurrency((parseInt(value) / 100));
        return value;
    };

    const handleSaldoChange = (text: string) => {
        const formatted = formatarValor(text);
        setSaldo(formatted);
    };

    const handleConfirmar = async () => {
        if (!nome.trim() || !tipo) {
            showInfo("Preencha o nome e o tipo da conta");
            return;
        }
        setSaving(true);
        try {
            await Accounts.create({
                label: nome.trim(),
                type: tipo,
                balance: parseMoney(saldo),
                color: cor,
            });
            setNome("");
            setSaldo("");
            setTipo("");
            showSuccess("Conta criada com sucesso!");
            emitDataChanged();
            onClose();
        } catch (e: any) {
            showError(e?.message ?? "Não foi possível criar a conta");
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
                onRequestClose={onClose} >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>


                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nova Conta</Text>
                            <TouchableOpacity onPress={onClose} >
                                <X size={24} color="#222222" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} >
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Nome</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="nome da conta"
                                    placeholderTextColor={COLORS.gray}
                                    value={nome}
                                    onChangeText={setNome} />
                            </View>

                            <View style={styles.valueContainer}>
                                <Text style={styles.valueLabel}>saldo inicial</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    placeholder="R$ 0,00"
                                    placeholderTextColor={COLORS.gray}
                                    keyboardType="numeric"
                                    value={saldo}
                                    onChangeText={handleSaldoChange} />
                            </View>

                            <TouchableOpacity
                                style={styles.selectContainer}
                                onPress={() => setTipoModal(true)} >
                                <Text style={styles.selectLabel}>Tipo</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !tipo && styles.placeholderText
                                    ]} >{getTipoLabel()}</Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.colorContainer}>
                                <View style={styles.colorHeader}>
                                    <Text style={styles.selectLabel}>Cor da conta</Text>
                                    <View
                                        style={[
                                            styles.selectedColor,
                                            { backgroundColor: cor },]} />
                                </View>
                                <View style={styles.colorPickerWrapper}>
                                    <ColorPicker
                                        color={cor}
                                        onColorChangeComplete={(color: string) =>
                                            setCor(color)
                                        }
                                        thumbSize={20}
                                        sliderSize={18}
                                        noSnap={true}
                                        row={true}
                                        swatches={false}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmar}
                                disabled={saving} >
                                <Text style={styles.confirmText}>{saving ? "salvando..." : "confirmar"}</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>


            <Modal
                transparent={true}
                visible={tipoModal}
                animationType="fade"
            >

                <TouchableOpacity style={styles.selectModalOverlay} onPress={() => setTipoModal(false)} >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione um tipo</Text>
                        <FlatList
                            data={tiposConta}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectOption} onPress={() => {
                                    setTipo(item.value);
                                    setTipoModal(false);
                                }} >
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
        paddingBottom: 20,
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
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
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
    selectButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    selectText: {
        color: COLORS.darkBackground,
        fontSize: 15,
    },
    placeholderText: {
        color: COLORS.gray || "#999",
    },
    colorContainer: {
        marginBottom: 28,
        backgroundColor: COLORS.background || "#f5f5f5",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.lightGray || "#f0f0f0",
    },
    colorHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
        paddingHorizontal: 4,
    },
    selectedColor: {
        width: 44,
        height: 44,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    colorPickerWrapper: {
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 4,
        padding: 8,
    },
    colorPicker: {
        width: "100%",
        height: 70,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 10,
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
    selectOptionLast: {
        borderBottomWidth: 0,
    },
    selectOptionText: {
        textAlign: "center",
        color: COLORS.darkBackground,
        fontSize: 16,
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