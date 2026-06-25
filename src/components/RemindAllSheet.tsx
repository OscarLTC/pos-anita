import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { soles, initials, avatarColor } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { Client } from "@/types";

interface Props {
  visible: boolean;
  /** Clientes con deuda y teléfono (los únicos a los que se puede avisar). */
  clients: Client[];
  onClose: () => void;
  /** Abre WhatsApp para un cliente. WhatsApp solo permite un chat a la vez. */
  onSendOne: (client: Client) => void;
}

export function RemindAllSheet({ visible, clients, onClose, onSendOne }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setSelected(new Set(clients.map((c) => c.id)));
      setSending(false);
      setSentIds(new Set());
    }
  }, [visible]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const chosen = useMemo(() => clients.filter((c) => selected.has(c.id)), [clients, selected]);
  const next = useMemo(() => chosen.find((c) => !sentIds.has(c.id)) ?? null, [chosen, sentIds]);
  const sentCount = chosen.filter((c) => sentIds.has(c.id)).length;

  const send = (client: Client) => {
    onSendOne(client);
    setSentIds((prev) => new Set(prev).add(client.id));
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>Avisar a todos</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <Text style={s.caption}>
          {sending
            ? "WhatsApp abre un chat a la vez. Envía cada mensaje y vuelve para el siguiente."
            : "Se enviará un mensaje individual a cada cliente con su saldo pendiente."}
        </Text>

        <ScrollView
          style={s.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.listContent}
        >
          {(sending ? chosen : clients).map((client) => {
            const sent = sentIds.has(client.id);
            const on = selected.has(client.id);
            const isNext = sending && next?.id === client.id;
            return (
              <TouchableOpacity
                key={client.id}
                style={[s.row, isNext && s.rowNext]}
                onPress={() => (sending ? send(client) : toggle(client.id))}
                activeOpacity={0.7}
              >
                {sending ? (
                  <View style={[s.check, sent && s.checkOn]}>
                    {sent && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                ) : (
                  <View style={[s.check, on && s.checkOn]}>
                    {on && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                )}
                <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
                  <Text style={s.avatarText}>{initials(client.name)}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={1}>
                    {client.name}
                  </Text>
                  {!!client.phone && <Text style={s.phone}>{client.phone}</Text>}
                </View>
                {sending && sent ? (
                  <Text style={s.sentTag}>enviado</Text>
                ) : (
                  <Text style={s.debt}>{soles(client.debt)}</Text>
                )}
              </TouchableOpacity>
            );
          })}
          {clients.length === 0 && (
            <Text style={s.empty}>No hay clientes con teléfono para avisar.</Text>
          )}
        </ScrollView>

        {!sending ? (
          <TouchableOpacity
            style={[s.sendBtn, chosen.length === 0 && s.sendDisabled]}
            onPress={() => setSending(true)}
            disabled={chosen.length === 0}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.sendText}>
              Avisar a {chosen.length} {chosen.length === 1 ? "cliente" : "clientes"}
            </Text>
          </TouchableOpacity>
        ) : next ? (
          <TouchableOpacity style={s.sendBtn} onPress={() => send(next)} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={s.sendText} numberOfLines={1}>
              Enviar a {next.name} ({sentCount + 1}/{chosen.length})
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.doneText}>Listo · {sentCount} avisados</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    flexShrink: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
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
  caption: { ...typography.bodySm, color: colors.inkMid, marginTop: spacing.xs },
  list: { flexShrink: 1, marginTop: spacing.sm },
  listContent: { gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowNext: { backgroundColor: colors.chipBg, borderBottomColor: "transparent" },
  check: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.sm },
  info: { flex: 1, gap: 2 },
  name: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  phone: { ...typography.bodySm, color: colors.inkSoft },
  debt: { ...typography.body, fontFamily: fontFamilies.display, color: colors.danger },
  sentTag: { ...typography.bodySm, color: colors.primary, fontFamily: fontFamilies.display },
  empty: {
    ...typography.body,
    color: colors.inkSoft,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: "#25D366",
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { ...typography.display, fontSize: fontSize.md, color: "#fff" },
  doneBtn: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  doneText: { ...typography.display, fontSize: fontSize.md, color: colors.primaryInk },
});
