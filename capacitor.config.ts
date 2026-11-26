import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 12.0: unique package ID; installs alongside 11.0 and earlier versions.
  appId: "com.eleazarcompany.sebasplay.v12.independiente20261126",
  appName: "SEBAS PLAY 12.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
