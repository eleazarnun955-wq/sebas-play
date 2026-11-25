import fs from "node:fs";
import path from "node:path";

const manifestPath = path.resolve("android/app/src/main/AndroidManifest.xml");
const securityDir = path.resolve("android/app/src/main/res/xml");
const securityPath = path.join(securityDir, "network_security_config.xml");
if (!fs.existsSync(manifestPath)) {
  throw new Error("No se encontró AndroidManifest.xml después de generar el proyecto Capacitor.");
}

let manifest = fs.readFileSync(manifestPath, "utf8");
const applicationTag = /<application\\b([^>]*)>/s;
const match = manifest.match(applicationTag);
if (!match) {
  throw new Error("No se encontró la etiqueta <application> en AndroidManifest.xml.");
}

// Capacitor usa WebView; la biblioteca de Windows se sirve por HTTP dentro
// de la red local. Declara explícitamente Internet y permite HTTP sin TLS.
if (!/<uses-permission\\s+android:name="android\\.permission\\.INTERNET"/.test(manifest)) {
  manifest = manifest.replace(/<manifest\\b[^>]*>/, tag => tag + '\\n    <uses-permission android:name="android.permission.INTERNET" />');
}
if (/android:usesCleartextTraffic\\s*=/.test(match[1])) {
  manifest = manifest.replace(applicationTag, (full, attrs) =>
    `<application${attrs.replace(/android:usesCleartextTraffic\\s*=\\s*"[^"]*"/, 'android:usesCleartextTraffic="true')}>`
  );
} else {
  manifest = manifest.replace(applicationTag, '<application$1 android:usesCleartextTraffic="true">');
}
if (/android:networkSecurityConfig\\s*=/.test(manifest)) {
  manifest = manifest.replace(/android:networkSecurityConfig\\s*=\\s*"[^"]*"/, 'android:networkSecurityConfig="@xml/network_security_config"');
} else {
  manifest = manifest.replace(/<application\\b/, '<application android:networkSecurityConfig="@xml/network_security_config"');
}
fs.writeFileSync(manifestPath, manifest, "utf8");

fs.mkdirSync(securityDir, { recursive: true });
fs.writeFileSync(securityPath, `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
`, "utf8");

const verified = fs.readFileSync(manifestPath, "utf8");
if (!/<uses-permission\\s+android:name="android\\.permission\\.INTERNET"/.test(verified)) {
  throw new Error("No se pudo agregar el permiso INTERNET.");
}
if (!/android:usesCleartextTraffic="true"/.test(verified) || !/android:networkSecurityConfig="@xml\\/network_security_config"/.test(verified)) {
  throw new Error("No se pudo habilitar HTTP local en Android.");
}
console.log("Android preparado: permiso INTERNET y HTTP local habilitados para el servidor multimedia Windows.");
