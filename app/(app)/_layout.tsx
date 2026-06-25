import { useEffect } from "react";
import { Tabs } from "expo-router";
import { FloatingTabBar } from "@/components/FloatingTabBar";
import { useAuthStore } from "@/stores/auth.store";
import { useInventoryStore } from "@/stores/inventory.store";

export default function AppLayout() {
  const store_id = useAuthStore((s) => s.store?.id);
  const subscribe = useInventoryStore((s) => s.subscribe);
  const unsubscribe = useInventoryStore((s) => s.unsubscribe);

  // Una sola suscripción en tiempo real al inventario mientras la sesión está activa.
  useEffect(() => {
    if (!store_id) return;
    subscribe(store_id);
    return () => unsubscribe();
  }, [store_id, subscribe, unsubscribe]);

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
