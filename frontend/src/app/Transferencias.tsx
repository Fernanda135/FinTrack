import React, { useState, useMemo } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
    SquareArrowUp,
    SquareArrowDown,
} from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import DetalhesTransacaoModal from "@/components/DetalhesTransacaoModal";
import EditarTransacaoModal from "@/components/EditarTransacaoModal";
import { useTransacoes } from "@/hooks/useTransacoes";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { COLORS } from "@/constants/colors";
import FiltroMensal from "@/components/FiltroMensal";

export default function Transferencias() {

    const { transacoes, carregando } = useTransacoes();
    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
    const [detalhesModalVisible, setDetalhesModalVisible] = useState(false);
    const [transacaoSelecionada, setTransacaoSelecionada] = useState<any>(null);
    const [editarModalVisible, setEditarModalVisible] = useState(false);


    const handleOpenDetails = (transacao: any) => {
        setTransacaoSelecionada(transacao);
        setDetalhesModalVisible(true);
    };

    const handleDelete = () => {
        setDetalhesModalVisible(false);
        setTransacaoSelecionada(null);
    };

    const handleEdit = () => {
        setDetalhesModalVisible(false);
        setEditarModalVisible(true);
    };


    const transacoesFiltradas = useMemo(() => {
        return transacoes.filter(t => {
            const data = new Date(t.data);
            return data.getMonth() === mesSelecionado &&
                data.getFullYear() === anoSelecionado;
        });
    }, [transacoes, mesSelecionado, anoSelecionado]);

    const transacoesOrdenadas = useMemo(() => {
        return [...transacoesFiltradas].sort((a, b) => {
            return new Date(b.data).getTime() - new Date(a.data).getTime();
        });
    }, [transacoesFiltradas]);

    const totalReceitas = transacoesOrdenadas
        .filter(t => t.tipo === "receita")
        .reduce((soma, t) => soma + t.valor, 0);
    
    const totalDespesas = transacoesOrdenadas
        .filter(t => t.tipo === "despesa")
        .reduce((soma, t) => soma + t.valor, 0);
    
    const saldo = totalReceitas - totalDespesas;

    if (carregando) {
        return (
            <SafeAreaProvider>
                <SafeAreaView style={styles.container}>
                    <View style={styles.contentContainer}>
                        <Text style={styles.loadingText}>Carregando transações...</Text>
                    </View>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >

                        <Text style={styles.header}>Transações</Text>

                        <FiltroMensal
                            transacoes={transacoes}
                            mesInicial={mesSelecionado}
                            anoInicial={anoSelecionado}
                            aoMudarMes={(ano: number, mes: number) => {
                                setAnoSelecionado(ano);
                                setMesSelecionado(mes);
                            }}
                        />

                        <View style={styles.resumoContainer}>
                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Receitas</Text>
                                <Text style={[styles.resumoValor, styles.receitaValor]}>
                                    +{formatCurrency(totalReceitas)}
                                </Text>
                            </View>
                            <View style={styles.resumoDivider} />
                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Despesas</Text>
                                <Text style={[styles.resumoValor, styles.despesaValor]}>
                                    -{formatCurrency(totalDespesas)}
                                </Text>
                            </View>
                            <View style={styles.resumoDivider} />
                            <View style={styles.resumoItem}>
                                <Text style={styles.resumoLabel}>Saldo</Text>
                                <Text style={[
                                    styles.resumoValor,
                                    saldo >= 0 ? styles.saldoPositivo : styles.saldoNegativo
                                ]}>
                                    {formatCurrency(saldo)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.transfContainer}>
                            <View style={styles.listHeader}>
                                <Text style={styles.listTitle}>Histórico</Text>
                                <Text style={styles.listCount}>
                                    {transacoesOrdenadas.length} transações
                                </Text>
                            </View>

                            {transacoesOrdenadas.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
                                    <Text style={styles.emptyText}>
                                        Não há transações para o período selecionado.
                                        Comece a adicionar suas receitas e despesas para acompanhar seu histórico financeiro.
                                    </Text>
                                </View>
                            ) : (
                                transacoesOrdenadas.map((item) => {
                                    const Icon = item.tipo === "receita" ? SquareArrowDown : SquareArrowUp;
                                    const iconColor = item.tipo === "receita" ? COLORS.success : COLORS.danger;
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            style={styles.transItem}
                                            activeOpacity={0.7}
                                            onPress={() => handleOpenDetails(item)}
                                        >
                                            <View style={[
                                                styles.iconContainer,
                                                { backgroundColor: item.tipo === "receita" ? COLORS.chart_income + '15' : COLORS.chart_expense + '15' }
                                            ]}>
                                                <Icon 
                                                    size={28} 
                                                    color={iconColor}
                                                    strokeWidth={1.5}
                                                />
                                            </View>

                                            <View style={styles.transInfo}>
                                                <Text style={styles.transTitulo} numberOfLines={1}>
                                                    {item.titulo}
                                                </Text>
                                                <Text style={styles.transSub}>
                                                    {item.categoria?.label || "Sem categoria"}
                                                </Text>
                                                <Text style={styles.transDate}>
                                                    {item.conta?.label || "Conta"} | {formatDate(item.data)}
                                                </Text>
                                            </View>

                                            <View style={styles.valorContainer}>
                                                <Text style={[
                                                    styles.transValor,
                                                    item.tipo === "receita"
                                                        ? styles.valorReceita
                                                        : styles.valorDespesa,
                                                ]}
                                                >
                                                    {item.tipo === "receita" ? "+" : "-"}
                                                    {formatCurrency(item.valor)}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </View>

                    </ScrollView>
                </View>

                <BottomNav />

                <DetalhesTransacaoModal
                    visible={detalhesModalVisible}
                    onClose={() => {
                        setDetalhesModalVisible(false);
                        setTransacaoSelecionada(null);
                    }}
                    transacao={transacaoSelecionada}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />

                <EditarTransacaoModal
                    visible={editarModalVisible}
                    onClose={() => {
                        setEditarModalVisible(false);
                        setTransacaoSelecionada(null);
                    }}
                    transacao={transacaoSelecionada}
                />
                
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    contentContainer: {
        flex: 1,
        width: "100%",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        color: COLORS.primary,
        fontWeight: "bold",
        fontSize: 30,
        padding: 20,
        marginTop: 25,
        marginBottom: 20,
        textAlign: "center",
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },
    resumoContainer: {
        flexDirection: "row",
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.borderGray,
        paddingVertical: 16,
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    resumoItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    resumoDivider: {
        width: 2,
        backgroundColor: COLORS.borderGray,
        marginHorizontal: 4,
    },
    resumoLabel: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    resumoValor: {
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 0.2,
    },
    receitaValor: {
        color: COLORS.success,
    },
    despesaValor: {
        color: COLORS.danger,
    },
    saldoPositivo: {
        color: COLORS.success,
    },
    saldoNegativo: {
        color: COLORS.danger,
    },
    transfContainer: {
        backgroundColor: COLORS.white,
        width: "100%",
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingBottom: 30,
        minHeight: 400,
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        letterSpacing: 0.3,
    },
    listCount: {
        fontSize: 13,
        color: COLORS.gray,
    },
    transItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        marginHorizontal: 16,
        marginBottom: 6,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        flexShrink: 0,
    },
    transInfo: {
        flex: 1,
        minWidth: 0,
    },
    transTitulo: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.black,
        marginBottom: 2,
        letterSpacing: 0.2,
    },
    transSub: {
        fontSize: 12,
        color: COLORS.gray,
        marginBottom: 2,
    },
    transDate: {
        fontSize: 11,
        color: COLORS.gray,
        letterSpacing: 0.1,
    },
    valorContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
        flexShrink: 0,
    },
    transValor: {
        fontSize: 16,
        fontWeight: "bold",
    },
    valorReceita: {
        color: COLORS.success,
    },
    valorDespesa: {
        color: COLORS.danger,
    },
    emptyContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 40,
        alignItems: "center",
        marginHorizontal: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        borderStyle: "dashed",
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.black,
        marginBottom: 8,
        textAlign: "center"
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: "center",
        lineHeight: 20,
    },
});