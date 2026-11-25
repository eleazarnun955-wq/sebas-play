import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New unique ID to avoid collisions with both the original app and previous test APKs.
  appId: "com.eleazarcompany.sebasplay.pro32milaptopindependent20261125c",
  appName: "SEBAS PLAY PRO 3.2 MI LAPTOP",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // The Windows 10 media server serves signed video URLs over the local
    // network using HTTP. Android's WebView otherwise blocks this mixed media.
    allowMixedContent: true
  }
};

export default config;
