import * as React from "react";
import { StyleSheet, View, Text } from "react-native";
import { BottomNavigation } from "react-native-paper";
import { router, usePathname } from "expo-router";
import { Home, Landmark, Plus, PieChart, ArrowLeftRight } from "lucide-react-native";

export default function BottomNav() {
    const pathname = usePathname();

    const routes = [
        {
            key: "home",
            title: "Inicio",
            path: "/",
            icon: Home,
        },
        {
            key: "contas",
            title: "Contas",
            path: "/Contas",
            icon: Landmark,
        },
        {
            key: "nova",
            title: "",
            path: "/nova-transacao",
            icon: Plus,
            isPlus: true,
        },
        {
            key: "metas",
            title: "Metas",
            path: "/Metas",
            icon: PieChart,
        },
        {
            key: "transferencias",
            title: "Transf.",
            path: "/Transferencias",
            icon: ArrowLeftRight,
        },
    ];

    const getIndex = () => {
        const index = routes.findIndex((item) => item.path === pathname);
        return index !== -1 ? index : 0;
    };

    const [index, setIndex] = React.useState(getIndex());

    React.useEffect(() => {
        setIndex(getIndex());
    }, [pathname]);

    const renderIcon = ({ route, focused }: { route: any; focused: boolean }) => {
        const Icon = route.icon;

        if (route.isPlus) {
            return (
                <View style={styles.plusButton}>
                    <Plus size={28} color="#222" strokeWidth={3} />
                </View>
            );
        }

        return <Icon size={22} color={focused ? "#9CFF19" : "#777"} />;
    };

    const renderLabel = ({ route, focused }: { route: any; focused: boolean }) => {
        if (route.isPlus) return null;
        return (
            <Text style={[styles.label, focused && styles.labelActive]}>
                {route.title}
            </Text>
        );
    };

    return (
        <BottomNavigation.Bar
            activeIndicatorStyle={{
                backgroundColor: "transparent",
            }}
            navigationState={{
                index,
                routes,
            }}
            onTabPress={({ route }) => {
                router.push(route.path);
            }}
            renderIcon={renderIcon}
            renderLabel={renderLabel}
            activeColor="#9CFF19"
            inactiveColor="#777"
            style={styles.bottomNav}
            labeled
            shifting={false}
        />
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        backgroundColor: "#222222",
        height: 75,
        borderTopWidth: 0,
        elevation: 0,
    },
    plusButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#9CFF19",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
        marginTop: -10,
    },
    label: {
        color: "#777",
        fontSize: 11,
        marginTop: -6,
        fontWeight: "500",
        textAlign: "center",
    },
    labelActive: {
        color: "#9CFF19",
    },
});