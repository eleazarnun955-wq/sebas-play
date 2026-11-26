import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 11.0: independent package so it installs alongside 10.0 and earlier builds.
  appId: "com.eleazarcompany.sebasplay.v11.miLaptopVlc20261125",
  appName: "SEBAS PLAY 11.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
