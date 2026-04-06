import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#fff" },
        headerShadowVisible: false,
        headerTintColor: "#111",
        headerTitleStyle: { fontWeight: "500" },
      }}
    />
  );
}
