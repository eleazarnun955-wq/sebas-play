import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Fresh application ID: install side-by-side with all earlier SEBAS PLAY APKs.
  appId: "com.eleazarcompany.sebasplay.pro30.independent20261124c",
  appName: "SEBAS PLAY PRO 3.0 INDEPENDIENTE",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // The Windows 10 media server serves signed video URLs over the local
    // network using HTTP. Android's WebView otherwise blocks this mixed media.
    allowMixedContent: true
  }
};

export default config;
