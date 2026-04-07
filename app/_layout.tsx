import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/theme";

export default function RootLayout() {
  const { user, setUser } = useAuthStore();
  const { isDark, colors } = useThemeStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && !inAppGroup) {
      router.replace("/(app)/inventory");
    }
  }, [user, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style={isDark ? "light" : "dark"}
          backgroundColor={colors.bg}
        />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
