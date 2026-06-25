import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, initials, avatarColor } from "@/lib/format";
import { REMINDER_TONES, reminderMessage, type ReminderTone } from "@/lib/fiados";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { Client } from "@/types";

interface Props {
  client: Client | null;
  storeName?: string;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function RemindDebtSheet({ client, storeName, onClose, onSend }: Props) {
  const [tone, setTone] = useState<ReminderTone>("amable");

  useEffect(() => {
    if (client) setTone("amable");
  }, [client?.id]);

  const message = client ? reminderMessage(tone, client.name, client.debt, storeName) : "";

  return (
    <BottomSheet visible={!!client} onClose={onClose}>
      {client && (
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Recordar deuda</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Cliente */}
          <View style={s.clientRow}>
            <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
              <Text style={s.avatarText}>{initials(client.name)}</Text>
            </View>
            <View style={s.clientInfo}>
              <Text style={s.clientName} numberOfLines={1}>
                {client.name}
              </Text>
              {!!client.phone && <Text style={s.clientPhone}>{client.phone}</Text>}
            </View>
            <View style={s.debtPill}>
              <Text style={s.debtText}>debe {soles(client.debt)}</Text>
            </View>
          </View>

          {/* Tono */}
          <Text style={s.toneLabel}>Tono del mensaje</Text>
          <View style={s.toneRow}>
            {REMINDER_TONES.map((t) => {
              const active = tone === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[s.toneChip, active && s.toneChipActive]}
                  onPress={() => setTone(t.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.toneText, active && s.toneTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Preview */}
          <View style={s.bubbleWrap}>
            <View style={s.bubble}>
              <Text style={s.bubbleText}>{message}</Text>
              <Text style={s.bubbleMeta}>ahora · ✓✓</Text>
            </View>
          </View>

          {/* Enviar */}
          <TouchableOpacity
            style={[s.sendBtn, !client.phone && s.sendDisabled]}
            onPress={() => onSend(message)}
            disabled={!client.phone}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.sendText}>Enviar por WhatsApp</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
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
  clientPhone: { ...typography.bodySm, color: colors.inkSoft },
  debtPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(192,64,50,0.10)",
  },
  debtText: { ...typography.caption, color: colors.danger },
  toneLabel: { ...typography.bodySm, fontFamily: fontFamilies.display, color: colors.ink },
  toneRow: { flexDirection: "row", gap: spacing.sm },
  toneChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toneChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  toneText: { ...typography.body, color: colors.inkMid },
  toneTextActive: { color: colors.surface, fontFamily: fontFamilies.display },
  bubbleWrap: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    backgroundColor: "#DCF8C6",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  bubbleText: { ...typography.body, color: "#0E1410", lineHeight: 20 },
  bubbleMeta: { ...typography.caption, color: "#5A655E", alignSelf: "flex-end" },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: "#25D366",
    marginTop: spacing.xs,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { ...typography.display, fontSize: fontSize.md, color: "#fff" },
});
