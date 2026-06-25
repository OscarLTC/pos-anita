import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, initials, avatarColor } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { AbonoMethod, Client } from "@/types";

interface Props {
  client: Client | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: AbonoMethod) => void;
}

const METHODS: { id: AbonoMethod; label: string }[] = [
  { id: "cash", label: "Efectivo" },
  { id: "yape", label: "Yape" },
  { id: "plin", label: "Plin" },
];

export function CollectPaymentSheet({ client, saving, onClose, onConfirm }: Props) {
  const debt = client?.debt ?? 0;
  const [input, setInput] = useState("");
  const [method, setMethod] = useState<AbonoMethod>("cash");

  useEffect(() => {
    if (client) {
      setInput(debt.toFixed(2));
      setMethod("cash");
    }
  }, [client?.id]);

  const amount = parseFloat(input.replace(",", ".")) || 0;
  const valid = amount > 0 && amount <= debt + 0.001 && !saving;

  const setQuick = (value: number) => setInput(Math.min(value, debt).toFixed(2));

  const quicks: { label: string; value: number }[] = [
    { label: "Mitad", value: debt / 2 },
    { label: "S/ 10", value: 10 },
    { label: "S/ 20", value: 20 },
    { label: "Total", value: debt },
  ];

  const handleConfirm = () => {
    if (valid && client) onConfirm(parseFloat(amount.toFixed(2)), method);
  };

  return (
    <BottomSheet visible={!!client} onClose={onClose}>
      {client && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Cobrar abono</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} disabled={saving}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Cliente */}
          <View style={s.clientRow}>
            <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
              <Text style={s.avatarText}>{initials(client.name)}</Text>
            </View>
            <View style={s.clientInfo}>
              <Text style={s.clientName}>
                Abono de <Text style={s.clientNameBold}>{client.name}</Text>
              </Text>
              <Text style={s.clientDebt}>debe {soles(debt)}</Text>
            </View>
          </View>

          {/* Monto */}
          <View style={s.display}>
            <Text style={s.displayLabel}>MONTO ABONADO</Text>
            <View style={s.amountRow}>
              <Text style={s.currency}>S/</Text>
              <TextInput
                style={s.amountInput}
                value={input}
                onChangeText={setInput}
                keyboardType="decimal-pad"
                selectTextOnFocus
                editable={!saving}
              />
            </View>
            <View style={s.quickRow}>
              {quicks.map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={s.quickChip}
                  onPress={() => setQuick(q.value)}
                  disabled={saving}
                >
                  <Text style={s.quickChipText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Método */}
          <Text style={s.methodLabel}>Método de cobro</Text>
          <View style={s.methodRow}>
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[s.methodChip, active && s.methodChipActive]}
                  onPress={() => setMethod(m.id)}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={[s.methodText, active && s.methodTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirmar */}
          <TouchableOpacity
            style={[s.confirmBtn, !valid && s.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!valid}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryInk} />
            ) : (
              <Text style={s.confirmText}>Confirmar abono {soles(amount)}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
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
  },
  title: { ...typography.title, color: colors.ink },
  clientRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.sm },
  clientInfo: { flex: 1, gap: 2 },
  clientName: { ...typography.body, color: colors.inkMid },
  clientNameBold: { fontFamily: fontFamilies.display, color: colors.ink },
  clientDebt: { ...typography.bodySm, color: colors.inkSoft },
  display: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    ...shadows.shadow,
  },
  displayLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    textAlign: "center",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  currency: { fontFamily: fontFamilies.display, fontSize: fontSize.xl, color: colors.inkMid },
  amountInput: {
    fontFamily: fontFamilies.display,
    fontSize: 44,
    color: colors.ink,
    letterSpacing: -1,
    minWidth: 140,
    textAlign: "center",
    padding: 0,
  },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickChipText: { ...typography.bodySm, color: colors.inkMid },
  methodLabel: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  methodRow: { flexDirection: "row", gap: spacing.sm },
  methodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  methodChipActive: { borderColor: colors.primary, backgroundColor: colors.chipBg },
  methodText: { ...typography.body, color: colors.inkMid },
  methodTextActive: { color: colors.primary, fontFamily: fontFamilies.display },
  confirmBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { ...typography.display, fontSize: fontSize.md, color: colors.primaryInk },
});
