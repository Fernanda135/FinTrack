import { Text, View, StyleSheet, Image } from 'react-native';

import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatCurrency';
import { COLORS } from '@/constants/colors';


export default function Header() {

    const { saldoTotal, receitaTotal, gastoTotal } = useDashboard();

    return (
        <View style={styles.container}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }} >
                <View style={styles.user} />
                <View>
                    <Text style={{ color: COLORS.gray, fontSize: 14 }} >Bem Vindo,</Text>
                    <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 18 }} >Fulano</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={{ color: COLORS.gray, fontSize: 14, fontWeight: 'bold' }} >SALDO TOTAL</Text>
                <Text style={{ color: COLORS.white, fontWeight: 'bold', fontSize: 34 }} >{formatCurrency(saldoTotal)}</Text>
                
                <View style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Receitas</Text>
                        <Text style={styles.infoValue}>{formatCurrency(receitaTotal)}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Gastos</Text>
                        <Text style={styles.infoValue}>{formatCurrency(gastoTotal)}</Text>
                    </View>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
        padding: 16,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        height: 350,
        elevation: 5,
    },
    user: {
        backgroundColor: COLORS.white,
        width: 51,
        height: 51,
        borderRadius: 50
    },
    card: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        width: 317,
        height: 132,
        borderRadius: 20,
        padding: 25,
        marginTop: 80,
        marginBottom: 20,
    },
    infoContainer: {
        flexDirection: "row",
        gap: 15,
        marginTop: 20,
    },
    infoCard: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
    },
    infoLabel: {
        color: COLORS.black,
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    infoValue: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: "bold",
    },
});
