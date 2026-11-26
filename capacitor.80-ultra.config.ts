import type { CapacitorConfig } from "@capacitor/cli";

// Identidad exclusiva de SEBAS PLAY 8.0 ULTRA.
// Este applicationId no coincide con ninguna versión anterior.
const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.ultra80.independent20261126",
  appName: "SEBAS PLAY 8.0 ULTRA",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true },
};

export default config;
