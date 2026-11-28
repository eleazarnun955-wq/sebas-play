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

assert.match(homeXml, /brandIntroOverlay/,"Roku must show the branded intro overlay");
assert.match(homeXml, /brandIntroAudio/,"Roku must include the intro audio player");
assert.match(home, /pkg:\/audio\/sebas-play-intro\.mp3/,"Roku must play the spoken brand audio");
assert.match(home, /onBrandIntroFinished/,"Roku intro must close on its timer");
assert.match(home, /streamFormat = "mp3"/,"Roku intro must play the female neural MP3 audio");
assert.match(read(".github/workflows/roku-package.yml"),/es-MX-DaliaNeural/,"Roku build must generate the Mexican female neural voice");
assert.match(home, /m\.connectButton\.text = "Conectar desde Android"/, "Roku must direct laptop setup through Android instead of asking for codes on TV");
assert.match(home, /m\.top\.launchLaptopUrl/, "Roku scene must receive the laptop address from Android");
assert.match(home, /m\.top\.launchLaptopToken/, "Roku scene must receive the laptop token from Android");
assert.match(home, /ObserveField\("launchLaptopUrl", "onLaunchLaptopConnectionChanged"\)[\s\S]*ObserveField\("launchLaptopToken", "onLaunchLaptopConnectionChanged"\)/, "Roku must observe Android launch arguments even when they arrive after SceneGraph init");
assert.match(home, /sub onLaunchLaptopConnectionChanged\(\)[\s\S]*loadCatalog\(\)/, "Receiving Android laptop settings must persist them and refresh the Roku library");
assert.match(home, /m\.registry\.Write\("laptopUrl", m\.laptopUrl\)[\s\S]*m\.registry\.Write\("laptopToken", m\.laptopToken\)/, "Roku must persist the laptop connection received from Android");
assert.match(main, /args\.DoesExist\("laptopUrl"\)[\s\S]*args\.DoesExist\("laptopToken"\)/, "Roku launch handler must pass Android laptop settings to HomeScene");
assert.match(home, /else if index = 1\s+loadCatalog\(\)/, "Actualizar biblioteca must reload the laptop library");
assert.doesNotMatch(home, /askLaptopUrl|askLaptopToken/, "Roku must not require manual laptop address or token entry on TV");

assert.match(catalogXml, /extends="Task"/, "Catalog network work must run in a SceneGraph Task");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/health"\)/, "Laptop connection must validate server health first");
assert.match(catalog, /SetUrl\(baseUrl \+ "\/api\/catalog"\)[\s\S]*AddHeader\("Authorization", "Bearer " \+ token\)/, "Catalog token must be sent only in the Authorization header");
assert.doesNotMatch(catalog, /api\/catalog\?token=/i, "Catalog token must never be placed in the URL");
assert.match(playerXml, /<Video id="video"/, "Native Roku video player must exist");
assert.match(player, /ObserveField\("state", "onVideoState"\)/, "Player must observe playback state");
assert.match(player, /state = "error"[\s\S]*state = "finished"/, "Player must handle errors and normal completion");
console.log("PASS: v26 Android-to-Roku direct laptop handoff and working library refresh.");

const syncTask = read("apps/roku/components/SyncTask.brs");
const syncTaskXml = read("apps/roku/components/SyncTask.xml");
assert.match(syncTaskXml, /extends="Task"/, "Account sync and pairing must run in a SceneGraph Task");
assert.match(syncTask, /AsyncGetToString\(\)/, "SyncTask must use asynchronous GET requests");
assert.match(syncTask, /AsyncPostFromString\(body\)/, "SyncTask must use asynchronous POST requests");
assert.match(syncTask, /Wait\(timeoutMs, port\)/, "SyncTask must cap network waits");
assert.match(syncTask, /AsyncCancel\(\)/, "SyncTask must cancel requests that exceed the timeout");
assert.match(home, /startSyncTask\("pair-device"/, "Pairing must use the background sync task");
assert.match(home, /startSyncTask\("favorite"/, "Favorite writes must use the background sync task");
assert.match(home, /startSyncTask\("sync"/, "Account refresh must use the background sync task");
console.log("PASS: Roku account pairing, favorites and sync run off the UI thread.");

const progressTask = read("apps/roku/components/ProgressTask.brs");
const progressTaskXml = read("apps/roku/components/ProgressTask.xml");
assert.match(progressTaskXml, /extends="Task"/, "Playback progress network writes must run in a SceneGraph Task");
assert.match(player, /CreateObject\("roSGNode", "ProgressTask"\)/, "Player must delegate cloud progress writes to ProgressTask");
assert.doesNotMatch(player, /syncTransfer\.PostFromString/, "Player UI thread must not perform blocking cloud progress writes");
assert.match(progressTask, /AsyncPostFromString\(FormatJson\(payload\)\)/, "ProgressTask must persist playback position asynchronously");
assert.match(progressTask, /Wait\(8000, port\)/, "ProgressTask must cap progress upload waits");
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

assert.ok(catalog.includes('if laptopUrl <> "" and laptopToken <> ""') && catalog.includes('loadLaptopCatalog(root, laptopUrl, laptopToken)'), "Roku must add the private laptop library when Android passes its saved connection");
assert.match(catalog, /loadCollection\(root, supabaseUrl, publicKey, "movies"/, "Roku must show the published SEBAS PLAY movie catalog");
assert.match(catalog, /loadSeriesEpisodes\(root, supabaseUrl, publicKey\)/, "Roku must show published series episodes");
assert.match(catalog, /loadCollection\(root, supabaseUrl, publicKey, "live_channels"/, "Roku must show published live channels");
assert.match(catalog, /is_published=eq\.true/, "Roku catalog queries must exclude unpublished content");
assert.match(catalog, /release_year=gte\.2023/, "Roku must exclude older movies and series");
assert.match(catalog, /playableEntry = isDirectPlayableUrl\(entryUrl\)[\s\S]*if tableName = "live_channels" then playableEntry = isDirectLiveStreamUrl\(entryUrl\)/, "Roku live TV must require a direct HLS manifest");
assert.match(catalog, /function isDirectLiveStreamUrl[\s\S]*Right\(url, 5\) = "\.m3u8"/, "Roku live TV must reject web pages and non-HLS URLs");
assert.match(catalog, /item\.StreamFormat = "hls"/, "Roku must play direct live channels as HLS");
assert.match(catalog, /isDirectPlayableUrl\(safeString\(episode\.video_url\)\)/, "Roku episodes must require direct media URLs");
assert.match(catalog, /if tableName = "live_channels" then playableEntry = isDirectLiveStreamUrl\(entryUrl\)/, "Roku live TV must use strict HLS-only validation");
assert.match(catalog, /item\.StreamFormat = "hls"/, "Roku live TV must use the HLS player mode");
assert.match(catalog, /item\.Url = safeString\(entry\.video_url\)/, "Movies must use their direct video URL field");
assert.match(catalog, /item\.Url = safeString\(entry\.stream_url\)/, "Live channels must use their direct stream URL field");
console.log("PASS: Roku combines published SEBAS PLAY discovery catalog with the optional private laptop library.");
