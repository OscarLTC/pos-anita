import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { useAuthStore } from "@/stores/auth.store";
import { useInviteStore } from "@/stores/invite.store";
import { fontAssets, useThemeStore } from "@/theme";

export default function RootLayout() {
  const { user, store, setUser, loadStore } = useAuthStore();
  const { isDark, colors } = useThemeStore();
  const [fontsLoaded] = useFonts(fontAssets);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadStore(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    if (user && store === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";
    // La pantalla de invitación se gestiona sola (login/aceptar), no la redirigimos.
    const inInvite = segments[0] === "invite";
    const pendingInvite = useInviteStore.getState().token;

    if (!user && !inAuthGroup && !inInvite) {
      router.replace("/(auth)/login");
    } else if (user && store) {
      if (pendingInvite && !inInvite) {
        router.replace(`/invite/${pendingInvite}`);
      } else if (!inAppGroup && !inInvite) {
        router.replace("/(app)/sales");
      }
    }
  }, [user, store, segments]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.bg} />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
