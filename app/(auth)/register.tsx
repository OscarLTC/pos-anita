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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { authErrorMessage, isValidEmail } from "@/lib/auth-errors";
import { colors, spacing, radius, typography, fontSize } from "@/theme";

const MIN_PASSWORD_LENGTH = 6;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirm) {
      setError("Completa todos los campos");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError("El correo no es válido");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register(email.trim(), password);
      // El listener de auth en el root layout navega a la app automáticamente.
    } catch (err) {
      setError(authErrorMessage(err, "No pudimos crear la cuenta"));
      setLoading(false);
    }
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
          <Text style={s.title}>Crea tu{"\n"}cuenta.</Text>
          <Text style={s.subtitle}>Empieza a ordenar tu bodega en minutos. Es gratis.</Text>

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
              autoComplete="password-new"
            />
            <TextInput
              style={s.input}
              placeholder="Confirmar contraseña"
              placeholderTextColor={colors.inkSoft}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="password-new"
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.primaryInk} />
              ) : (
                <Text style={s.primaryText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Volver a login */}
          <TouchableOpacity style={s.loginRow} onPress={() => router.back()}>
            <Text style={s.loginMuted}>¿Ya tienes cuenta? </Text>
            <Text style={s.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={s.footer}>
            Al crear una cuenta aceptas los <Text style={s.footerLink}>términos</Text> y la{" "}
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
  error: {
    ...typography.bodySm,
    color: colors.danger,
  },
  primaryBtn: {
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
  primaryText: {
    ...typography.display,
    fontSize: fontSize.lg,
    color: colors.primaryInk,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  loginMuted: {
    ...typography.body,
    fontSize: fontSize.sm,
    color: colors.inkMid,
  },
  loginLink: {
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
