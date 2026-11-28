import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 18.0: unique package ID so it installs alongside 13.0 and earlier versions.
  appId: "com.eleazarcompany.sebasplay.v18.localibrary20261128",
  appName: "SEBAS PLAY 18.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
