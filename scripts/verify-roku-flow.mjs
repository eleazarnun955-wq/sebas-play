import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const home = read("apps/roku/components/HomeScene.brs");
const homeXml = read("apps/roku/components/HomeScene.xml");
const catalog = read("apps/roku/components/CatalogTask.brs");
const catalogXml = read("apps/roku/components/CatalogTask.xml");
const player = read("apps/roku/components/PlayerScene.brs");
const playerXml = read("apps/roku/components/PlayerScene.xml");

assert.match(homeXml, /<Timer id="dialogTransitionTimer" duration="0\.8" repeat="false"/, "Roku dialog transition timer must exist in the scene");
assert.match(home, /FindNode\("dialogTransitionTimer"\)/, "HomeScene must bind the transition timer");
assert.match(home, /ObserveField\("fire", "onDialogTransitionTimer"\)/, "HomeScene must observe timer completion");
assert.match(home, /dialog\.ObserveField\("buttonSelected", "onUrlEntered"\)/, "URL dialog must route its selection to onUrlEntered");
assert.match(home, /m\.dialogTransition = "token"[\s\S]*m\.dialogTimer\.control = "stop"[\s\S]*m\.dialogTimer\.control = "start"/, "URL acceptance must restart a clean token-dialog timer");
assert.match(home, /m\.urlDialogPending = true[\s\S]*m\.top\.dialog = invalid/, "URL handoff must lock repeated dialog callbacks before closing the URL dialog");
assert.match(home, /m\.dialogTransition = ""[\s\S]*m\.urlDialogPending = false[\s\S]*askLaptopToken\(\)/, "Token dialog must open only after the pending handoff completes");
assert.match(home, /sub onDialogTransitionTimer\(\)[\s\S]*askLaptopToken\(\)/, "Timer completion must open the token dialog");
assert.match(home, /dialog\.ObserveField\("buttonSelected", "onTokenEntered"\)/, "Token dialog must route its selection to onTokenEntered");
assert.match(home, /m\.registry\.Write\("laptopUrl", m\.laptopUrl\)[\s\S]*m\.registry\.Write\("laptopToken", m\.laptopToken\)/, "Successful token entry must persist URL and token in the isolated registry");
assert.match(catalogXml, /extends="Task"/, "Catalog network work must run in a SceneGraph Task");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/health"\)/, "Laptop connection must validate server health first");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/api\/catalog"\)[\s\S]*AddHeader\("Authorization", "Bearer " \+ token\)/, "Catalog token must be sent only in the Authorization header");
assert.doesNotMatch(catalog, /api\/catalog\?token=/i, "Catalog token must never be placed in the URL");
assert.match(playerXml, /<Video id="video"/, "Native Roku video player must exist");
assert.match(player, /ObserveField\("state", "onVideoState"\)/, "Player must observe playback state");
assert.match(player, /state = "error"[\s\S]*state = "finished"/, "Player must handle errors and normal completion");
console.log("PASS: Roku URL → timer → token → authenticated catalog → playback flow regression checks.");

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
