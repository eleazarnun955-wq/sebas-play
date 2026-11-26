import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Unique package identity: installs alongside SEBAS PLAY 8.0 ULTRA.
  appId: "com.eleazarcompany.sebasplay.ultra90.independent20261126",
  appName: "SEBAS PLAY 9.0 ULTRA",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
