import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { BusinessInfoSheet } from "@/components/BusinessInfoSheet";
import { StoreSwitcherSheet } from "@/components/StoreSwitcherSheet";
import { DeleteAccountSheet } from "@/components/DeleteAccountSheet";
import { UsersSheet } from "@/components/UsersSheet";
import { NotificationsSheet } from "@/components/NotificationsSheet";
import { TicketsSheet } from "@/components/TicketsSheet";
import { SubscriptionSheet } from "@/components/SubscriptionSheet";
import { useAuthStore } from "@/stores/auth.store";
import { initials } from "@/lib/format";
import { capabilitiesFor, type Capabilities } from "@/lib/permissions";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

type Page = "cuenta" | "biz" | "switch" | "users" | "notifs" | "tickets" | "sub" | "danger";

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent?: boolean;
  /** Página a la que navega (si no, muestra "Próximamente"). */
  page?: Exclude<Page, "cuenta">;
  /** Capacidad requerida para mostrar la opción. */
  need?: keyof Capabilities;
}

const MENU: MenuItem[] = [
  {
    icon: "document-text-outline",
    title: "Datos del negocio",
    subtitle: "Nombre, RUC, dirección",
    page: "biz",
    need: "editBusiness",
  },
  {
    icon: "people-outline",
    title: "Usuarios y permisos",
    subtitle: "Cajeros, gerencia",
    page: "users",
    need: "manageUsers",
  },
  {
    icon: "notifications-outline",
    title: "Notificaciones",
    subtitle: "WhatsApp, recordatorios",
    page: "notifs",
    need: "editBusiness",
  },
  {
    icon: "print-outline",
    title: "Impresoras y tickets",
    subtitle: "Configura tu impresora",
    page: "tickets",
    need: "editBusiness",
  },
  {
    icon: "star",
    title: "Suscripción",
    subtitle: "Plan gratis · sube a Pro",
    accent: true,
    page: "sub",
    need: "editBusiness",
  },
];

const soon = () => Alert.alert("Próximamente", "Esta opción estará disponible pronto.");

