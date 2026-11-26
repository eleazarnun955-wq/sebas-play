import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Independent package ID: installs alongside SEBAS PLAY 9.0 ULTRA.
  appId: "com.eleazarcompany.sebasplay.ultra100.independent20261125",
  appName: "SEBAS PLAY 10.0 ULTRA",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
