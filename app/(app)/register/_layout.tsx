import { Stack } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore } from "@/theme";

export default function RegisterLayout() {
  const { logout } = useAuthStore();
  const { isDark, colors, toggle } = useThemeStore();

  const headerRight = () => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 8 }}>
      <TouchableOpacity onPress={toggle} hitSlop={8}>
        <Ionicons
          name={isDark ? "sunny-outline" : "moon-outline"}
          size={22}
          color={colors.text}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={logout} hitSlop={8}>
        <Ionicons name="log-out-outline" size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "500" },
        headerRight,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Caja del día" }} />
    </Stack>
  );
}
