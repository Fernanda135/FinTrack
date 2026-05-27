import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/Toast/toastConfig';


export default function Layout() {
    return (
        <>
            <Stack screenOptions={{ headerShown: false }} />
            <Toast config={toastConfig} topOffset={60} />
        </>
    )
}
