import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 13.0: unique package ID; installs alongside 12.0, 11.0 and earlier versions.
  appId: "com.eleazarcompany.sebasplay.v13.independiente20261126",
  appName: "SEBAS PLAY 13.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
