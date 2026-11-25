import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New collision-avoidance ID, distinct from all earlier SEBAS PLAY package IDs.
  appId: "com.eleazarcompany.sebasplay.pro30.vlcfix20261125f4",
  appName: "SEBAS PLAY PRO 3.0 MI LAPTOP F4",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
