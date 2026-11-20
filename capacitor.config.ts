import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.next",
  appName: "SEBAS PLAY NUEVA",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false
  }
};

export default config;
