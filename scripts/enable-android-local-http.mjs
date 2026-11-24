import fs from "node:fs";
import path from "node:path";

const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
if (!fs.existsSync(manifestPath)) {
  throw new Error("No se encontró AndroidManifest.xml después de generar el proyecto Capacitor.");
}

let manifest = fs.readFileSync(manifestPath, "utf8");
const applicationTag = /<application\\b([^>]*)>/s;
const match = manifest.match(applicationTag);
if (!match) {
  throw new Error("No se encontró la etiqueta <application> en AndroidManifest.xml.");
}

if (/android:usesCleartextTraffic\\s*=/.test(match[1])) {
  manifest = manifest.replace(applicationTag, (full, attrs) =>
    `<application${attrs.replace(/android:usesCleartextTraffic\\s*=\\s*"[^"]*"/, 'android:usesCleartextTraffic="true')}>`
  );
} else {
  manifest = manifest.replace(applicationTag, `<application$1 android:usesCleartextTraffic="true">`);
}

fs.writeFileSync(manifestPath, manifest, "utf8");
if (!/android:usesCleartextTraffic="true"/.test(manifest)) {
  throw new Error("No se pudo habilitar el acceso HTTP necesario para la biblioteca local.");
}
console.log("Android preparado para reproducir enlaces HTTP firmados del servidor Windows.");
