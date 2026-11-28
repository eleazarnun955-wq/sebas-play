import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const home = read("apps/roku/components/HomeScene.brs");
const homeXml = read("apps/roku/components/HomeScene.xml");
const catalog = read("apps/roku/components/CatalogTask.brs");
const catalogXml = read("apps/roku/components/CatalogTask.xml");
const player = read("apps/roku/components/PlayerScene.brs");
const playerXml = read("apps/roku/components/PlayerScene.xml");

const main = read("apps/roku/source/main.brs");
const manifest = read("apps/roku/manifest");

assert.match(home, /m\.connectButton\.text = "Conectar desde Android"/, "Roku must direct laptop setup through Android instead of asking for codes on TV");
assert.match(home, /m\.top\.launchLaptopUrl/, "Roku scene must receive the laptop address from Android");
assert.match(home, /m\.top\.launchLaptopToken/, "Roku scene must receive the laptop token from Android");
assert.match(home, /ObserveField\("launchLaptopUrl", "onLegacyLaunchLaptopConnectionChanged"\)[\s\S]*ObserveField\("launchLaptopToken", "onLegacyLaunchLaptopConnectionChanged"\)/, "Roku must retain compatibility with older launch arguments");
assert.match(home, /sub onLaunchLaptopConnectionChanged\(\)[\s\S]*applyLaptopConnection\(/, "Roku must process the atomic ECP input payload");
assert.match(home, /m\.registry\.Write\("laptopUrl", m\.laptopUrl\)[\s\S]*m\.registry\.Write\("laptopToken", m\.laptopToken\)/, "Roku must persist the laptop connection received from Android");
assert.match(home, /sub applyLaptopConnection\([\s\S]*loadCatalog\(\)/, "Atomic ECP payload must update saved laptop settings and refresh the library");

assert.match(main, /CreateObject\("roInput"\)/, "Roku must listen for ECP deep links while the app is already running");
assert.match(main, /type\(msg\) = "roInputEvent"[\s\S]*msg\.GetInfo\(\)[\s\S]*scene\.launchConnection = launchConnection/, "Running Roku channel must receive Android laptop values atomically");
assert.match(homeXml, /field id="launchConnection" type="assocarray"/, "HomeScene must accept the atomic Android connection payload");
assert.match(home, /ObserveField\("launchConnection", "onLaunchLaptopConnectionChanged"\)/, "HomeScene must observe ECP input launch data");
assert.match(main, /args\.DoesExist\("laptopUrl"\)[\s\S]*args\.DoesExist\("laptopToken"\)/, "Cold Roku launch must pass both laptop values");
assert.match(manifest, /supports_input_launch=1/, "Roku must accept ECP deep links without restarting an already-running channel");

assert.match(home, /else if index = 1\s+loadCatalog\(\)/, "Actualizar biblioteca must reload the laptop library");
assert.doesNotMatch(home, /askLaptopUrl|askLaptopToken/, "Roku must not require manual laptop address or token entry on TV");

assert.match(catalogXml, /extends="Task"/, "Catalog network work must run in a SceneGraph Task");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/health"\)/, "Laptop connection must validate server health first");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/api\/catalog"\)[\s\S]*AddHeader\("Authorization", "Bearer " \+ token\)/, "Catalog token must be sent only in the Authorization header");
assert.doesNotMatch(catalog, /api\/catalog\?token=/i, "Catalog token must never be placed in the URL");
assert.match(playerXml, /<Video id="video"/, "Native Roku video player must exist");
assert.match(player, /ObserveField\("state", "onVideoState"\)/, "Player must observe playback state");
assert.match(player, /state = "error"[\s\S]*state = "finished"/, "Player must handle errors and normal completion");
console.log("PASS: Android-to-Roku direct laptop handoff and working library refresh.");

const syncTask = read("apps/roku/components/SyncTask.brs");
const syncTaskXml = read("apps/roku/components/SyncTask.xml");
assert.match(syncTaskXml, /extends="Task"/, "Account sync and pairing must run in a SceneGraph Task");
assert.match(syncTask, /sub runSync\(\)[\s\S]*GetToString\(\)|PostFromString\(/, "SyncTask must perform network requests off the UI thread");
assert.match(home, /startSyncTask\("pair-device"/, "Pairing must use the background sync task");
assert.match(home, /startSyncTask\("favorite"/, "Favorite writes must use the background sync task");
assert.match(home, /startSyncTask\("sync"/, "Account refresh must use the background sync task");
console.log("PASS: Roku account pairing, favorites and sync run off the UI thread.");

const progressTask = read("apps/roku/components/ProgressTask.brs");
const progressTaskXml = read("apps/roku/components/ProgressTask.xml");
assert.match(progressTaskXml, /extends="Task"/, "Playback progress network writes must run in a SceneGraph Task");
assert.match(player, /CreateObject\("roSGNode", "ProgressTask"\)/, "Player must delegate cloud progress writes to ProgressTask");
assert.doesNotMatch(player, /syncTransfer\.PostFromString/, "Player UI thread must not perform blocking cloud progress writes");
assert.match(progressTask, /PostFromString\(FormatJson\(payload\)\)/, "ProgressTask must persist playback position to the sync endpoint");
console.log("PASS: playback progress uploads run off the Roku UI thread.");

for (const [name, source] of [["CatalogTask", catalog], ["SyncTask", syncTask], ["ProgressTask", progressTask]]) {
  const transfers = (source.match(/CreateObject\("roUrlTransfer"\)/g) || []).length;
  const guarded = (source.match(/\b\w+\.SetMinimumTransferRate\(/g) || []).length;
  assert.equal(guarded, transfers, name + " must protect every network transfer against stalled responses");
}
console.log("PASS: Roku catalog, account sync and playback progress transfers have stall protection.");

const syncFunction = read("supabase/functions/roku-device-sync/index.ts");
assert.match(syncFunction, /access-control-allow-headers":"authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage"/, "Supabase function CORS must allow the headers sent by supabase-js browser clients");
assert.ok(home.includes('m.actions.ObserveField("buttonSelected", "onActionSelected")'), "Roku action buttons must be wired to their handler");
console.log("PASS: Android pairing CORS headers, direct laptop handoff and Roku library refresh regression checks.");

assert.ok(catalog.includes('if laptopUrl = "" or laptopToken = "" then') && catalog.includes('m.top.catalog = root') && catalog.includes('        return'), "Roku must stop cleanly until Android passes the laptop connection");
assert.ok(catalog.includes("loadLaptopCatalog(root, laptopUrl, laptopToken)"), "Roku must load its only catalog from the laptop");
assert.doesNotMatch(catalog.slice(0, catalog.indexOf("sub loadSeriesEpisodes")), /SebasPlaySupabaseUrl|live_channels|loadCollection/, "Roku home catalog must not load external channel feeds");
console.log("PASS: Roku uses only the private laptop library; no external TV/channel feeds.");
