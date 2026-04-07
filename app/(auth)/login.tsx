import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuthStore } from "@/stores/auth.store";
import { useThemeStore, type AppColors } from "@/theme";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [is_loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch {
      setError("Correo o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.content}>
        <Text style={s.title}>POS Anita</Text>
        <Text style={s.subtitle}>Bodega Anita</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            placeholder="Correo"
            placeholderTextColor={colors.text4}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={s.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.text4}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity
            style={[s.button, is_loading && s.button_disabled]}
            onPress={handleLogin}
            disabled={is_loading}
          >
            {is_loading ? (
              <ActivityIndicator color={colors.accent_text} />
            ) : (
              <Text style={s.button_text}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: "600",
      color: c.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: c.text3,
      marginBottom: 48,
    },
    form: {
      gap: 12,
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: c.border2,
      borderRadius: 10,
      paddingHorizontal: 16,
      fontSize: 15,
      color: c.text,
      backgroundColor: c.bg4,
    },
    error: {
      fontSize: 13,
      color: "#c0392b",
    },
    button: {
      height: 48,
      backgroundColor: c.accent,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    button_disabled: {
      opacity: 0.6,
    },
    button_text: {
      color: c.accent_text,
      fontSize: 15,
      fontWeight: "500",
    },
  });
