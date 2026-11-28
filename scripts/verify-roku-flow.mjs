import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const home = read("apps/roku/components/HomeScene.brs");
const homeXml = read("apps/roku/components/HomeScene.xml");
const catalog = read("apps/roku/components/CatalogTask.brs");
const catalogXml = read("apps/roku/components/CatalogTask.xml");
const player = read("apps/roku/components/PlayerScene.brs");
const playerXml = read("apps/roku/components/PlayerScene.xml");

assert.match(home, /m\.top\.launchLaptopUrl[\s\S]*m\.top\.launchLaptopToken/, "Roku must accept laptop credentials handed off from Android");
assert.match(home, /m\.registry\.Write\("laptopUrl", m\.laptopUrl\)[\s\S]*m\.registry\.Write\("laptopToken", m\.laptopToken\)/, "Roku must persist the handed-off URL and token");
assert.doesNotMatch(home, /askLaptopUrl\(\)|askLaptopToken\(\)/, "Roku must not require manual keyboard entry");
assert.match(home, /Actualizar biblioteca de mi laptop/, "Roku must provide a refresh action");
assert.match(catalogXml, /extends="Task"/, "Catalog network work must run in a SceneGraph Task");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/health"\)/, "Laptop connection must validate server health first");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/api\/catalog"\)[\s\S]*AddHeader\("Authorization", "Bearer " \+ token\)/, "Catalog token must be sent only in the Authorization header");
assert.doesNotMatch(catalog, /api\/catalog\?token=/i, "Catalog token must never be placed in the URL");
assert.doesNotMatch(catalog, /loadCollection\(root, url, key/, "Roku must not load remote catalogue sources");
assert.match(playerXml, /<Video id="video"/, "Native Roku video player must exist");
assert.match(player, /ObserveField\("state", "onVideoState"\)/, "Player must observe playback state");
assert.match(player, /state = "error"[\s\S]*state = "finished"/, "Player must handle errors and normal completion");
console.log("PASS: Android handoff → saved laptop credentials → local catalog → playback regression checks.");

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
assert.doesNotMatch(home, /askLaptopUrl|askLaptopToken/, "Roku must not open manual laptop keyboard dialogs");
assert.match(home, /m\.actions\.SetFocus\(true\)/, "Roku home actions must receive focus on startup");
console.log("PASS: Android pairing CORS headers and Roku dialog focus/fallback regression checks.");
