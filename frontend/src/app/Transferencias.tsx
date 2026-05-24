import { usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
    SquareArrowUp,
    SquareArrowDown,
    ArrowBigDown,
} from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
import { useTransacoes } from "@/hooks/useTransacoes";


export default function Transferencias() {

    const { transacoes } = useTransacoes();

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* HEADER */}
                        <Text style={styles.header} >Transações</Text>

                        {/* LISTA DE TRANSFERÊNCIAS */}
                        <View style={styles.transfContainer}>
                            {transacoes.map((item) => {
                                const categoria = transacoes.find(
                                    (cat) => cat.id === item.categoriaId,
                                );

                                const conta = transacoes.find((conta) => conta.id === item.contaId);

                                return (
                                    <View key={item.id} style={styles.transItem}>
                                        <View>
                                            {item.tipo === "receita" ? (
                                                <SquareArrowDown size={47} strokeWidth={0.8} color="#383A39" />
                                            ) : (
                                                <SquareArrowUp size={47} strokeWidth={0.8} color="#383A39" />
                                            )}
                                        </View>

                                        <View style={styles.transInfo}>
                                            <Text style={styles.transTitulo}>{item.titulo}</Text>
                                            <Text style={styles.transSub}>{item.categoria?.label}</Text>
                                            <Text style={styles.transDate}>
                                                {item.categoria?.label} | {new Date(item.data).toLocaleDateString("pt-BR", {
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
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
                                                {item.valor.toLocaleString("pt-BR", {
                                                    style: "currency",
                                                    currency: "BRL",
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                </View>
                <BottomNav />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#222222",
    },
    contentContainer: {
        flex: 1,
        width: "100%",
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        color: "#9CFF19",
        fontWeight: "bold",
        fontSize: 30,
        padding: 20,
        marginTop: 25,
        marginBottom: 20,
        textAlign: "center",
    },
    transfContainer: {
        backgroundColor: "#F8F8F8",
        width: "100%",
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
    },
    transItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        marginHorizontal: 16,
        marginBottom: 10,
        borderBottomColor: "#383A39",
        borderBottomWidth: 1,
        gap: 10,
    },
    transInfo: {
        flex: 1,
    },
    transTitulo: {
        fontSize: 16,
        color: "#383A39",
        marginBottom: 4,
    },
    transSub: {
        fontSize: 12,
        color: "#AAAAAA",
    },
    valorContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    transValor: {
        fontSize: 16,
    },
    transDate: {
        fontSize: 11,
        color: "#AAAAAA",
        marginTop: 4,
    },
    valorReceita: {
        color: "#116e1f",
    },
    valorDespesa: {
        color: "#a70205",
    },
});
