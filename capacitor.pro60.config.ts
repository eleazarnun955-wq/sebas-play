import type { CapacitorConfig } from "@capacitor/cli";

// Unique package identity: installs alongside PRO 4.0 and PRO 5.0.
const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.pro60.independent20261126",
  appName: "SEBAS PLAY PRO 6.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true },
};

export default config;
