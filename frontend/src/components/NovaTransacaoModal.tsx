import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList } from "react-native";
import { X, ChevronDown } from "lucide-react-native";

// import { categories } from "@/data/categories";
// import { contas } from "@/data/contas"
import {
    contas,
    categories,
    transacoes,
    orcamentos,
    dashboard,
} from "@/data/data";

export default function NovaTransacaoModal({ visible, onClose }: any) {

    const [tipo, setTipo] = useState("entrada");
    const [valor, setValor] = useState("");
    const [conta, setConta] = useState("");
    const [categoria, setCategoria] = useState("");
    const [descricao, setDescricao] = useState("");

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
            descricao,
            data: new Date().toISOString()
        };
        // console.log('Nova transação:', transacao);

        setValor("");
        setConta("");
        setCategoria("");
        setDescricao("");
        onClose();
    };

    const formatarValor = (text: string) => {
        let value = text.replace(/\D/g, '');
        if (value === '') return '';
        value = (parseInt(value) / 100).toLocaleString("pt-BR", { style: "currency",currency: "BRL", });
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
                                <X size={24} color="#222222" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>

                            <View style={styles.typeContainer}>
                                <TouchableOpacity
                                    style={[styles.typeButton, tipo === "entrada" && styles.typeButtonActive]}
                                    onPress={() => setTipo("entrada")}
                                >
                                    <Text style={[styles.typeText, tipo === "entrada" && styles.typeTextActive]}>
                                        Entrada
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.typeButton, tipo === "saida" && styles.typeButtonActive]}
                                    onPress={() => setTipo("saida")}
                                >
                                    <Text style={[styles.typeText, tipo === "saida" && styles.typeTextActive]}>
                                        Saída
                                    </Text>
                                </TouchableOpacity>

                            </View>

                            <View style={styles.valueContainer}>

                                <Text style={styles.valueLabel}>insira o valor</Text>
                                <TextInput
                                    style={styles.valueInput}
                                    placeholder="R$ 0,00"
                                    placeholderTextColor="#AAAAAA"
                                    keyboardType="numeric"
                                    value={valor}
                                    onChangeText={handleValorChange}
                                />

                            </View>

                            <TouchableOpacity
                                style={styles.selectContainer}
                                onPress={() => setContaModal(true)}
                            >
                                <Text style={styles.selectLabel}>Conta</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[styles.selectText, !conta && styles.placeholderText]}>
                                        {getContaLabel()}
                                    </Text>
                                    <ChevronDown size={20} color="#AAAAAA" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.selectContainer}
                                onPress={() => setCategoriaModal(true)}
                            >
                                <Text style={styles.selectLabel}>Categoria</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[styles.selectText, !categoria && styles.placeholderText]}>
                                        {getCategoriaLabel()}
                                    </Text>
                                    <ChevronDown size={20} color="#AAAAAA" />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.descContainer}>
                                <Text style={styles.descLabel}>Descrição</Text>
                                <TextInput
                                    style={styles.descInput}
                                    placeholder="descrição..."
                                    placeholderTextColor="#AAAAAA"
                                    value={descricao}
                                    onChangeText={setDescricao}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmar}
                            >
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
                <TouchableOpacity
                    style={styles.selectModalOverlay}
                    onPress={() => setContaModal(false)}
                >
                    <View style={styles.selectModalContent}>
                        <Text style={styles.selectModalTitle}>Selecione uma conta</Text>
                        <FlatList
                            data={contas}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.selectOption}
                                    onPress={() => {
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
                <TouchableOpacity
                    style={styles.selectModalOverlay}
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
        backgroundColor: "#ffffff",
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
        color: "#222222",
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
        backgroundColor: "#F8F8F8",
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
        backgroundColor: "#FFFFFF",
    },
    typeText: {
        color: "#AAAAAA",
        fontSize: 14,
        fontWeight: "500",
    },
    typeTextActive: {
        color: "#222222",
        fontWeight: "bold",
    },
    valueContainer: {
        marginBottom: 30,
        backgroundColor: "#F8F8F8",
        borderRadius: 10,
        padding: 10,
        alignItems: 'center'
    },
    valueLabel: {
        color: "#AAAAAA",
        fontSize: 12,
        marginBottom: 5,
    },
    valueInput: {
        color: "#222222",
        fontSize: 32,
        fontWeight: "bold",
        padding: 0,
    },
    selectContainer: {
        marginBottom: 20,
    },
    selectLabel: {
        color: "#222222",
        fontSize: 14,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    selectButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#F8F8F8",
        padding: 15,
        borderRadius: 10,
    },
    selectText: {
        color: "#222222",
        fontSize: 14,
    },
    placeholderText: {
        color: "#AAAAAA",
    },
    descContainer: {
        marginBottom: 30,
    },
    descLabel: {
        color: "#222222",
        fontSize: 14,
        marginBottom: 5,
        fontWeight: 'bold'
    },
    descInput: {
        backgroundColor: "#F8F8F8",
        padding: 15,
        borderRadius: 10,
        color: "#222222",
        fontSize: 14,
    },
    confirmButton: {
        backgroundColor: "#9CFF19",
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 20,
        elevation: 1
    },
    confirmText: {
        color: "#1A1A1A",
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
        backgroundColor: "#F8F8F8",
        borderRadius: 15,
        padding: 20,
        width: "80%",
        maxHeight: "70%",
    },
    selectModalTitle: {
        color: "#222222",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    selectOption: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#D9D9D9",
    },
    selectOptionText: {
        color: "#222222",
        fontSize: 16,
        textAlign: "center",
    },
});