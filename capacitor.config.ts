import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // SEBAS PLAY 10.0: independent package so it installs alongside 9.0 and earlier builds.
  appId: "com.eleazarcompany.sebasplay.v10.miLaptopVlc20261125",
  appName: "SEBAS PLAY 10.0",
  webDir: "dist",
  bundledWebRuntime: false,
  android: { allowMixedContent: true }
};

export default config;
