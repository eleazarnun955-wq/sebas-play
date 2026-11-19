import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ViewerApp from "./ViewerApp";
import "./styles.css";

const Root = window.location.pathname === "/watch" || window.location.pathname.startsWith("/watch/")
  ? ViewerApp
  : App;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
