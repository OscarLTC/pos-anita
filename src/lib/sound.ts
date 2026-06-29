import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

// El reproductor se crea una sola vez y se reutiliza (fire-and-forget).
let player: AudioPlayer | null = null;

/** Reproduce el sonido de confirmación de cobro. Silencioso ante cualquier fallo. */
export async function playCobroSound(): Promise<void> {
  try {
    if (!player) {
      player = createAudioPlayer(require("../../assets/sounds/cobro.wav"));
      // Permite oírlo aunque el teléfono esté en modo silencio (iOS).
      await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    await player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Sin sonido si el módulo de audio no está disponible.
  }
}
