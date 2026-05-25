import * as React from "react";
import { StyleSheet, View, Text } from "react-native";
import { BottomNavigation } from "react-native-paper";
import { router, usePathname } from "expo-router";
import {
    Home,
    Landmark,
    Plus,
    PieChart,
    ArrowLeftRight,
} from "lucide-react-native";
import NovaTransacaoModal from "./NovaTransacaoModal";
import { COLORS } from "@/constants/colors";

export default function BottomNav() {

    const pathname = usePathname();
    const [modalVisible, setModalVisible] = React.useState(false);

    const routes = [
        { key: "home", title: "Inicio", path: "/", icon: Home },
        { key: "contas", title: "Contas", path: "/Contas", icon: Landmark },
        { key: "nova", title: "", path: null, icon: Plus, isPlus: true },
        { key: "orcamentos", title: "Orçame.", path: "/Orcamentos", icon: PieChart },
        { key: "transferencias", title: "Transf.", path: "/Transferencias", icon: ArrowLeftRight },
    ];

    const getIndex = () => {
        const index = routes.findIndex((item) => item.path === pathname);
        return index !== -1 ? index : 0;
    };
    const [index, setIndex] = React.useState(getIndex());
    React.useEffect(() => { setIndex(getIndex()) }, [pathname]);

    const renderIcon = ({ route, focused }: any) => {
        const Icon = route.icon;

        if (route.isPlus) {
            return (
                <View style={styles.plusBtn}>
                    <Plus size={28} color={COLORS.darkBackground} strokeWidth={3} />
                </View>
            );
        }
        return <Icon size={22} color={focused ? COLORS.primary : COLORS.gray} />;
    };

    const renderLabel = ({ route, focused }: any) => {
        if (route.isPlus) return null;
        return (
            <Text style={[styles.label, focused && styles.labelActive]}>
                {route.title}
            </Text>
        );
    };

    const handleTabPress = (route: any) => {
        if (route.isPlus) return setModalVisible(true); 
        return router.push(route.path);
    };

    return (
        <>
            <BottomNavigation.Bar
                activeIndicatorStyle={{ backgroundColor: "transparent" }}
                navigationState={{ index, routes }}
                onTabPress={({ route }) => handleTabPress(route)}
                renderIcon={renderIcon}
                renderLabel={renderLabel}
                activeColor={COLORS.primary}
                inactiveColor={COLORS.gray}
                style={styles.bottomNav}
                labeled
                shifting={false} />

            <NovaTransacaoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)} />
        </>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        backgroundColor: COLORS.darkBackground,
        height: 75,
        borderTopWidth: 0,
        elevation: 0,
    },
    plusBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
        marginTop: -10,
    },
    label: {
        color: COLORS.gray,
        fontSize: 11,
        marginTop: -6,
        fontWeight: "500",
        textAlign: "center",
    },
    labelActive: {
        color: COLORS.primary,
    },
});
