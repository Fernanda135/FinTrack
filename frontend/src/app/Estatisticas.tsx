import { useState } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Dimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
    LineChart,
    PieChart,
} from "react-native-chart-kit";

import { useEstatisticas } from "@/hooks/useEstatisticas";
import BottomNav from "@/components/BottomNav";
import { COLORS } from "@/constants/colors";
import { formatCurrency } from "@/utils/formatCurrency";
import FiltroMensal from "@/components/FiltroMensal";
import { useTransacoes } from "@/hooks/useTransacoes";

const screenWidth = Dimensions.get("window").width;
const CHART_WIDTH = screenWidth - 80;

const chartConfig = {
    backgroundColor: COLORS.white,
    backgroundGradientFrom: COLORS.white,
    backgroundGradientTo: COLORS.white,
    decimalPlaces: 2,

    color: (opacidade = 1) => `rgba(34, 34, 34, ${opacidade})`,
    labelColor: (opacidade = 1) => `rgba(26, 26, 26, ${opacidade})`,
    fillShadowGradient: "rgba(96, 101, 90, 0.29)",
    fillShadowGradientOpacity: 0.3,

    propsForBackgroundLines: {
        strokeDasharray: "3",
        stroke: COLORS.lightGray,
    },
    propsForDots: {
        r: "2.5",
        strokeWidth: "0",
    },
    style: {
        borderRadius: 16,
        padding: 20,
    },
};

export default function Estatisticas() {

    const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

    const {
        carregando,
        totais,
        saldoAcumulado,
        despesaAcumulado,
        receitasDespesas,
        gastosCategorias,
        distribuicaoContas,
    } = useEstatisticas(mesSelecionado, anoSelecionado);

    const { transacoes } = useTransacoes();

    if (carregando) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    const dadosPieChartCategorias = gastosCategorias.map(item => ({
        name: item.nome,
        population: item.valor,
        color: item.cor,
        legendFontColor: item.corLegenda,
        legendFontSize: item.tamanhoFonteLegenda,
    }));


    const dadosPieChartContas = distribuicaoContas
        .filter(item => item.valor > 0)
        .map(item => ({
            name: item.nome,
            population: item.valor,
            color: item.cor,
            legendFontColor: item.corLegenda,
            legendFontSize: item.tamanhoFonteLegenda,
        }));


    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                    >
                        
                        <View style={styles.header}>
                            <Text style={styles.title}>Estatísticas</Text>
                        </View>

                        <FiltroMensal
                            transacoes={transacoes}
                            aoMudarMes={(ano, mes) => {
                                setAnoSelecionado(ano);
                                setMesSelecionado(mes);
                            }}
                        />

                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Receitas</Text>
                                <Text style={[styles.summaryValue, { color: COLORS.chart_income }]}>
                                    {formatCurrency(totais.totalReceitas)}
                                </Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Despesas</Text>
                                <Text style={[styles.summaryValue, { color: COLORS.chart_expense }]}>
                                    {formatCurrency(totais.totalDespesas)}
                                </Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Saldo</Text>
                                <Text style={[
                                    styles.summaryValue,
                                    { color: totais.saldo >= 0 ? COLORS.chart_income : COLORS.chart_expense }
                                ]}>
                                    {formatCurrency(totais.saldo)}
                                </Text>
                            </View>
                        </View>

                        {/* PROGRESSÃO DE SALDO */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Progressão de Saldo</Text>
                            <LineChart
                                data={saldoAcumulado}
                                width={CHART_WIDTH}
                                height={200}
                                yAxisLabel="R$ "
                                yAxisSuffix=""
                                chartConfig={chartConfig}
                                withInnerLines={true}
                                withOuterLines={false}
                                bezier
                                style={styles.chart}
                            />
                        </View>

                        {/* PROGRESSÃO DE DESPESAS */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Progressão de Despesas</Text>
                            <LineChart
                                data={despesaAcumulado}
                                width={CHART_WIDTH}
                                height={200}
                                yAxisLabel="R$ "
                                yAxisSuffix=""
                                chartConfig={chartConfig}
                                withInnerLines={true}
                                withOuterLines={false}
                                bezier
                                style={styles.chart}
                            />
                        </View>

                        {/* RECEITAS VS DESPESAS */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Receitas vs Despesas</Text>
                            <LineChart
                                data={receitasDespesas}
                                width={CHART_WIDTH}
                                height={200}
                                yAxisLabel="R$ "
                                yAxisSuffix=""
                                chartConfig={chartConfig}
                                bezier
                                withShadow={false}
                                style={styles.chart}
                            />
                        </View>

                        {/* GASTOS POR CATEGORIA */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Gastos por Categoria</Text>
                            {dadosPieChartCategorias.length > 0 ? (
                                <PieChart
                                    data={dadosPieChartCategorias}
                                    width={CHART_WIDTH}
                                    height={180}
                                    chartConfig={chartConfig}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="0"
                                    hasLegend={true}
                                    style={styles.pieChart}
                                />
                            ) : (
                                <Text style={styles.emptyChartText}>Nenhum gasto neste período</Text>
                            )}
                        </View>

                        {/* DISTRIBUIÇÃO POR CONTA */}
                        <View style={styles.chartCard}>
                            <Text style={styles.cardTitle}>Distribuição por Conta</Text>
                            {dadosPieChartContas.length > 0 ? (
                                <PieChart
                                    data={dadosPieChartContas}
                                    width={CHART_WIDTH}
                                    height={180}
                                    chartConfig={chartConfig}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="0"
                                    hasLegend={true}
                                    style={styles.pieChart}
                                />
                            ) : (
                                <Text style={styles.emptyChartText}>Nenhuma conta com saldo</Text>
                            )}
                        </View>

                        <View style={{ height: 20 }} />

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
        backgroundColor: COLORS.darkBackground,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 80,
        paddingTop: 16,
    },
    header: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    title: {
        color: COLORS.primary,
        fontSize: 28,
        fontWeight: "bold",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        marginTop: 50,
    },
    emptyTitle: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    emptyText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.7,
    },
    emptyChartText: {
        color: COLORS.gray,
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: 20,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    summaryLabel: {
        fontSize: 12,
        color: COLORS.darkBackground,
        opacity: 0.7,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    chartCard: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: "600",
        alignSelf: "flex-start",
        color: COLORS.darkBackground,
    },
    chart: {
        marginVertical: 0,
        borderRadius: 16,
    },
    pieChart: {
        marginVertical: 0,
    },
    loadingText: {
        color: COLORS.white,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
    },
});