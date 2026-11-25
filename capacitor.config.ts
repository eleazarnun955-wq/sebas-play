import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Fresh package ID: installs alongside all previous SEBAS PLAY editions and test builds.
  appId: "com.eleazarcompany.sebasplay.pro32standalone1125",
  appName: "SEBAS PLAY PRO 3.2 MI LAPTOP",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // Allow the Windows laptop media server to stream local-network HTTP media.
    allowMixedContent: true
  }
};

export default config;
