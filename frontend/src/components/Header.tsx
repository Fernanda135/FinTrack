import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useDashboard } from '@/hooks/useDashboard';
import { formatCurrency } from '@/utils/formatCurrency';
import { COLORS } from '@/constants/colors';
import { useAuth } from "@/context/AuthContext";
import { LogOut, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

export default function Header() {
    const { user, logout } = useAuth();
    const { saldoTotal, receitaTotal, gastoTotal } = useDashboard();

    const displayName = user?.name || "Usuário";
    const userInitial = displayName.charAt(0).toUpperCase();

    return (
        <View style={styles.container}>

            <View style={styles.headerRow}>
                <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userInitial}>{userInitial}</Text>
                    </View>
                    <View>
                        <Text style={styles.welcomeText}>Bem Vindo,</Text>
                        <Text style={styles.userName}>{displayName}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <LogOut color={COLORS.error} size={22} />
                </TouchableOpacity>
            </View>

            <Text style={styles.balanceLabel}>SALDO TOTAL</Text>
            <Text style={styles.balanceValue}>{formatCurrency(saldoTotal)}</Text>

            <View style={styles.infoContainer}>
                <View style={[styles.infoCard, styles.revenueCard]}>
                    <View style={styles.iconContainer}>
                        <ArrowDownLeft size={20} color={COLORS.success} />
                    </View>
                    <View>
                        <Text style={styles.infoLabel}>Receitas</Text>
                        <Text style={styles.infoValue}>{formatCurrency(receitaTotal)}</Text>
                    </View>
                </View>

                <View style={[styles.infoCard, styles.expenseCard]}>
                    <View style={styles.iconContainer}>
                        <ArrowUpRight size={20} color={COLORS.error} />
                    </View>
                    <View>
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
        backgroundColor: COLORS.darkBackground,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userAvatar: {
        backgroundColor: COLORS.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    userInitial: {
        color: COLORS.darkBackground,
        fontSize: 22,
        fontWeight: 'bold',
    },
    welcomeText: {
        color: COLORS.gray,
        fontSize: 13,
        fontWeight: '500',
    },
    userName: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 18,
        marginTop: 2,
    },
    logoutButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
    },
    balanceLabel: {
        color: COLORS.gray,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 4,
    },
    balanceValue: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 36,
        marginBottom: 20,
    },
    infoContainer: {
        flexDirection: "row",
        gap: 12,
    },
    infoCard: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 8,
        gap: 12,
        marginTop: 24,
    },
    revenueCard: {
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(52, 199, 89, 0.2)',
    },
    expenseCard: {
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 59, 48, 0.2)',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        color: COLORS.gray,
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    infoValue: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});