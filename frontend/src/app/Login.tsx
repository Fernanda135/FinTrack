import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { COLORS } from "@/constants/colors";
import { showError } from "@/components/Toast/toast";

export default function Login() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("demo@fintrack.app");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("demo1234");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setLoading(true);
        try {
            if (mode === "login") {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), name.trim(), password);
            }
        } catch (e: any) {
            showError(e?.message ?? "Falha na autenticação");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={s.c}>
            <Text style={s.title}>FinTrack</Text>
            <Text style={s.subtitle}>
                {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </Text>

            {mode === "register" && (
                <TextInput
                    style={s.input}
                    placeholder="Nome"
                    placeholderTextColor={COLORS.gray}
                    value={name}
                    onChangeText={setName}
                />
            )}
            <TextInput
                style={s.input}
                placeholder="Email"
                placeholderTextColor={COLORS.gray}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={s.input}
                placeholder="Senha"
                placeholderTextColor={COLORS.gray}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color={COLORS.black} />
                ) : (
                    <Text style={s.btnText}>{mode === "login" ? "Entrar" : "Cadastrar"}</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setMode(mode === "login" ? "register" : "login")}
            >
                <Text style={s.switch}>
                    {mode === "login"
                        ? "Não tem conta? Cadastre-se"
                        : "Já tem conta? Entrar"}
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    c: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        gap: 14,
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        textAlign: "center",
        color: COLORS.black,
    },
    subtitle: {
        fontSize: 15,
        textAlign: "center",
        color: COLORS.gray,
        marginBottom: 10,
    },
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.black,
    },
    btn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 10,
    },
    btnText: { fontWeight: "bold", fontSize: 16, color: COLORS.black },
    switch: {
        textAlign: "center",
        color: COLORS.gray,
        marginTop: 8,
        fontSize: 14,
    },
});
