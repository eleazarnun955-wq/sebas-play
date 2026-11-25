import fs from "node:fs";
import path from "node:path";

const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
const securityDir = path.resolve("android/app/src/main/res/xml");
const securityPath = path.join(securityDir, "network_security_config.xml");
if (!fs.existsSync(manifestPath)) throw new Error("No se encontró AndroidManifest.xml después de generar el proyecto Capacitor.");

let manifest = fs.readFileSync(manifestPath, "utf8");
const applicationTag = /<application\\b([^>]*)>/s;
const match = manifest.match(applicationTag);
if (!match) throw new Error("No se encontró la etiqueta <application> en AndroidManifest.xml.");

if (!/<uses-permission\\s+android:name="android\\.permission\\.INTERNET"/.test(manifest)) {
  manifest = manifest.replace(/<manifest\\b[^>]*>/, function (tag) {
    return tag + '\\n    <uses-permission android:name="android.permission.INTERNET" />';
  });
}

manifest = manifest.replace(applicationTag, function (_full, attrs) {
  attrs = attrs.replace(/\\s+android:usesCleartextTraffic\\s*=\\s*"[^"]*"/, "");
  attrs = attrs.replace(/\\s+android:networkSecurityConfig\\s*=\\s*"[^"]*"/, "");
  return '<application' + attrs + ' android:usesCleartextTraffic="true" android:networkSecurityConfig="@xml/network_security_config">';
});

fs.writeFileSync(manifestPath, manifest, "utf8");
fs.mkdirSync(securityDir, { recursive: true });
fs.writeFileSync(securityPath, [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<network-security-config>',
  '  <base-config cleartextTrafficPermitted="true">',
  '    <trust-anchors><certificates src="system" /><certificates src="user" /></trust-anchors>',
  '  </base-config>',
  '</network-security-config>',
  ''
].join('\\n'));

const verified = fs.readFileSync(manifestPath, "utf8");
if (!/<uses-permission\\s+android:name="android\\.permission\\.INTERNET"/.test(verified)) throw new Error("No se pudo agregar el permiso INTERNET.");
if (!/android:usesCleartextTraffic="true"/.test(verified) || !/android:networkSecurityConfig="@xml\\/network_security_config"/.test(verified)) throw new Error("No se pudo habilitar HTTP local en Android.");
console.log("Android preparado: permiso INTERNET y HTTP local habilitados para el servidor multimedia Windows.");
