import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheet } from "@/components/BottomSheet";
import { useAuthStore } from "@/stores/auth.store";
import { useClientsStore } from "@/stores/clients.store";
import { soles, initials, avatarColor } from "@/lib/format";
import { colors, spacing, radius, typography, fontSize, fontFamilies } from "@/theme";
import type { Client } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  onNewClient: () => void;
  loadingClientId: string | null;
}

export function FiarSheet({ visible, onClose, onSelectClient, onNewClient, loadingClientId }: Props) {
  const { store } = useAuthStore();
  const clients = useClientsStore((s) => s.clients);
  const loadClients = useClientsStore((s) => s.loadClients);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible && store?.id) loadClients(store.id);
    if (visible) setSearch("");
  }, [visible, store?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nickname?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [clients, search]);

  const busy = loadingClientId != null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={s.sheet}>
        <View style={s.handle} />

        <View style={s.header}>
          <Text style={s.title}>Fiar a…</Text>
          <TouchableOpacity onPress={onClose} hitSlop={8} disabled={busy}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <View style={s.searchBox}>
          <Ionicons name="search" size={18} color={colors.inkSoft} />
          <TextInput
            style={s.searchInput}
            placeholder="Buscar cliente"
            placeholderTextColor={colors.inkSoft}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity style={s.newBtn} onPress={onNewClient} disabled={busy} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={s.newBtnText}>Cliente nuevo</Text>
        </TouchableOpacity>

        <ScrollView style={s.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {filtered.map((client) => {
            const loading = loadingClientId === client.id;
            const sub = client.nickname
              ? `"${client.nickname}"${client.phone ? ` · ${client.phone}` : ""}`
              : client.phone ?? "";
            return (
              <TouchableOpacity
                key={client.id}
                style={[s.row, busy && !loading && s.rowDimmed]}
                onPress={() => onSelectClient(client)}
                disabled={busy}
                activeOpacity={0.7}
              >
                <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
                  <Text style={s.avatarText}>{initials(client.name)}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={1}>
                    {client.name}
                  </Text>
                  {!!sub && (
                    <Text style={s.sub} numberOfLines={1}>
                      {sub}
                    </Text>
                  )}
                </View>
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : client.debt > 0 ? (
                  <View style={s.debtPill}>
                    <Text style={s.debtText}>debe {soles(client.debt)}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <Text style={s.empty}>
              {search ? "Sin resultados" : "Aún no tienes clientes"}
            </Text>
          )}
        </ScrollView>
      </View>
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
    marginBottom: spacing.md,
  },
  title: { ...typography.title, color: colors.ink },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.ink },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    backgroundColor: colors.chipBg,
  },
  newBtnText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primary },
  list: { maxHeight: 380, marginTop: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowDimmed: { opacity: 0.4 },
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
  sub: { ...typography.bodySm, color: colors.inkSoft },
  debtPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(192,64,50,0.10)",
  },
  debtText: { ...typography.caption, color: colors.danger },
  empty: { ...typography.body, color: colors.inkSoft, textAlign: "center", paddingVertical: spacing.xl },
});
