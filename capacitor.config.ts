import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.pro32milaptop20261124",
  appName: "SEBAS PLAY PRO 3.2 MI LAPTOP",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // Android serves the app from HTTPS localhost; allow it to call the
    // user's HTTP LAN media server as well as HTTPS Cloudflare tunnels.
    allowMixedContent: true
  }
};

export default config;
