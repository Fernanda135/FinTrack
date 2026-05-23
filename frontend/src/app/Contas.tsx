import { useRouter } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Plus, SquarePen, Trash2 } from "lucide-react-native";

import BottomNav from "@/components/BottomNav";
// import { contas } from "@/data/contas";
import {
    contas,
    categories,
    transacoes,
    orcamentos,
    dashboard,
} from "@/data/data";


export default function Contas() {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        {/* HEADER */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Contas</Text>
                            <Text style={styles.subtitle}>Saldo total consolidado</Text>
                            <Text style={styles.totalBalance}>{dashboard.saldoTotal}</Text>
                        </View>

                        {/* CARDS DAS CONTAS */}
                        <View style={styles.cardsContainer}>
                            {contas.map((conta) => (
                                <View
                                    key={conta.id}
                                    style={[styles.card, { backgroundColor: conta.cor }]}
                                >
                                    <View style={styles.cardTop}>
                                        <View style={styles.leftContent}>
                                            <View style={styles.iconBox} />

                                            <View>
                                                <Text style={styles.cardTitle}>{conta.label}</Text>
                                                <Text style={styles.cardSubtitle}>{conta.tipo}</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.balance}>
                                            {conta.saldo.toLocaleString("pt-BR", {
                                                style: "currency",
                                                currency: "BRL",
                                            })}
                                        </Text>
                                    </View>

                                    <View style={styles.line} />

                                    <View
                                        style={{
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <TouchableOpacity>
                                            <Trash2 size={18} color={"#ffffff"} />
                                        </TouchableOpacity>
                                        <TouchableOpacity>
                                            <SquarePen size={18} color={"#ffffff"} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity style={styles.addButton}>
                                <Plus size={30} color="#AAAAAA" />
                            </TouchableOpacity>

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
        backgroundColor: "#F8F8F8",
    },
    contentContainer: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 50,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 30,
        marginBottom: 10,
    },
    title: {
        color: "#1A1A1A",
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 20,
    },
    subtitle: {
        color: "#AAAAAA",
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    totalBalance: {
        color: "#1A1A1A",
        fontSize: 30,
        fontWeight: "bold",
    },
    cardsContainer: {
        paddingHorizontal: 16,
        gap: 18,
        marginTop: 50,
    },
    card: {
        borderRadius: 22,
        padding: 18,
        elevation: 5,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    leftContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#aaaaaa5f",
    },
    cardTitle: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    cardSubtitle: {
        color: "#FFF",
        fontSize: 11,
        marginTop: 2,
    },
    balance: {
        color: "#FFF",
        fontSize: 20,
        fontWeight: "bold",
    },
    line: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.25)",
        marginVertical: 16,
    },
    addButton: {
        height: 75,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#AAAAAA",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 25,
        marginBottom: 20,
    },});
