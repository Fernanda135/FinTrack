import { Text, View, StyleSheet, Image } from 'react-native';
import { useDashboard } from '@/hooks/useDashboard';


export default function Header() {

    const { saldoTotal, receitaTotal, gastoTotal } = useDashboard();

    return (
        <View style={styles.container}>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }} >
                <View style={styles.user} />
                <View>
                    <Text style={{ color: '#949390', fontSize: 14 }} >Bem Vindo,</Text>
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }} >Fulano</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={{ color: '#AAAAAA', fontSize: 14, fontWeight: 'bold' }} >SALDO TOTAL</Text>
                <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 34 }} >{saldoTotal}</Text>
                
                <View style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Receitas</Text>
                        <Text style={styles.infoValue}>{receitaTotal}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Gastos</Text>
                        <Text style={styles.infoValue}>{gastoTotal}</Text>
                    </View>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222222',
        padding: 16,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 20,
        height: 350,
        elevation: 5,
    },
    user: {
        backgroundColor: '#ffffff',
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
        backgroundColor: "#9cff19",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
    },
    infoLabel: {
        color: "#1A1A1A",
        fontSize: 11,
        fontWeight: "bold",
        marginBottom: 4,
        textTransform: "uppercase",
    },
    infoValue: {
        color: "#1A1A1A",
        fontSize: 16,
        fontWeight: "bold",
    },
});
