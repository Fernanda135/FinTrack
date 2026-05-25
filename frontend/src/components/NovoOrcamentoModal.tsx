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
import { categories } from "@/data/data";
import { formatCurrency } from "@/utils/formatCurrency";
import { COLORS } from "@/constants/colors";


export default function NovoOrcamentoModal({ visible, onClose }: any) {

    const [categoria, setCategoria] = useState("");
    const [limite, setLimite] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoriaModal, setCategoriaModal] = useState(false);

    const getCategoriaLabel = () => {
        const categoriaEncontrada = categories.find((c) => c.value === categoria);
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

    const handleConfirmar = () => {
        const novoOrcamento = {
            categoria,
            limite,
            descricao,
        };

        // console.log(novoOrcamento);

        setCategoria("");
        setLimite("");
        setDescricao("");
        onClose();
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
                            <Text style={styles.modalTitle}>Novo Orçamento</Text>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color={COLORS.darkBackground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} >
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

                            <TouchableOpacity style={styles.selectContainer} onPress={() => setCategoriaModal(true)} >
                                <Text style={styles.selectLabel}>Categoria</Text>
                                <View style={styles.selectButton}>
                                    <Text style={[
                                        styles.selectText,
                                        !categoria && styles.placeholderText,
                                    ]} >{getCategoriaLabel()}</Text>
                                    <ChevronDown size={20} color={COLORS.gray} />
                                </View>
                            </TouchableOpacity>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Descrição</Text>
                                <TextInput style={[
                                    styles.input,
                                    {
                                        height: 100,
                                        textAlignVertical: "top",
                                    },                                ]}
                                    multiline
                                    placeholder="descrição do orçamento..."
                                    placeholderTextColor={COLORS.gray}
                                    value={descricao}
                                    onChangeText={setDescricao}
                                />
                            </View>

                            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmar} >
                                <Text style={styles.confirmText}>confirmar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={categoriaModal}
                animationType="fade"
            >
                <TouchableOpacity style={styles.selectModalOverlay} >
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
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: "72%",
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
    inputContainer: {
        marginBottom: 30,
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
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
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
        borderBottomColor: COLORS.borderGray,
    },
    selectOptionText: {
        textAlign: "center",
        color: COLORS.darkBackground,
        fontSize: 16,
    },
});
