import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New unique application ID to avoid collisions with every earlier test APK.
  appId: "com.eleazarcompany.sebasplay.pro30.sixfeatures20261124e",
  appName: "SEBAS PLAY PRO 3.0 MEJORADA E",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // The Windows 10 media server serves signed video URLs over the local
    // network using HTTP. Android's WebView otherwise blocks this mixed media.
    allowMixedContent: true
  }
};

export default config;
