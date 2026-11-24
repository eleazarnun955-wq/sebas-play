import fs from "node:fs";
import path from "node:path";

const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
if (!fs.existsSync(manifestPath)) {
  console.error("No se encontró el AndroidManifest.xml generado por Capacitor.");
  process.exit(1);
}
let manifest = fs.readFileSync(manifestPath, "utf8");
if (!/<application\b/.test(manifest)) {
  console.error("El AndroidManifest.xml no contiene la etiqueta application.");
  process.exit(1);
}
if (/android:usesCleartextTraffic=/.test(manifest)) {
  manifest = manifest.replace(/android:usesCleartextTraffic="[^"]*"/, 'android:usesCleartextTraffic="true"');
} else {
  manifest = manifest.replace(/<application\b/, '<application android:usesCleartextTraffic="true"');
}
fs.writeFileSync(manifestPath, manifest);
console.log("Configuración aplicada: HTTP local habilitado para conectar con la laptop.");
