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
assert.equal(appId, "com.eleazarcompany.sebasplay.v21.privatestream20261128", "Android 21.0 must retain its unique application ID");
assert.equal(appName, "SEBAS PLAY 21.0", "Android app label must identify version 21.0");
assert.notEqual(appId, "com.eleazarcompany.sebasplay.v12.independiente20261126", "13.0 must not replace 12.0");
assert.notEqual(appId, "com.eleazarcompany.sebasplay.v11.miLaptopVlc20261125", "13.0 must not replace 11.0");

assert.ok(manifest.includes("title=SEBAS PLAY 21.0"),"Roku manifest must identify version 21.0");
assert.ok(manifest.includes("major_version=21"),"Roku manifest must use major version 20");
assert.match(manifest, /^minor_version=0$/m);
for (const [name, source] of [["Roku HomeScene", home], ["Roku PlayerScene", player]]) {
  assert.match(source, /roRegistrySection", "SEBASPLAY21"/, name + " must use the isolated 21.0 registry");
  assert.doesNotMatch(source, /roRegistrySection", "SEBASPLAY"/, name + " must not reuse the legacy registry");
}
assert.ok(androidWorkflow.includes("com.eleazarcompany.sebasplay.v21.privatestream20261128"));
assert.match(rokuWorkflow, /SEBAS-PLAY-21-0-ROKU-INDEPENDIENTE/);
assert.match(rokuSyncFunction, /pair-device/);
assert.match(rokuSyncFunction, /revoke-device/);
assert.match(rokuSyncFunction, /family_profile_watch_progress/);
assert.match(familyFunction, /verify-profile-pin/);
assert.match(pinHelper, /PBKDF2/);
console.log("PASS: Android and Roku 21.0 retain independent package identity, labels, and Roku registry.");

const viewer = read("src/ViewerApp.tsx");
assert.match(viewer, /onPause=\{e=>\{const v=e\.currentTarget;if\(!v\.ended\)void saveProgress\("movie",selected\.item\.id,v\.currentTime,v\.duration,true\)\}\}/, "Pausing a movie must immediately flush watch progress");
assert.match(viewer, /onPause=\{e=>\{const v=e\.currentTarget;if\(!v\.ended\)void saveProgress\("episode",episode\.id,v\.currentTime,v\.duration,true\)\}\}/, "Pausing an episode must immediately flush watch progress");
console.log("PASS: movie and episode pause events immediately persist playback progress.");
