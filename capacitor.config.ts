import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay",
  appName: "SEBAS PLAY",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false
  }
};

export default config;
