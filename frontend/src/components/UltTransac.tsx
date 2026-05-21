import { Text, View, StyleSheet, FlatList } from 'react-native';

export default function UltTransac() {
    // Array com 5 itens vazios
    const data = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4' },
        { id: '5' },
    ];

    // Renderiza cada item - apenas a View vazia
    const renderItem = () => (
        <View style={styles.transactionCard} />
    );

    return (
        <View style={styles.container}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }} >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' }} >Últimas transações</Text>
                <Text style={{ fontSize: 14, color: '#AAAAAA' }} >Ver tudo</Text>
            </View>

            <View style={{ width: '100%' }}>
                {data.map((item) => (
                    <View key={item.id} style={styles.transactionCard} />
                ))}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
    },
    transactionCard: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 10,
        marginBottom: 12,
    },
});