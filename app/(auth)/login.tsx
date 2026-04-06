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
} from "react-native";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginScreen() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [is_loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>POS Anita</Text>
        <Text style={styles.subtitle}>Bodega Anita</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, is_loading && styles.button_disabled]}
            onPress={handleLogin}
            disabled={is_loading}
          >
            {is_loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.button_text}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
    marginBottom: 48,
  },
  form: {
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111",
    backgroundColor: "#fafafa",
  },
  error: {
    fontSize: 13,
    color: "#c0392b",
  },
  button: {
    height: 48,
    backgroundColor: "#111",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  button_disabled: {
    opacity: 0.6,
  },
  button_text: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});
