import { useEffect, useState, type ReactNode } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, typography, fontSize, fontFamilies, shadows } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onBack: () => void;
}

/**
 * Elimina definitivamente la cuenta y el negocio del dueño. Exige doble validación:
 * reautenticación (contraseña o Google, según el proveedor) y escribir el nombre
 * del negocio. Solo debe montarse para usuarios con rol "owner".
 */
export function DeleteAccountSheet({ onBack }: Props) {
  const user = useAuthStore((s) => s.user);
  const storeName = useAuthStore((s) => s.store?.name) ?? "";
  const isPassword = !!user?.providerData?.some((p) => p.providerId === "password");

  return (
    <View style={s.sheet}>
      <View style={s.handle} />

      <TouchableOpacity style={s.back} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.inkMid} />
        <Text style={s.backText}>Cuenta</Text>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.iconWrap}>
          <Ionicons name="warning" size={28} color={colors.danger} />
        </View>

        <Text style={s.title}>Eliminar cuenta y negocio</Text>
        <Text style={s.lead}>
          Esta acción es permanente y no se puede deshacer. Se eliminarán para siempre:
        </Text>

        <View style={s.bullets}>
          {[
            "Tu negocio y su configuración",
            "Todos los productos y categorías",
            "Ventas, fiados y movimientos de caja",
            "Clientes y sus deudas",
            "Los accesos de tus usuarios",
            "Tu cuenta de acceso",
          ].map((line) => (
            <View key={line} style={s.bulletRow}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={s.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        {isPassword ? (
          <PasswordFlow storeName={storeName} />
        ) : (
          <GoogleFlow storeName={storeName} />
        )}
      </ScrollView>
    </View>
  );
}

/** Cuerpo compartido: confirmar el nombre del negocio + botón de eliminar. */
function ConfirmAndDelete({
  storeName,
  extraValid,
  reauth,
  children,
}: {
  storeName: string;
  extraValid: boolean;
  reauth: () => Promise<void>;
  children: ReactNode;
}) {
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const [confirmName, setConfirmName] = useState("");
  const [busy, setBusy] = useState(false);

  const nameOk = confirmName.trim().toLowerCase() === storeName.trim().toLowerCase();
  const canDelete = nameOk && extraValid && !busy;

  const doDelete = async () => {
    setBusy(true);
    try {
      await reauth();
      await deleteAccount();
      // onAuthStateChanged detecta la baja y redirige a login; no navegamos aquí.
    } catch (e) {
      setBusy(false);
      const code = (e as { code?: string })?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        Alert.alert("Contraseña incorrecta", "Verifica tu contraseña e intenta de nuevo.");
      } else if (code === "auth/requires-recent-login") {
        Alert.alert("Sesión expirada", "Vuelve a iniciar sesión e intenta de nuevo.");
      } else {
        Alert.alert("Error", "No se pudo eliminar la cuenta. Intenta de nuevo.");
      }
    }
  };

  const confirm = () =>
    Alert.alert(
      "¿Eliminar todo?",
      `Se borrará "${storeName}" y toda su información de forma permanente. Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar todo", style: "destructive", onPress: doDelete },
      ],
    );

  return (
    <View style={s.form}>
      {children}

      <View>
        <Text style={s.label}>
          Escribe <Text style={s.labelStrong}>{storeName}</Text> para confirmar
        </Text>
        <TextInput
          style={s.input}
          placeholder="Nombre del negocio"
          placeholderTextColor={colors.inkSoft}
          value={confirmName}
          onChangeText={setConfirmName}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
      </View>

      <TouchableOpacity
        style={[s.deleteBtn, !canDelete && s.deleteDisabled]}
        onPress={confirm}
        disabled={!canDelete}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.deleteText}>Eliminar cuenta y negocio</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/** Reautenticación con contraseña (cuentas de email/contraseña). */
function PasswordFlow({ storeName }: { storeName: string }) {
  const reauthenticateWithPassword = useAuthStore((s) => s.reauthenticateWithPassword);
  const [password, setPassword] = useState("");

  return (
    <ConfirmAndDelete
      storeName={storeName}
      extraValid={password.length > 0}
      reauth={() => reauthenticateWithPassword(password)}
    >
      <View>
        <Text style={s.label}>Confirma tu contraseña</Text>
        <TextInput
          style={s.input}
          placeholder="Tu contraseña"
          placeholderTextColor={colors.inkSoft}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    </ConfirmAndDelete>
  );
}

/** Reautenticación con Google (cuentas de proveedor Google). */
function GoogleFlow({ storeName }: { storeName: string }) {
  const reauthenticateWithGoogle = useAuthStore((s) => s.reauthenticateWithGoogle);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success" && response.params.id_token) {
      reauthenticateWithGoogle(response.params.id_token)
        .then(() => setVerified(true))
        .catch(() => Alert.alert("Error", "No se pudo verificar con Google."))
        .finally(() => setVerifying(false));
    } else {
      setVerifying(false);
    }
  }, [response, reauthenticateWithGoogle]);

  const verify = async () => {
    if (!request) return;
    setVerifying(true);
    try {
      const result = await promptAsync();
      if (result.type !== "success") setVerifying(false);
    } catch {
      setVerifying(false);
    }
  };

  return (
    <ConfirmAndDelete storeName={storeName} extraValid={verified} reauth={async () => {}}>
      <TouchableOpacity
        style={[s.googleBtn, verified && s.googleVerified]}
        onPress={verify}
        disabled={verifying || verified || !request}
        activeOpacity={0.85}
      >
        {verifying ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <Ionicons
              name={verified ? "checkmark-circle" : "logo-google"}
              size={18}
              color={verified ? colors.primary : colors.ink}
            />
            <Text style={s.googleText}>
              {verified ? "Identidad verificada" : "Verificar con Google"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ConfirmAndDelete>
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
  scroll: { paddingBottom: spacing.lg, gap: spacing.md },

  iconWrap: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.display, fontSize: 24, color: colors.ink, textAlign: "center" },
  lead: { ...typography.body, color: colors.inkMid, textAlign: "center", lineHeight: 22 },

  bullets: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bulletText: { ...typography.bodySm, color: colors.inkMid, flex: 1 },

  form: { gap: spacing.md, marginTop: spacing.sm },
  label: { ...typography.bodySm, color: colors.inkMid, marginBottom: spacing.xs },
  labelStrong: { fontFamily: fontFamilies.display, color: colors.ink },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.ink,
    backgroundColor: colors.surface,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.shadow,
  },
  googleVerified: { borderColor: colors.primary },
  googleText: { ...typography.display, fontSize: fontSize.md, color: colors.ink },

  deleteBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  deleteDisabled: { opacity: 0.4 },
  deleteText: { ...typography.body, fontFamily: fontFamilies.display, color: "#fff" },
});
