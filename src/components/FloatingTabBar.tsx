import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, spacing, radius, fontFamilies, shadows } from "@/theme";

type TabConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

// Solo las rutas listadas aquí aparecen en la barra (y en este orden).
// Las demás pantallas del grupo (app) quedan ocultas de la navegación.
const TABS: Record<string, TabConfig> = {
  sales: { label: "Venta", icon: "cart-outline", iconActive: "cart" },
  inventory: { label: "Inventario", icon: "cube-outline", iconActive: "cube" },
  fiados: { label: "Fiados", icon: "document-text-outline", iconActive: "document-text" },
  reportes: { label: "Reportes", icon: "stats-chart-outline", iconActive: "stats-chart" },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedKey = state.routes[state.index].key;
  const items = state.routes.filter((route) => route.name in TABS);

  return (
    <View
      style={[styles.wrap, { paddingBottom: insets.bottom ? insets.bottom : spacing.md }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {items.map((route) => {
          const tab = TABS[route.name];
          const isFocused = route.key === focusedKey;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const tint = isFocused ? colors.primary : colors.inkSoft;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={tab.label}
              onPress={onPress}
              style={styles.item}
              activeOpacity={0.7}
            >
              <Ionicons name={isFocused ? tab.iconActive : tab.icon} size={22} color={tint} />
              <Text
                style={[
                  styles.label,
                  { color: tint, fontFamily: isFocused ? fontFamilies.display : fontFamilies.body },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    ...shadows.shadowLg,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 11,
  },
});
