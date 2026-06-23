import { FirebaseError } from "firebase/app";
import { GOOGLE_ACCOUNT_ONLY } from "@/stores/auth.store";

/** Validación simple de formato de correo. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Traduce errores de Firebase Auth (y de la app) a mensajes en español para el usuario. */
export function authErrorMessage(
  err: unknown,
  fallback = "Algo salió mal. Intenta de nuevo.",
): string {
  if (err instanceof Error && err.message === GOOGLE_ACCOUNT_ONLY) {
    return 'Esta cuenta usa Google. Toca "Continuar con Google" para entrar.';
  }
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "El correo no es válido";
      case "auth/email-already-in-use":
        return "Ese correo ya tiene una cuenta";
      case "auth/weak-password":
        return "La contraseña es muy débil";
      case "auth/user-not-found":
        return "No encontramos una cuenta con ese correo";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Correo o contraseña incorrectos";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
      case "auth/network-request-failed":
        return "Sin conexión. Revisa tu internet e intenta de nuevo.";
    }
  }
  return fallback;
}
