import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { initials } from "@/lib/format";
import { ROLE_LABEL, ROLE_COLOR } from "@/lib/permissions";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";

interface Props {
  onBack: () => void;
}

/** Lista las tiendas del usuario y permite cambiar la activa. */
export function StoreSwitcherSheet({ onBack }: Props) {
  const memberships = useAuthStore((s) => s.memberships);
  const activeId = useAuthStore((s) => s.store?.id);
  const switchStore = useAuthStore((s) => s.switchStore);

  const handleSelect = async (storeId: string) => {
    if (storeId !== activeId) await switchStore(storeId);
    onBack();
  };

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <Text style={s.title}>Cambiar de tienda</Text>
      <Text style={s.subtitle}>
        {memberships.length} {memberships.length === 1 ? "tienda" : "tiendas"} disponibles
      </Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {memberships.map(({ store, role }) => {
          const isActive = store.id === activeId;
          return (
            <TouchableOpacity
              key={store.id}
              style={[s.card, isActive && s.cardActive]}
              onPress={() => handleSelect(store.id)}
              activeOpacity={0.8}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials(store.name)}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name} numberOfLines={1}>
                  {store.name}
                </Text>
                <View style={[s.roleChip, { backgroundColor: ROLE_COLOR[role] + "22" }]}>
                  <Text style={[s.roleText, { color: ROLE_COLOR[role] }]}>
                    {ROLE_LABEL[role].toUpperCase()}
                  </Text>
                </View>
              </View>
              {isActive ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: spacing.sm },
  backText: { ...typography.body, color: colors.inkMid },
  title: { ...typography.display, fontSize: 26, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.inkSoft, marginTop: 2, marginBottom: spacing.md },

  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.sm },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.shadow,
  },
  cardActive: { borderColor: colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryInk, fontFamily: fontFamilies.display, fontSize: fontSize.md },
  info: { flex: 1, gap: 4 },
  name: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  roleChip: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleText: { fontSize: 10, fontFamily: fontFamilies.display, letterSpacing: 0.5 },
});
