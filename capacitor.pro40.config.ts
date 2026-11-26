import type { CapacitorConfig } from "@capacitor/cli";

// Independent app identity: PRO 5.0 installs alongside PRO 4.0 and older versions.
const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.pro50.independent20261125",
  appName: "SEBAS PLAY PRO 5.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true },
};

export default config;
