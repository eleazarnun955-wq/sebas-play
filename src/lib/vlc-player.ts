import { Capacitor, registerPlugin } from "@capacitor/core";

type VlcProgressContext = {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  userId: string;
  contentType: "movie" | "episode";
  contentId: string;
  profileId?: string | null;
};

type VlcPlayerPlugin = {
  play(options: { url: string; title: string } & Partial<VlcProgressContext>): Promise<void>;
};

const VlcPlayer = registerPlugin<VlcPlayerPlugin>("VlcPlayer");

export function isNativeVlcAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export async function openNativeVlc(url: string, title: string, progress?: VlcProgressContext) {
  if (!isNativeVlcAvailable()) throw new Error("El reproductor VLC nativo solo está disponible en Android.");
  await VlcPlayer.play({ url, title, ...(progress || {}) });
}
