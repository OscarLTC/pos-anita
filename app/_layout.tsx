import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/config/firebase.config";
import { useAuthStore } from "@/stores/auth.store";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { user, setUser } = useAuthStore();
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

  if (user === undefined) {
    return (
      <SafeAreaProvider>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#111" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}