export function AccountSheet({ visible, onClose, onLogout }: Props) {
  const user = useAuthStore((s) => s.user);
  const store = useAuthStore((s) => s.store);
  const role = useAuthStore((s) => s.role);
  const memberships = useAuthStore((s) => s.memberships);
  const updateStore = useAuthStore((s) => s.updateStore);

  const multiStore = memberships.length > 1;

  const caps = capabilitiesFor(role);
  const menu = MENU.filter((item) => !item.need || caps[item.need]);

  const name = user?.displayName || store?.name || user?.email?.split("@")[0] || "Mi cuenta";
  const email = user?.email ?? "";

  const [page, setPage] = useState<Page>("cuenta");
  // Al cerrar del todo la hoja, vuelve siempre a la página de Cuenta.
  useEffect(() => {
    if (!visible) setPage("cuenta");
  }, [visible]);

  const handleClose = () => (page !== "cuenta" ? setPage("cuenta") : onClose());

  // Toggle optimista del redondeo; revierte si falla el guardado.
  const [round, setRound] = useState(store?.round_weighted ?? false);
  useEffect(() => setRound(store?.round_weighted ?? false), [store?.round_weighted]);

  const toggleRound = async (value: boolean) => {
    setRound(value);
    try {
      await updateStore({ round_weighted: value });
    } catch {
      setRound(!value);
      Alert.alert("Error", "No se pudo guardar el cambio. Intenta de nuevo.");
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      maxHeightRatio={page === "cuenta" ? 0.9 : 0.95}
    >
      {page === "biz" ? (
        <BusinessInfoSheet onBack={() => setPage("cuenta")} />
      ) : page === "switch" ? (
        <StoreSwitcherSheet onBack={() => setPage("cuenta")} />
      ) : page === "danger" ? (
        <DeleteAccountSheet onBack={() => setPage("cuenta")} />
      ) : page === "users" ? (
        <UsersSheet onBack={() => setPage("cuenta")} />
      ) : page === "notifs" ? (
        <NotificationsSheet onBack={() => setPage("cuenta")} />
      ) : page === "tickets" ? (
        <TicketsSheet onBack={() => setPage("cuenta")} />
      ) : page === "sub" ? (
        <SubscriptionSheet onBack={() => setPage("cuenta")} />
      ) : (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Cuenta</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            <View style={s.profile}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials(name)}</Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.name} numberOfLines={1}>
                  {name}
                </Text>
                {!!email && (
                  <Text style={s.email} numberOfLines={1}>
                    {email}
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={s.bizCard}
              onPress={() => (caps.editBusiness ? setPage("biz") : soon())}
              activeOpacity={0.8}
            >
              <View style={s.bizIcon}>
                <Ionicons name="storefront" size={22} color={colors.primaryInk} />
              </View>
              <View style={s.bizInfo}>
                <Text style={s.bizEyebrow}>NEGOCIO</Text>
                <Text style={s.bizName} numberOfLines={1}>
                  {store?.name ?? "Mi negocio"}
                </Text>
                <Text style={s.bizSub}>Lima · Plan gratis</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </TouchableOpacity>

            {multiStore && (
              <TouchableOpacity
                style={s.switchRow}
                onPress={() => setPage("switch")}
                activeOpacity={0.7}
              >
                <View style={s.menuIcon}>
                  <Ionicons name="swap-horizontal" size={18} color={colors.inkMid} />
                </View>
                <View style={s.menuInfo}>
                  <Text style={s.menuTitle}>Cambiar de tienda</Text>
                  <Text style={s.menuSub}>
                    {memberships.length} tiendas · estás en {store?.name ?? "—"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
              </TouchableOpacity>
            )}

            {caps.editBusiness && (
              <View>
                <Text style={s.sectionLabel}>PREFERENCIAS DE VENTA</Text>
                <View style={s.prefCard}>
                  <View style={s.prefInfo}>
                    <Text style={s.prefTitle}>Redondear precios por peso</Text>
                    <Text style={s.prefSub}>Los productos por kg/L se redondean a S/ 0.10</Text>
                  </View>
                  <Switch
                    value={round}
                    onValueChange={toggleRound}
                    trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
                    thumbColor="#fff"
                    ios_backgroundColor={colors.surfaceMuted}
                  />
                </View>
              </View>
            )}

            {menu.length > 0 && (
            <View style={s.menu}>
              {menu.map((item, i) => (
                <TouchableOpacity
                  key={item.title}
                  style={[s.menuRow, i > 0 && s.menuDivider]}
                  onPress={() => (item.page ? setPage(item.page) : soon())}
                  activeOpacity={0.7}
                >
                  <View style={[s.menuIcon, item.accent && s.menuIconAccent]}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.accent ? colors.accent : colors.inkMid}
                    />
                  </View>
                  <View style={s.menuInfo}>
                    <Text style={s.menuTitle}>{item.title}</Text>
                    <Text style={s.menuSub}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
                </TouchableOpacity>
              ))}
            </View>
            )}

            <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={s.logoutText}>Cerrar sesión</Text>
            </TouchableOpacity>

            {role === "owner" && (
              <TouchableOpacity
                style={s.dangerBtn}
                onPress={() => setPage("danger")}
                activeOpacity={0.7}
              >
                <Text style={s.dangerText}>Eliminar cuenta y negocio</Text>
              </TouchableOpacity>
            )}

            <Text style={s.footer}>Caserita · v0.9 (beta)</Text>
          </ScrollView>
        </View>
      )}
    </BottomSheet>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: { ...typography.title, color: colors.ink },
  scroll: { gap: spacing.lg, paddingBottom: spacing.lg },

  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accentInk, fontFamily: fontFamilies.display, fontSize: fontSize.lg },
  profileInfo: { flex: 1, gap: 2 },
  name: {
    fontFamily: fontFamilies.display,
    fontSize: fontSize.xl,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  email: { ...typography.bodySm, color: colors.inkSoft },

  bizCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  bizIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bizInfo: { flex: 1, gap: 1 },
  bizEyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  bizName: { fontFamily: fontFamilies.display, fontSize: fontSize.md, color: colors.ink },
  bizSub: { ...typography.bodySm, color: colors.inkSoft },

  sectionLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  prefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  prefInfo: { flex: 1, gap: 2 },
  prefTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  prefSub: { ...typography.bodySm, color: colors.inkSoft },
  switchRow: {
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
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    ...shadows.shadow,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconAccent: { backgroundColor: colors.suscription },
  menuInfo: { flex: 1, gap: 1 },
  menuTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  menuSub: { ...typography.bodySm, color: colors.inkSoft },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoutText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.danger },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  dangerText: { ...typography.bodySm, color: colors.danger, textDecorationLine: "underline" },
  footer: { ...typography.caption, color: colors.inkSoft, textAlign: "center" },
});
