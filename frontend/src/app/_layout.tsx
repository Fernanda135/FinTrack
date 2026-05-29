import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/Toast/toastConfig";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";

function Guard() {
    const { ready, signedIn } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!ready) return;
        const onLogin = segments[0] === "Login";
        if (!signedIn && !onLogin) router.replace("/Login");
        if (signedIn && onLogin) router.replace("/");
    }, [ready, signedIn, segments]);

    if (!ready) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
    return (
        <AuthProvider>
            <Guard />
            <Toast config={toastConfig} topOffset={60} />
        </AuthProvider>
    );
}
