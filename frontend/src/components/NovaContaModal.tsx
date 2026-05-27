import React, { useState } from "react";
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

import { tiposConta } from "@/data/data";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";
import { showInfo, showSuccess } from "./Toast/toast";

export default function NovaContaModal({ visible, onClose }: any) {

    const [nome, setNome] = useState("");
    const [saldo, setSaldo] = useState("");
    const [tipo, setTipo] = useState("");
    const [cor, setCor] = useState(COLORS.gray);
    const [tipoModal, setTipoModal] = useState(false);

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

    const handleConfirmar = () => {
        const novaConta = {
            nome,
            saldo,
            tipo,
            cor,
        };
        // console.log(novaConta);

        setNome("");
        setSaldo("");
        setTipo("");
        setCor(cor);

        setTimeout(() => {
            showInfo("Conta criada  com sucesso!");
        }, 400);

        onClose()
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

                        {/* HEADER */}
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
                                onPress={handleConfirmar} >
                                <Text style={styles.confirmText}>confirmar</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* TIPOS */}
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
                            keyExtractor={(item) => item.id}
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
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "75%",
        padding: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    modalTitle: {
        color: COLORS.darkBackground,
        fontSize: 24,
        fontWeight: "bold",
    },
    modalBody: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 25,
    },
    label: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: "bold",
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        padding: 15,
        color: COLORS.darkBackground,
        fontSize: 14,
    },
    valueContainer: {
        marginBottom: 25,
        backgroundColor: COLORS.background,
        borderRadius: 18,
        padding: 20,
        alignItems: "center",
    },
    valueLabel: {
        color: COLORS.gray,
        fontSize: 14,
        marginBottom: 5,
    },
    valueInput: {
        color: COLORS.darkBackground,
        fontSize: 34,
        fontWeight: "bold",
    },
    selectContainer: {
        marginBottom: 25,
    },
    selectLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: "bold",
    },
    selectButton: {
        backgroundColor: COLORS.background,
        borderRadius: 14,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    selectText: {
        color: COLORS.darkBackground,
        fontSize: 14,
    },
    placeholderText: {
        color: COLORS.gray,
    },
    colorContainer: {
        marginBottom: 30,
    },
    colorHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    selectedColor: {
        width: 42,
        height: 42,
        borderRadius: 12,
    },
    colorPickerWrapper: {
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    colorPicker: {
        width: "100%",
        height: 70,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30,
        elevation: 2,
    },
    confirmText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "lowercase",
    },
    selectModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    selectModalContent: {
        width: "80%",
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        maxHeight: "70%",
    },
    selectModalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
        color: COLORS.darkBackground,
    },
    selectOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#EFEFEF",
    },
    selectOptionText: {
        textAlign: "center",
        color: COLORS.darkBackground,
        fontSize: 16,
    },
});