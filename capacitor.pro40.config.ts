import type { CapacitorConfig } from "@capacitor/cli";

// Independent app identity: never reuse the PRO 3.0 applicationId.
const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.pro40.independent20261125",
  appName: "SEBAS PLAY PRO 4.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true },
};

export default config;
