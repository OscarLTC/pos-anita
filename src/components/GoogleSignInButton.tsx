import { useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
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

type Props = {
  onError: (message: string | null) => void;
};

function ConfiguredButton({ onError }: Props) {
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
      style={[s.btn, (loading || !request) && s.disabled]}
      onPress={onPress}
      disabled={loading || !request}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <>
          <Ionicons name="logo-google" size={18} color={colors.ink} />
          <Text style={s.text}>Continuar con Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function UnavailableButton() {
  return (
    <TouchableOpacity
      style={s.btn}
      onPress={() =>
        Alert.alert(
          "No disponible",
          "El inicio de sesión con Google aún no está configurado para esta plataforma.",
        )
      }
      activeOpacity={0.8}
    >
      <Ionicons name="logo-google" size={18} color={colors.ink} />
      <Text style={s.text}>Continuar con Google</Text>
    </TouchableOpacity>
  );
}

/**
 * Botón "Continuar con Google". Sirve tanto para iniciar sesión como para registrarse:
 * con Google, signInWithCredential crea el usuario automáticamente la primera vez.
 * Si la plataforma no tiene client ID, se muestra deshabilitado sin romper la app.
 */
export function GoogleSignInButton({ onError }: Props) {
  return googleConfigured ? <ConfiguredButton onError={onError} /> : <UnavailableButton />;
}

const s = StyleSheet.create({
  btn: {
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
  text: {
    ...typography.display,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  disabled: {
    opacity: 0.6,
  },
});
