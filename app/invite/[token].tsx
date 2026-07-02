import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useInviteStore } from "@/stores/invite.store";
import { memberService } from "@/services/firestore/members";
import { ROLE_LABEL } from "@/lib/permissions";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";
import type { StoreInvite } from "@/types";

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadStore = useAuthStore((s) => s.loadStore);
  const switchStore = useAuthStore((s) => s.switchStore);
  const setPending = useInviteStore((s) => s.setToken);
  const clearPending = useInviteStore((s) => s.clear);

  const [invite, setInvite] = useState<StoreInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guarda el token para que sobreviva al login.
  useEffect(() => {
    if (token) setPending(token);
  }, [token, setPending]);

  // La invitación solo se puede leer con sesión iniciada (reglas).
  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    memberService
      .getInvite(token)
      .then((inv) => {
        setInvite(inv);
        if (!inv) setError("Esta invitación ya no es válida o fue aceptada.");
      })
      .catch(() => setError("No se pudo cargar la invitación."))
      .finally(() => setLoading(false));
  }, [user, token]);

  const goLogin = () => router.replace("/(auth)/login");

  const dismiss = () => {
    clearPending();
    router.replace(user ? "/(app)/sales" : "/(auth)/login");
  };

  const handleAccept = async () => {
    if (!user || !token) return;
    setAccepting(true);
    try {
      const access = await memberService.acceptInvite(token, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });
      if (!access) {
        setError("Esta invitación ya no es válida o fue aceptada.");
        return;
      }
      clearPending();
      // Recarga las tiendas y deja como activa la que se acaba de aceptar.
      await loadStore(user);
      await switchStore(access.store.id);
      router.replace("/(app)/sales");
    } catch {
      setError("No se pudo aceptar la invitación. Intenta de nuevo.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <View style={s.card}>
          <View style={s.icon}>
            <Ionicons name="people" size={28} color={colors.primaryInk} />
          </View>

          {!user ? (
            <>
              <Text style={s.title}>Tienes una invitación</Text>
              <Text style={s.sub}>Inicia sesión o crea tu cuenta para aceptarla.</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={goLogin} activeOpacity={0.85}>
                <Text style={s.primaryText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </>
          ) : loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
          ) : error ? (
            <>
              <Text style={s.title}>Invitación no disponible</Text>
              <Text style={s.sub}>{error}</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={dismiss} activeOpacity={0.85}>
                <Text style={s.primaryText}>Entendido</Text>
              </TouchableOpacity>
            </>
          ) : invite ? (
            <>
              <Text style={s.title}>Unirte a {invite.store_name}</Text>
              <Text style={s.sub}>
                Te invitaron como <Text style={s.role}>{ROLE_LABEL[invite.role]}</Text>. Al aceptar,
                tu cuenta tendrá acceso a esta tienda.
              </Text>
              <TouchableOpacity
                style={[s.primaryBtn, accepting && s.disabled]}
                onPress={handleAccept}
                disabled={accepting}
                activeOpacity={0.85}
              >
                {accepting ? (
                  <ActivityIndicator color={colors.primaryInk} />
                ) : (
                  <Text style={s.primaryText}>Aceptar invitación</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.ghostBtn} onPress={dismiss} disabled={accepting}>
                <Text style={s.ghostText}>Ahora no</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadows.shadowLg,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { ...typography.title, color: colors.ink, textAlign: "center" },
  sub: { ...typography.body, color: colors.inkMid, textAlign: "center", lineHeight: 22 },
  role: { fontFamily: fontFamilies.display, color: colors.ink },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  primaryText: { ...typography.body, fontFamily: fontFamilies.display, color: colors.primaryInk },
  disabled: { opacity: 0.6 },
  ghostBtn: { height: 44, alignItems: "center", justifyContent: "center" },
  ghostText: { ...typography.body, color: colors.inkSoft, fontSize: fontSize.md },
});
