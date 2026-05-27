import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToast, ErrorToast, InfoToast } from "react-native-toast-message";

import { COLORS } from "@/constants/colors";

export const toastConfig = {
    success: (props: any) => (
        <BaseToast
            {...props}
            style={styles.successContainer}
            contentContainerStyle={styles.content}
            text1Style={styles.successText}
        />
    ),

    error: (props: any) => (
        <ErrorToast
            {...props}
            style={styles.errorContainer}
            contentContainerStyle={styles.content}
            text1Style={styles.errorText}
        />
    ),

    info: (props: any) => (
        <InfoToast
        {...props}
            style={styles.infoContainer}
            contentContainerStyle={styles.content}
            text1Style={styles.infoText}
        />
    ),
};

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 15,
    },

    successContainer: {
        borderLeftColor: COLORS.success,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        minHeight: 60,
    },

    errorContainer: {
        borderLeftColor: COLORS.danger,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        minHeight: 60,
    },

    infoContainer: {
        borderLeftColor: COLORS.warning,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        minHeight: 60,
    },

    successText: {
        color: COLORS.darkBackground,
        fontSize: 14,
        fontWeight: "600",
    },

    errorText: {
        color: COLORS.darkBackground,
        fontSize: 14,
        fontWeight: "600",
    },

    infoText: {
        color: COLORS.darkBackground,
        fontSize: 14,
        fontWeight: "600",
    },
});