import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const capacitor = read("capacitor.config.ts");
const manifest = read("apps/roku/manifest");
const home = read("apps/roku/components/HomeScene.brs");
const player = read("apps/roku/components/PlayerScene.brs");
const androidWorkflow = read(".github/workflows/android-apk.yml");
const rokuWorkflow = read(".github/workflows/roku-package.yml");
const rokuSyncFunction = read("supabase/functions/roku-device-sync/index.ts");
const familyFunction = read("supabase/functions/sebas-family-profiles/index.ts");
const pinHelper = read("supabase/functions/sebas-family-profiles/profile-security.mjs");

const appId = capacitor.match(/appId:\s*"([^"]+)"/)?.[1];
const appName = capacitor.match(/appName:\s*"([^"]+)"/)?.[1];
assert.equal(appId, "com.eleazarcompany.sebasplay.v13.independiente20261126", "Android 13.0 must retain its unique application ID");
assert.equal(appName, "SEBAS PLAY 13.0", "Android app label must identify version 13.0");
assert.notEqual(appId, "com.eleazarcompany.sebasplay.v12.independiente20261126", "13.0 must not replace 12.0");
assert.notEqual(appId, "com.eleazarcompany.sebasplay.v11.miLaptopVlc20261125", "13.0 must not replace 11.0");

assert.match(manifest, /^title=SEBAS PLAY 13\.0$/m);
assert.match(manifest, /^major_version=13$/m);
assert.match(manifest, /^minor_version=0$/m);
for (const [name, source] of [["Roku HomeScene", home], ["Roku PlayerScene", player]]) {
  assert.match(source, /roRegistrySection", "SEBASPLAY13"/, name + " must use the isolated 13.0 registry");
  assert.doesNotMatch(source, /roRegistrySection", "SEBASPLAY"/, name + " must not reuse the legacy registry");
}
assert.match(androidWorkflow, /com\.eleazarcompany\.sebasplay\.v13\.independiente20261126/);
assert.match(rokuWorkflow, /SEBAS-PLAY-13-0-ROKU-INDEPENDIENTE/);
assert.match(rokuSyncFunction, /pair-device/);
assert.match(rokuSyncFunction, /revoke-device/);
assert.match(rokuSyncFunction, /family_profile_watch_progress/);
assert.match(familyFunction, /verify-profile-pin/);
assert.match(pinHelper, /PBKDF2/);
console.log("PASS: Android and Roku 13.0 retain independent package identity, labels, and Roku registry.");
