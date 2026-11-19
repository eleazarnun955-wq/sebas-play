import React from "react";
import { Capacitor } from "@capacitor/core";
import ReactDOM from "react-dom/client";
import App from "./App";
import ViewerApp from "./ViewerApp";
import "./styles.css";

// Register the offline app shell only in production. API data and media are never cached.
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.warn("SEBAS PLAY: no se pudo activar el modo instalable.", error);
    });
  });
}

const Root = Capacitor.isNativePlatform() || window.location.pathname === "/watch" || window.location.pathname.startsWith("/watch/")
  ? ViewerApp
  : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
