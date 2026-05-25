import { usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, Button, ScrollView } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import GastCateg from "@/components/GastCateg";
import UltTransac from "@/components/UltTransac";
import { COLORS } from "@/constants/colors";

export default function Home() {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentContainer}>
                    <ScrollView showsVerticalScrollIndicator={false} >

                        <Header/>
                        <GastCateg/>
                        <UltTransac/>

                    </ScrollView>
                </View>
                <BottomNav />
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentContainer: {
        flex: 1,
    },
});