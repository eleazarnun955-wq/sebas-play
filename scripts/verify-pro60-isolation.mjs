import assert from "node:assert/strict";
import fs from "node:fs";

const config = fs.readFileSync("capacitor.pro60.config.ts", "utf8");
const manifest = fs.readFileSync("apps/roku-pro60/manifest", "utf8");
const home = fs.readFileSync("apps/roku-pro60/components/HomeScene.brs", "utf8");
const catalog = fs.readFileSync("apps/roku-pro60/components/CatalogTask.brs", "utf8");
const pairing = fs.readFileSync("apps/roku-pro60/components/PairingTask.brs", "utf8");

assert.match(config, /com\\.eleazarcompany\\.sebasplay\\.pro60\\.independent20261126/);
assert.match(manifest, /^title=SEBAS PLAY PRO 6\\.0$/m);
assert.match(manifest, /^major_version=6$/m);
for (const [name, source] of [["HomeScene", home], ["CatalogTask", catalog], ["PairingTask", pairing]]) {
  assert.match(source, /SEBASPLAYPRO60/, name + " must use the PRO 6.0 registry section");
  assert.doesNotMatch(source, /SEBASPLAYPRO50/, name + " must not reuse PRO 5.0 local storage");
}
assert.match(home, /Vincular SEBAS PLAY PRO 6\\.0/);
assert.match(home, /roku-device-sync\\?action=sync|CatalogTask/);
console.log("PASS: PRO 6.0 Android identity and Roku local registry are isolated from PRO 5.0.");
