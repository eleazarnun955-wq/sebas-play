import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New collision-avoidance ID, distinct from all earlier SEBAS PLAY package IDs.
  appId: "com.eleazarcompany.sebasplay.pro30.vlcfix20261125g3",
  appName: "SEBAS PLAY PRO 3.0 VLC INDEPENDIENTE",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
