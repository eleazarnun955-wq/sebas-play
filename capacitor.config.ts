import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 20.0: unique package ID so all previous versions remain installed.
  appId: "com.eleazarcompany.sebasplay.v20.privatestream20261128",
  appName: "SEBAS PLAY 20.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
