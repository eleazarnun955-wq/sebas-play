import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 17.0: unique package ID so it installs alongside 13.0 and earlier versions.
  appId: "com.eleazarcompany.sebasplay.v17.directroku20261127",
  appName: "SEBAS PLAY 17.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
