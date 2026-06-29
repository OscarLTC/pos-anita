import { useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_TICKETS, TICKET_SIZES, buildReceiptPreview } from "@/lib/receipt";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { TicketSettings } from "@/types";

interface Props {
  onBack: () => void;
}

const soon = (msg: string) => Alert.alert("Próximamente", msg);

export function TicketsSheet({ onBack }: Props) {
  const store = useAuthStore((s) => s.store);
  const updateStore = useAuthStore((s) => s.updateStore);
  const insets = useSafeAreaInsets();

  const [t, setT] = useState<TicketSettings>(store?.tickets ?? DEFAULT_TICKETS);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<TicketSettings>) => setT((prev) => ({ ...prev, ...p }));
  const preview = useMemo(() => buildReceiptPreview(store, t), [store, t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStore({ tickets: t });
      onBack();
    } catch {
      Alert.alert("Error", "No se pudo guardar la configuración. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8} disabled={saving}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <Text style={s.title}>Impresoras y tickets</Text>
      <Text style={s.subtitle}>Configura cómo se imprimen tus comprobantes</Text>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Impresora (integración nativa pendiente) */}
        <View style={s.printerCard}>
          <View style={s.printerIcon}>
            <Ionicons name="print-outline" size={20} color={colors.inkMid} />
          </View>
          <View style={s.printerInfo}>
            <Text style={s.printerName}>Impresora térmica</Text>
            <View style={s.printerStatusRow}>
              <View style={s.dotOff} />
              <Text style={s.printerStatus}>Sin conectar</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.connectBtn}
            onPress={() => soon("La conexión con impresoras térmicas estará disponible pronto.")}
            activeOpacity={0.8}
          >
            <Text style={s.connectText}>Conectar</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.label}>Tamaño del ticket</Text>
        <View style={s.segment}>
          {TICKET_SIZES.map((size) => {
            const active = t.size === size;
            return (
              <TouchableOpacity
                key={size}
                style={[s.segmentBtn, active && s.segmentActive]}
                onPress={() => patch({ size })}
                activeOpacity={0.8}
              >
                <Text style={[s.segmentText, active && s.segmentTextActive]}>{size}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.toggleRow}>
          <View style={s.toggleInfo}>
            <Text style={s.toggleTitle}>Imprimir copia para el cliente</Text>
            <Text style={s.toggleSub}>Sale un segundo ticket</Text>
          </View>
          <Switch
            value={t.print_client_copy}
            onValueChange={(v) => patch({ print_client_copy: v })}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
            thumbColor="#fff"
            ios_backgroundColor={colors.surfaceMuted}
          />
        </View>

        <Text style={s.label}>Mensaje al pie del ticket</Text>
        <TextInput
          style={s.input}
          value={t.footer_message}
          onChangeText={(v) => patch({ footer_message: v })}
          placeholder="¡Gracias por su compra!"
          placeholderTextColor={colors.inkSoft}
          maxLength={120}
        />

        <Text style={s.label}>Vista previa</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.previewScroll}
        >
          {/* El papel se ajusta al ancho real del ticket (más angosto en 58mm, más ancho en A4). */}
          <View style={s.paper}>
            <Text style={s.previewText}>{preview.join("\n")}</Text>
          </View>
        </ScrollView>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.testBtn}
          onPress={() => soon("La impresión de prueba requiere una impresora conectada.")}
          activeOpacity={0.85}
        >
          <Ionicons name="receipt-outline" size={18} color={colors.ink} />
          <Text style={s.testText}>Imprimir prueba</Text>
        </TouchableOpacity>
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

  printerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.shadow,
  },
  printerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  printerInfo: { flex: 1, gap: 3 },
  printerName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  printerStatusRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dotOff: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.inkSoft },
  printerStatus: { ...typography.bodySm, color: colors.inkSoft },
  connectBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  connectText: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },

  label: {
    ...typography.bodySm,
    fontFamily: fontFamilies.display,
    color: colors.ink,
    marginTop: spacing.sm,
  },
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
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
  },
  segmentActive: { backgroundColor: colors.surface, ...shadows.shadow },
  segmentText: { ...typography.body, color: colors.inkMid },
  segmentTextActive: { fontFamily: fontFamilies.display, color: colors.ink },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  toggleInfo: { flex: 1, gap: 2 },
  toggleTitle: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  toggleSub: { ...typography.bodySm, color: colors.inkSoft },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },

  previewScroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xs,
  },
  paper: {
    alignSelf: "center",
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    ...shadows.shadow,
  },
  previewText: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    lineHeight: 16,
    color: colors.ink,
  },

  footer: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  testBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  testText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  saveBtn: {
    flex: 1.4,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: { opacity: 0.6 },
  saveText: { ...typography.display, fontSize: fontSize.lg, color: colors.primaryInk },
});
