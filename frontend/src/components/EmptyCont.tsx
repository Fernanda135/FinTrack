import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "@/constants/colors";


type EmptyContProps = {
    titulo: string;
    texto: string;
};

export default function EmptyCont({ titulo, texto }: EmptyContProps) {
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{titulo ?? "Sem conteúdo para esse mês"}</Text>
            <Text style={styles.emptyText}>{texto ?? ""}</Text>
        </View>
    );
}



const styles = StyleSheet.create({
    emptyContainer: {
        width: "100%",
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.borderGray,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        color: COLORS.black,
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.gray,
        textAlign: "center",
        lineHeight: 20,
        maxWidth: "80%",
    },
});