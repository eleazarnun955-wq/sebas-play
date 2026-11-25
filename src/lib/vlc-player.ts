import { Capacitor, registerPlugin } from "@capacitor/core";

type VlcPlayerPlugin = {
  play(options: { url: string; title: string }): Promise<void>;
};

const VlcPlayer = registerPlugin<VlcPlayerPlugin>("VlcPlayer");

export function isNativeVlcAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function openNativeVlc(url: string, title: string) {
  if (!isNativeVlcAvailable()) throw new Error("El reproductor VLC nativo solo está disponible en Android.");
  await VlcPlayer.play({ url, title });
}
