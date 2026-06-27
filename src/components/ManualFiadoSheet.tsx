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
import type { Client } from "@/types";

interface Props {
  client: Client | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: (amount: number, concept: string) => void;
}

export function ManualFiadoSheet({ client, saving, onClose, onConfirm }: Props) {
  const [input, setInput] = useState("");
  const [concept, setConcept] = useState("");

  useEffect(() => {
    if (client) {
      setInput("");
      setConcept("");
    }
  }, [client?.id]);

  const amount = parseFloat(input.replace(",", ".")) || 0;
  const valid = amount > 0 && !saving;

  const handleConfirm = () => {
    if (valid && client) onConfirm(parseFloat(amount.toFixed(2)), concept.trim());
  };

  return (
    <BottomSheet visible={!!client} onClose={onClose}>
      {client && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Nuevo fiado</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8} disabled={saving}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={s.clientRow}>
            <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
              <Text style={s.avatarText}>{initials(client.name)}</Text>
            </View>
            <View style={s.clientInfo}>
              <Text style={s.clientName} numberOfLines={1}>
                {client.name}
              </Text>
              <Text style={s.clientDebt}>
                {client.debt > 0 ? `debe ${soles(client.debt)}` : "sin deuda"}
              </Text>
            </View>
          </View>

          <View style={s.display}>
            <Text style={s.displayLabel}>MONTO A FIAR</Text>
            <View style={s.amountRow}>
              <Text style={s.currency}>S/</Text>
              <TextInput
                style={s.amountInput}
                value={input}
                onChangeText={setInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.inkSoft}
                selectTextOnFocus
                editable={!saving}
                autoFocus
              />
            </View>
          </View>

          <Text style={s.conceptLabel}>
            Concepto <Text style={s.hint}>(opcional)</Text>
          </Text>
          <TextInput
            style={s.conceptInput}
            value={concept}
            onChangeText={setConcept}
            placeholder="Ej. Arroz, aceite, leche"
            placeholderTextColor={colors.inkSoft}
            editable={!saving}
          />

          <TouchableOpacity
            style={[s.confirmBtn, !valid && s.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!valid}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryInk} />
            ) : (
              <Text style={s.confirmText}>Anotar fiado {amount > 0 ? soles(amount) : ""}</Text>
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
  clientName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  clientDebt: { ...typography.bodySm, color: colors.inkSoft },
  display: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
  conceptLabel: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  hint: { fontFamily: fontFamilies.body, color: colors.inkSoft },
  conceptInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
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
