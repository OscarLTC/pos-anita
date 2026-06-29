import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_NOTIFICATIONS, REMINDER_DAYS } from "@/lib/notifications";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { NotificationSettings } from "@/types";

interface Props {
  onBack: () => void;
}

export function NotificationsSheet({ onBack }: Props) {
  const store = useAuthStore((s) => s.store);
  const updateStore = useAuthStore((s) => s.updateStore);

  const [n, setN] = useState<NotificationSettings>(store?.notifications ?? DEFAULT_NOTIFICATIONS);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<NotificationSettings>) => setN((prev) => ({ ...prev, ...p }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStore({ notifications: n });
      onBack();
    } catch {
      Alert.alert("Error", "No se pudieron guardar las notificaciones. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8} disabled={saving}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <Text style={s.title}>Notificaciones</Text>
      <Text style={s.subtitle}>Cómo y cuándo te avisamos</Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Recordatorios automáticos */}
        <View style={s.card}>
          <Row
            icon="logo-whatsapp"
            iconBg="#25D366"
            iconColor="#fff"
            title="Recordatorios automáticos"
            sub="Avisa por WhatsApp a clientes con deuda"
            value={n.debt_reminders}
            onValueChange={(v) => patch({ debt_reminders: v })}
          />
          {n.debt_reminders && (
            <View style={s.subSection}>
              <Text style={s.subLabel}>Frecuencia</Text>
              <View style={s.segment}>
                {REMINDER_DAYS.map((d) => {
                  const active = n.debt_reminder_days === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[s.segmentBtn, active && s.segmentActive]}
                      onPress={() => patch({ debt_reminder_days: d })}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.segmentText, active && s.segmentTextActive]}>cada {d}d</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Alerta de stock bajo */}
        <View style={s.card}>
          <Row
            icon="warning"
            iconBg="rgba(192,64,50,0.12)"
            iconColor={colors.danger}
            title="Alerta de stock bajo"
            sub="Cuando un producto llega al mínimo"
            value={n.low_stock}
            onValueChange={(v) => patch({ low_stock: v })}
          />
        </View>

        {/* Venta grande */}
        <View style={s.card}>
          <Row
            icon="trending-up"
            iconBg={colors.surfaceMuted}
            iconColor={colors.inkMid}
            title="Venta grande"
            sub="Cuando una venta supera un monto"
            value={n.big_sale}
            onValueChange={(v) => patch({ big_sale: v })}
          />
          {n.big_sale && (
            <View style={s.subSection}>
              <View style={s.inlineRow}>
                <Text style={s.subLabel}>Monto mínimo</Text>
                <View style={s.amountBox}>
                  <Text style={s.amountPrefix}>S/</Text>
                  <TextInput
                    style={s.amountInput}
                    value={n.big_sale_amount ? String(n.big_sale_amount) : ""}
                    onChangeText={(t) =>
                      patch({ big_sale_amount: Number(t.replace(/[^0-9]/g, "")) || 0 })
                    }
                    keyboardType="number-pad"
                    placeholder="100"
                    placeholderTextColor={colors.inkSoft}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Resumen diario */}
        <View style={s.card}>
          <Row
            icon="time-outline"
            iconBg={colors.surfaceMuted}
            iconColor={colors.inkMid}
            title="Resumen diario"
            sub="Total de ventas al cerrar caja"
            value={n.daily_summary}
            onValueChange={(v) => patch({ daily_summary: v })}
          />
          {n.daily_summary && (
            <View style={s.subSection}>
              <View style={s.inlineRow}>
                <Text style={s.subLabel}>Enviar a las</Text>
                <TextInput
                  style={s.timeInput}
                  value={n.daily_summary_time}
                  onChangeText={(t) => patch({ daily_summary_time: t })}
                  keyboardType="numbers-and-punctuation"
                  placeholder="20:30"
                  placeholderTextColor={colors.inkSoft}
                  textAlign="center"
                  maxLength={5}
                />
              </View>
            </View>
          )}
        </View>

        {/* Sonido al cobrar */}
        <View style={s.plainRow}>
          <Text style={s.plainTitle}>Sonido al cobrar</Text>
          <Switch
            value={n.sound_on_sale}
            onValueChange={(v) => patch({ sound_on_sale: v })}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            thumbColor="#fff"
            ios_backgroundColor={colors.surfaceMuted}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[s.saveBtn, saving && s.saveDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color={colors.primaryInk} />
        ) : (
          <Text style={s.saveText}>Guardar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function Row({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
        thumbColor="#fff"
        ios_backgroundColor={colors.surfaceMuted}
      />
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
  scrollContent: { paddingBottom: spacing.lg, gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  rowSub: { ...typography.bodySm, color: colors.inkSoft },

  subSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  subLabel: { ...typography.bodySm, color: colors.inkMid },
  inlineRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  segmentActive: { backgroundColor: colors.surface, ...shadows.shadow },
  segmentText: { ...typography.bodySm, color: colors.inkMid, fontSize: fontSize.sm },
  segmentTextActive: { fontFamily: fontFamilies.display, color: colors.ink },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    minWidth: 110,
  },
  amountPrefix: { ...typography.body, color: colors.inkMid },
  amountInput: { flex: 1, fontSize: fontSize.md, color: colors.ink, textAlign: "right" },
  timeInput: {
    width: 84,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    fontSize: fontSize.md,
    color: colors.ink,
  },

  plainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  plainTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },

  saveBtn: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
