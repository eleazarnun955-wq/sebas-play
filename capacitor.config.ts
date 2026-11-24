import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // New unique applicationId (C build) to install alongside every previous SEBAS PLAY package.
  appId: "com.eleazarcompany.sebasplay.pro32milaptopindependent20261124c",
  appName: "SEBAS PLAY PRO 3.2 MI LAPTOP",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true
  }
};

export default config;
