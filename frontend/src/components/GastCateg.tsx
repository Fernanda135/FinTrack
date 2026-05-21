import { Text, View, StyleSheet, Image } from 'react-native';

export default function GastCateg() {
    return (
        <View style={styles.container}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, width: '100%' }} >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' }} >Gastos por categoria</Text>
                <Text style={{ fontSize: 14, color: '#AAAAAA' }} >Ver tudo</Text>
            </View>

            <View style={styles.categoryCard}>
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
    categoryCard: {
        width: '100%',
        height: 130,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 10,
        marginBottom: 12,
    }
});
