import { useState } from "react";
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
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { authErrorMessage, isValidEmail } from "@/lib/auth-errors";
import { colors, spacing, radius, typography, fontSize } from "@/theme";

export default function LoginScreen() {
  const router = useRouter();
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
    } catch (err) {
      setError(authErrorMessage(err, "Correo o contraseña incorrectos"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Escribe tu correo para enviarte el enlace de recuperación");
      return;
    }
    if (!isValidEmail(trimmed)) {
      setError("El correo no es válido");
      return;
    }
    setError(null);
    try {
      await resetPassword(trimmed);
      Alert.alert(
        "Revisa tu correo",
        `Te enviamos un enlace para restablecer tu contraseña a ${trimmed}.`,
      );
    } catch (err) {
      setError(authErrorMessage(err, "No pudimos enviar el correo de recuperación"));
    }
  };

  const handleRegister = () => {
    router.push("/(auth)/register");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
          <GoogleSignInButton onError={setError} />

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
