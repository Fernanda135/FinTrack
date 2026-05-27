import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { X, ChevronDown } from "lucide-react-native";

import { contas, categories } from "@/data/data";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";
import { showError, showSuccess, showInfo } from "@/components/Toast/toast";



export default function NovaTransacaoModal({ visible, onClose }: any) {

    const [tipo, setTipo] = useState("entrada");
    const [valor, setValor] = useState("");
    const [conta, setConta] = useState("");
    const [categoria, setCategoria] = useState("");
    const [titulo, setTitulo] = useState("");
    const [contaModal, setContaModal] = useState(false);
    const [categoriaModal, setCategoriaModal] = useState(false);


    const getContaLabel = () => {
        const contaEncontrada = contas.find(c => c.value === conta);
        return contaEncontrada ? contaEncontrada.label : "selecione uma conta";
    };

    const getCategoriaLabel = () => {
        const categoriaEncontrada = categories.find(c => c.value === categoria);
        return categoriaEncontrada ? categoriaEncontrada.label : "selecione uma categoria";
    };

    const handleConfirmar = () => {
        const transacao = {
            tipo,
            valor: parseFloat(valor.replace(',', '.')) || 0,
            conta,
            categoria,
            titulo,
            data: new Date().toISOString()
        };
        // console.log('Nova transação:', transacao);


        setValor("");
        setConta("");
        setCategoria("");
        setTitulo("");
        
        setTimeout(() => {
            showSuccess("Transação realizada com sucesso!");
        }, 400);
        
        onClose();
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

                        <View style={styles.modalBody}>
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

                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmar} >
                                <Text style={styles.confirmText}>confirmar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL COM CONTAS */}
            <Modal
                transparent={true}
                visible={contaModal}
                animationType="fade"
            >
                <TouchableOpacity style={styles.selectModalOverlay} onPress={() => setContaModal(false)} >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma conta</Text>
                        <FlatList
                            data={contas}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectOption} onPress={() => {
                                    setConta(item.value);
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

            {/* MODAL COM CATEGORIAS */}
            <Modal
                transparent={true}
                visible={categoriaModal}
                animationType="fade"
            >
                <TouchableOpacity style={styles.selectModalOverlay} onPress={() => setCategoriaModal(false)} >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma categoria</Text>
                        <FlatList
                            data={categories}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.selectOption} onPress={() => {
                                    setCategoria(item.value);
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
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: "80%",
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
        fontSize: 20,
        fontWeight: "bold",
    },
    modalBody: {
        flex: 1,
    },
    typeContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 30,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },
    typeButtonActive: {
        backgroundColor: COLORS.white,
    },
    typeText: {
        color: COLORS.gray,
        fontSize: 14,
        fontWeight: "500",
    },
    typeTextActive: {
        color: COLORS.darkBackground,
        fontWeight: "bold",
    },
    valueContainer: {
        marginBottom: 30,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center'
    },
    valueLabel: {
        color: COLORS.gray,
        fontSize: 12,
        marginBottom: 5,
    },
    valueInput: {
        color: COLORS.darkBackground,
        fontSize: 32,
        fontWeight: "bold",
        padding: 0,
    },
    selectContainer: {
        marginBottom: 20,
    },
    selectLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    selectButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: COLORS.background,
        padding: 15,
        borderRadius: 10,
    },
    selectText: {
        color: COLORS.darkBackground,
        fontSize: 14,
    },
    placeholderText: {
        color: COLORS.gray,
    },
    titleContainer: {
        marginBottom: 30,
    },
    titleLabel: {
        color: COLORS.darkBackground,
        fontSize: 14,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    titleInput: {
        backgroundColor: COLORS.background,
        padding: 15,
        borderRadius: 10,
        color: COLORS.darkBackground,
        fontSize: 14,
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
        elevation: 1
    },
    confirmText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: "bold",
        textTransform: "lowercase",
    },
    selectModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    selectModalContent: {
        backgroundColor: COLORS.background,
        borderRadius: 15,
        padding: 20,
        width: "80%",
        maxHeight: "70%",
    },
    selectModalTitle: {
        color: COLORS.darkBackground,
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    selectOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    selectOptionText: {
        color: COLORS.darkBackground,
        fontSize: 16,
        textAlign: "center",
    },
});