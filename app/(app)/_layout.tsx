import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="sales" options={{ title: "Venta" }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventario" }} />
      <Tabs.Screen name="fiados" options={{ title: "Fiados" }} />
      <Tabs.Screen name="reportes" options={{ title: "Reportes" }} />
      {/* Caja sale de la barra; se mantiene la ruta accesible por enlace directo. */}
      <Tabs.Screen name="register" options={{ href: null }} />
    </Tabs>
  );
}
