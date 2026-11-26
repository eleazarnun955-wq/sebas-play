import type { CapacitorConfig } from "@capacitor/cli";

// Identidad exclusiva de SEBAS PLAY 7.0 ULTRA.
const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.ultra70.independent",
  appName: "SEBAS PLAY 7.0 ULTRA",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true },
};

export default config;
