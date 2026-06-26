import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFiltroMes } from "@/hooks/useFiltroMes";
import { COLORS } from "@/constants/colors";

interface FiltroMensalProps {
    transacoes: { data: string }[];
    mesInicial?: number;
    anoInicial?: number;
    quantidadeTransacoes?: number;
    aoMudarMes?: (ano: number, mes: number) => void;
}

export default function FiltroMensal({
    transacoes = [],
    mesInicial,
    anoInicial,
    aoMudarMes,
}: FiltroMensalProps) {
    const {
        exibicaoMes,
        temMesAnterior,
        temProximoMes,
        mesAnterior,
        proximoMes,
        mesAtual,
        anoAtual,
    } = useFiltroMes({
        transacoes,
        mesInicial,
        anoInicial,
        aoMudarMes,
    });

    const contarTransacoesDoMes = () => {
        if (!transacoes || transacoes.length === 0) return 0;

        return transacoes.filter(transacao => {
            const data = new Date(transacao.data);
            return data.getMonth() === mesAtual &&
                data.getFullYear() === anoAtual;
        }).length;
    };

    const totalTransacoesMes = contarTransacoesDoMes();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={mesAnterior}
                disabled={!temMesAnterior}
            >
                <Ionicons
                    name="chevron-back"
                    size={30}
                    color={temMesAnterior ? COLORS.white : COLORS.gray}
                />
            </TouchableOpacity>

            <View style={styles.info}>
                <Text style={styles.monthText}>
                    {exibicaoMes}
                </Text>

                <Text style={styles.monthLabel}>
                    {totalTransacoesMes}{" "}
                    {totalTransacoesMes === 1
                        ? "Transação"
                        : "Transações"}
                </Text>
            </View>

            <TouchableOpacity
                onPress={proximoMes}
                disabled={!temProximoMes}
            >
                <Ionicons
                    name="chevron-forward"
                    size={30}
                    color={temProximoMes ? COLORS.white : COLORS.gray}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
        marginBottom: 25,
    },
    info: {
        alignItems: "center",
    },
    monthText: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.white,
    },
    monthLabel: {
        fontSize: 16,
        color: COLORS.gray,
    },
});