import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eleazarcompany.sebasplay.pro30laptoproku.v3fix20261124b",
  appName: "SEBAS PLAY PRO 3.0 CORREGIDO",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    // Permite reproducir los enlaces HTTP locales firmados por el servidor Windows de SEBAS PLAY.
    // Para acceso remoto se recomienda configurar HTTPS en el túnel público.
    allowMixedContent: true
  }
};

export default config;
