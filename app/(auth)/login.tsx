import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/stores/auth.store";
import { colors, spacing, radius, typography, fontSize, shadows } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

// Client ID de la plataforma actual (nativo en iOS/Android, web en web).
// Si la plataforma no tiene client ID configurado, NO montamos el hook de Google
// (evita el crash "iosClientId must be defined") y mostramos el botón deshabilitado.
const googleClientId = Platform.select({
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});
const googleConfigured = !!googleClientId;

function GoogleSignInButton({ onError }: { onError: (message: string | null) => void }) {
  const { loginWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const idToken = response.params.id_token;
      if (!idToken) {
        onError("No se recibió el token de Google");
        setLoading(false);
        return;
      }
      loginWithGoogle(idToken).catch(() => {
        onError("No pudimos iniciar sesión con Google");
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [response, loginWithGoogle, onError]);

  const onPress = async () => {
    if (!request) {
      onError("Google Sign-In no está configurado");
      return;
    }
    onError(null);
    setLoading(true);
    try {
      const result = await promptAsync();
      if (result.type !== "success") setLoading(false);
    } catch {
      onError("No pudimos abrir el inicio de sesión con Google");
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[s.googleBtn, (loading || !request) && s.btnDisabled]}
      onPress={onPress}
      disabled={loading || !request}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.ink} />
          <Text style={s.googleText}>Continuar con Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const { login, resetPassword } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Completa todos los campos");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch {
      setError("Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Escribe tu correo para enviarte el enlace de recuperación");
      return;
    }
    setError(null);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        "Revisa tu correo",
        `Te enviamos un enlace para restablecer tu contraseña a ${email.trim()}.`,
      );
    } catch {
      setError("No pudimos enviar el correo de recuperación");
    }
  };

  const handleRegister = () => {
    Alert.alert("Próximamente", "El registro de nuevas cuentas estará disponible pronto.");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Marca */}
          <View style={s.logo}>
            <Ionicons name="basket" size={28} color={colors.primaryInk} />
          </View>
          <Text style={s.title}>Tu bodega,{"\n"}ordenada.</Text>
          <Text style={s.subtitle}>
            Lleva ventas, inventario y fiados en un solo lugar. Adiós al cuaderno.
          </Text>

          {/* Google */}
          {googleConfigured ? (
            <GoogleSignInButton onError={setError} />
          ) : (
            <TouchableOpacity
              style={s.googleBtn}
              onPress={() =>
                Alert.alert(
                  "No disponible",
                  "El inicio de sesión con Google aún no está configurado para esta plataforma.",
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color={colors.ink} />
              <Text style={s.googleText}>Continuar con Google</Text>
            </TouchableOpacity>
          )}

          {/* Divisor */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>o con correo</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Formulario */}
          <View style={s.form}>
            <TextInput
              style={s.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={colors.inkSoft}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
            <TextInput
              style={s.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.inkSoft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <TouchableOpacity onPress={handleForgotPassword} style={s.forgotWrap}>
              <Text style={s.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={[s.loginBtn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryInk} />
              ) : (
                <Text style={s.loginText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Registro */}
          <TouchableOpacity style={s.registerRow} onPress={handleRegister}>
            <Text style={s.registerMuted}>¿No tienes cuenta? </Text>
            <Text style={s.registerLink}>Regístrate</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={s.footer}>
            Al continuar aceptas los <Text style={s.footerLink}>términos</Text> y la{" "}
            <Text style={s.footerLink}>política de privacidad</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    fontSize: 34,
    lineHeight: 38,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.inkMid,
    marginBottom: spacing.xxl,
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
  googleText: {
    ...typography.display,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.caption,
    color: colors.inkSoft,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.md,
    fontFamily: typography.body.fontFamily,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: -spacing.xs,
  },
  forgotText: {
    ...typography.display,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  error: {
    ...typography.bodySm,
    color: colors.danger,
  },
  loginBtn: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  loginText: {
    ...typography.display,
    fontSize: fontSize.lg,
    color: colors.primaryInk,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  registerMuted: {
    ...typography.body,
    fontSize: fontSize.sm,
    color: colors.inkMid,
  },
  registerLink: {
    ...typography.display,
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  footer: {
    ...typography.caption,
    textAlign: "center",
    color: colors.inkSoft,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  footerLink: {
    textDecorationLine: "underline",
    color: colors.inkMid,
  },
});
