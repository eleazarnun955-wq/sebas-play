import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New collision-avoidance ID, distinct from all earlier SEBAS PLAY package IDs.
  appId: "com.eleazarcompany.sebasplay.v14.familyprofiles20261127",
  appName: "SEBAS PLAY 14.0 INDEPENDIENTE",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
