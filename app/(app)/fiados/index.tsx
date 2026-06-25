import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useClientsStore } from "@/stores/clients.store";
import { useFiadosStore } from "@/stores/fiados.store";
import { useSalesStore } from "@/stores/sales.store";
import { FiarSheet } from "@/components/FiarSheet";
import { NewClientSheet } from "@/components/NewClientSheet";
import { ManualFiadoSheet } from "@/components/ManualFiadoSheet";
import { ClientDetailSheet } from "@/components/ClientDetailSheet";
import { CollectPaymentSheet } from "@/components/CollectPaymentSheet";
import { RemindDebtSheet } from "@/components/RemindDebtSheet";
import { RemindAllSheet } from "@/components/RemindAllSheet";
import { SuccessSheet } from "@/components/SuccessSheet";
import { soles, initials, avatarColor } from "@/lib/format";
import {
  buildHistorial,
  summarize,
  daysAgoLabel,
  reminderMessage,
  OVERDUE_DAYS,
} from "@/lib/fiados";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { AbonoMethod, Client } from "@/types";

type Success =
  | { kind: "fiado"; amount: number; clientName: string; phone?: string; newDebt: number }
  | { kind: "abono"; amount: number; clientName: string; newDebt: number };

export default function FiadosScreen() {
  const { store } = useAuthStore();
  const storeId = store?.id;

  const clients = useClientsStore((s) => s.clients);
  const loadClients = useClientsStore((s) => s.loadClients);
  const addClientToStore = useClientsStore((s) => s.addClient);
  const updateClientInStore = useClientsStore((s) => s.updateClient);
  const applyDebt = useClientsStore((s) => s.applyDebt);

  const creditSales = useFiadosStore((s) => s.creditSales);
  const payments = useFiadosStore((s) => s.payments);
  const isLoading = useFiadosStore((s) => s.is_loading);
  const loadFiados = useFiadosStore((s) => s.load);
  const addPayment = useFiadosStore((s) => s.addPayment);
  const pushCreditSale = useFiadosStore((s) => s.pushCreditSale);

  const createSale = useSalesStore((s) => s.createSale);

  const [search, setSearch] = useState("");
  // Flujos (se guardan ids para reflejar siempre la deuda fresca de la store).
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cobrarId, setCobrarId] = useState<string | null>(null);
  const [recordarId, setRecordarId] = useState<string | null>(null);
  const [manualId, setManualId] = useState<string | null>(null);
  const [avisarAll, setAvisarAll] = useState(false);
  const [fiarPick, setFiarPick] = useState(false);
  const [newClient, setNewClient] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingFiado, setSavingFiado] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      loadClients(storeId);
      loadFiados(storeId);
    }, [storeId]),
  );

  const debtors = useMemo(
    () => clients.filter((c) => c.debt > 0).map((c) => summarize(c, creditSales)),
    [clients, creditSales],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return debtors;
    return debtors.filter(
      (d) =>
        d.client.name.toLowerCase().includes(q) ||
        d.client.nickname?.toLowerCase().includes(q) ||
        d.client.phone?.includes(q),
    );
  }, [debtors, search]);

  const totalDue = debtors.reduce((sum, d) => sum + d.client.debt, 0);
  const overdueCount = debtors.filter((d) => d.overdue).length;
  const remindable = useMemo(
    () => debtors.filter((d) => d.client.phone).map((d) => d.client),
    [debtors],
  );

  const byId = (id: string | null) => (id ? (clients.find((c) => c.id === id) ?? null) : null);

  const detailClient = byId(detailId);
  const detailApuntes = useMemo(() => {
    if (!detailId) return [];
    return buildHistorial(
      creditSales.filter((s) => s.client_id === detailId),
      payments.filter((p) => p.client_id === detailId),
    );
  }, [detailId, creditSales, payments]);
  const detailFrequent = detailClient ? summarize(detailClient, creditSales).frequent : false;

  // --- Nuevo fiado manual ---
  const openManual = (client: Client) => {
    setFiarPick(false);
    setNewClient(false);
    setTimeout(() => setManualId(client.id), 320);
  };

  const handleCreateClient = async (input: Parameters<typeof addClientToStore>[1]) => {
    if (!storeId) return;
    setSavingClient(true);
    try {
      const client = await addClientToStore(storeId, input);
      openManual(client);
    } catch {
      Alert.alert("Error", "No se pudo guardar el cliente. Intenta de nuevo.");
    } finally {
      setSavingClient(false);
    }
  };

  // --- Editar cliente ---
  const handleUpdateClient = async (input: Parameters<typeof updateClientInStore>[1]) => {
    const id = editId;
    if (!id) return;
    setSavingClient(true);
    try {
      await updateClientInStore(id, input);
      setEditId(null);
      setTimeout(() => setDetailId(id), 320);
    } catch {
      Alert.alert("Error", "No se pudo actualizar el cliente. Intenta de nuevo.");
    } finally {
      setSavingClient(false);
    }
  };

  const handleConfirmFiado = async (amount: number, concept: string) => {
    const client = byId(manualId);
    if (!storeId || !client) return;
    setSavingFiado(true);
    try {
      const sale = await createSale(storeId, {
        items: [],
        total: amount,
        payment_type: "credit",
        client_id: client.id,
        client_name: client.name,
        note: concept || undefined,
      });
      pushCreditSale(sale);
      applyDebt(client.id, amount);
      setManualId(null);
      setTimeout(
        () =>
          setSuccess({
            kind: "fiado",
            amount,
            clientName: client.name,
            phone: client.phone,
            newDebt: client.debt + amount,
          }),
        320,
      );
    } catch {
      Alert.alert("Error", "No se pudo anotar el fiado. Intenta de nuevo.");
    } finally {
      setSavingFiado(false);
    }
  };

  // --- Cobrar abono ---
  const handleConfirmAbono = async (amount: number, method: AbonoMethod) => {
    const client = byId(cobrarId);
    if (!storeId || !client) return;
    setSavingPayment(true);
    try {
      await addPayment(storeId, client.id, amount, method);
      setCobrarId(null);
      setTimeout(
        () =>
          setSuccess({
            kind: "abono",
            amount,
            clientName: client.name,
            newDebt: Math.max(0, client.debt - amount),
          }),
        320,
      );
    } catch {
      Alert.alert("Error", "No se pudo registrar el abono. Intenta de nuevo.");
    } finally {
      setSavingPayment(false);
    }
  };

  // --- Recordatorios ---
  // Abre WhatsApp con el mensaje. Intenta el esquema nativo y cae a wa.me;
  // captura el error para no dejar promesas sin manejar.
  const openWhatsApp = async (phone: string, message: string) => {
    const digits = phone.replace(/\D/g, "");
    const text = encodeURIComponent(message);
    const urls = [
      `whatsapp://send?phone=${digits}&text=${text}`,
      `https://wa.me/${digits}?text=${text}`,
    ];
    for (const url of urls) {
      try {
        await Linking.openURL(url);
        return;
      } catch {
        // intenta el siguiente esquema
      }
    }
    Alert.alert("WhatsApp", "No se pudo abrir WhatsApp. Verifica que esté instalado.");
  };

  const handleRemind = (message: string) => {
    const client = byId(recordarId);
    setRecordarId(null);
    if (client?.phone) openWhatsApp(client.phone, message);
  };

  const handleRemindOne = (client: Client) => {
    if (!client.phone) return;
    openWhatsApp(client.phone, reminderMessage("amable", client.name, client.debt, store?.name));
  };

  const fiadoWhatsApp = (info: Extract<Success, { kind: "fiado" }>) => {
    if (!info.phone) return;
    const msg =
      `Hola ${info.clientName}, te anoté ${soles(info.amount)} en la libreta` +
      `${store?.name ? ` de ${store.name}` : ""}. Tu deuda total es ${soles(info.newDebt)}. ¡Gracias!`;
    openWhatsApp(info.phone, msg);
  };

  const renderRow = ({ item }: { item: (typeof debtors)[number] }) => {
    const { client, lastDate, apuntesCount, overdue } = item;
    const meta = lastDate
      ? `${daysAgoLabel(lastDate)} · ${apuntesCount} ${apuntesCount === 1 ? "apunte" : "apuntes"}`
      : `${apuntesCount} ${apuntesCount === 1 ? "apunte" : "apuntes"}`;
    return (
      <TouchableOpacity style={s.row} activeOpacity={0.7} onPress={() => setDetailId(client.id)}>
        <View style={[s.avatar, { backgroundColor: avatarColor(client.name) }]}>
          <Text style={s.avatarText}>{initials(client.name)}</Text>
        </View>
        <View style={s.rowInfo}>
          <Text style={s.rowName} numberOfLines={1}>
            {client.name}
          </Text>
          <Text style={[s.rowMeta, overdue && s.rowMetaOverdue]} numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <Text style={[s.rowAmount, overdue && s.rowAmountOverdue]}>{soles(client.debt)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>CUADERNO DIGITAL</Text>
          <Text style={s.title}>Fiados</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setFiarPick(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={26} color={colors.primaryInk} />
        </TouchableOpacity>
      </View>

      {/* Total por cobrar */}
      <View style={s.totalCard}>
        <View style={s.totalLeft}>
          <Text style={s.totalLabel}>TOTAL POR COBRAR</Text>
          <Text style={s.totalValue}>{soles(totalDue)}</Text>
          <Text style={s.totalSub}>
            {debtors.length} {debtors.length === 1 ? "cliente" : "clientes"}
            {overdueCount > 0 && (
              <Text style={s.totalSubWarn}>
                {"  ·  "}
                {overdueCount} con +{OVERDUE_DAYS} días
              </Text>
            )}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.avisarBtn, remindable.length === 0 && s.avisarDisabled]}
          onPress={() => setAvisarAll(true)}
          disabled={remindable.length === 0}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
          <Text style={s.avisarText}>Avisar a todos</Text>
        </TouchableOpacity>
      </View>

      {/* Buscar */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={colors.inkSoft} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar cliente"
          placeholderTextColor={colors.inkSoft}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="words"
          clearButtonMode="while-editing"
        />
      </View>

      <Text style={s.sectionLabel}>CLIENTES CON DEUDA</Text>

      {isLoading && debtors.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.client.id}
          renderItem={renderRow}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>
                {search ? "Sin resultados" : "Aún no tienes clientes con deuda"}
              </Text>
            </View>
          }
        />
      )}

      {/* --- Sheets --- */}
      <FiarSheet
        visible={fiarPick}
        onClose={() => setFiarPick(false)}
        onSelectClient={openManual}
        onNewClient={() => {
          setFiarPick(false);
          setTimeout(() => setNewClient(true), 320);
        }}
        loadingClientId={null}
      />

      <NewClientSheet
        visible={newClient}
        onClose={() => setNewClient(false)}
        onCreate={handleCreateClient}
        saving={savingClient}
      />

      <NewClientSheet
        visible={!!editId}
        initial={byId(editId)}
        onClose={() => setEditId(null)}
        onCreate={handleUpdateClient}
        saving={savingClient}
      />

      <ManualFiadoSheet
        client={byId(manualId)}
        saving={savingFiado}
        onClose={() => setManualId(null)}
        onConfirm={handleConfirmFiado}
      />

      <ClientDetailSheet
        client={detailClient}
        apuntes={detailApuntes}
        frequent={detailFrequent}
        onClose={() => setDetailId(null)}
        onCobrar={() => {
          const id = detailId;
          setDetailId(null);
          setTimeout(() => setCobrarId(id), 320);
        }}
        onAvisar={() => {
          const id = detailId;
          setDetailId(null);
          setTimeout(() => setRecordarId(id), 320);
        }}
        onEdit={() => {
          const id = detailId;
          setDetailId(null);
          setTimeout(() => setEditId(id), 320);
        }}
      />

      <CollectPaymentSheet
        client={byId(cobrarId)}
        saving={savingPayment}
        onClose={() => setCobrarId(null)}
        onConfirm={handleConfirmAbono}
      />

      <RemindDebtSheet
        client={byId(recordarId)}
        storeName={store?.name}
        onClose={() => setRecordarId(null)}
        onSend={handleRemind}
      />

      <RemindAllSheet
        visible={avisarAll}
        clients={remindable}
        onClose={() => setAvisarAll(false)}
        onSendOne={handleRemindOne}
      />

      <SuccessSheet
        visible={!!success}
        title={success?.kind === "abono" ? "¡Abono registrado!" : "¡Fiado anotado!"}
        subtitle={
          success?.kind === "abono" ? (
            <Text>
              <Text style={s.successStrong}>{soles(success.amount)}</Text> de {success.clientName}.
              Saldo: {soles(success.newDebt)}
            </Text>
          ) : success ? (
            <Text>
              Fiaste <Text style={s.successStrong}>{soles(success.amount)}</Text> a{" "}
              {success.clientName}
            </Text>
          ) : null
        }
        onWhatsApp={
          success?.kind === "fiado" && success.phone ? () => fiadoWhatsApp(success) : undefined
        }
        onDone={() => setSuccess(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  eyebrow: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1, marginBottom: 2 },
  title: { ...typography.display, fontSize: 30, color: colors.ink },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.shadow,
  },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.shadow,
  },
  totalLeft: { flex: 1, gap: 2 },
  totalLabel: { ...typography.caption, color: colors.inkSoft, letterSpacing: 1 },
  totalValue: {
    fontFamily: fontFamilies.display,
    fontSize: fontSize.xxl,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  totalSub: { ...typography.bodySm, color: colors.inkMid },
  totalSubWarn: { color: colors.danger, fontFamily: fontFamilies.display },
  avisarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: "#25D366",
  },
  avisarDisabled: { opacity: 0.4 },
  avisarText: { ...typography.bodySm, fontFamily: fontFamilies.display, color: "#fff" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 48,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.ink },
  sectionLabel: {
    ...typography.caption,
    color: colors.inkSoft,
    letterSpacing: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontFamily: fontFamilies.display, fontSize: fontSize.sm },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  rowMeta: { ...typography.bodySm, color: colors.inkSoft },
  rowMetaOverdue: { color: colors.danger },
  rowAmount: { ...typography.body, fontFamily: fontFamilies.display, color: colors.ink },
  rowAmountOverdue: { color: colors.danger },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 60 },
  emptyText: { ...typography.body, color: colors.inkSoft },
  successStrong: { fontFamily: fontFamilies.display, color: colors.ink },
});
