import assert from "node:assert/strict";
import fs from "node:fs";

const admin = fs.readFileSync("src/App.tsx", "utf8");
const candidates = fs.readFileSync("src/LiveChannelCandidates.tsx", "utf8");
const viewer = fs.readFileSync("src/ViewerApp.tsx", "utf8");
const rokuCatalog = fs.readFileSync("apps/roku/components/CatalogTask.brs", "utf8");
const rokuManifest = fs.readFileSync("apps/roku/manifest", "utf8");
const androidConfig = fs.readFileSync("capacitor.config.ts", "utf8");

const urls = [...candidates.matchAll(/streamUrl:\s*"([^"]+)"/g)].map(match => match[1]);
assert.ok(urls.length >= 8, "Spanish live TV candidates must include several channels");
for (const value of urls) {
  const url = new URL(value);
  assert.equal(url.protocol, "https:", "Every candidate must use HTTPS");
  assert.match(url.pathname, /\.m3u8$/i, "Every candidate must be a direct HLS manifest, not a webpage");
  assert.equal(url.hash, "", "Candidate URLs must not contain fragments");
}
assert.match(candidates, /No se publican automáticamente/, "Candidates must remain review-only");
assert.match(admin, /Solo se aceptan señales HLS directas HTTPS/, "Admin must reject web pages and non-HLS URLs");
assert.ok(admin.includes('/\\.m3u8$/i'), "Admin HLS validator must check the URL path suffix");
assert.match(admin, /rights_note/,"Admin must require documented rights before publishing live channels");
assert.match(admin, /LiveChannelCandidates/, "Admin must expose the candidate list for review");
assert.match(viewer, /isDirectLiveStreamUrl\(item\.stream_url\)/, "Android must filter live TV to direct HLS URLs");
assert.match(rokuCatalog, /function isDirectLiveStreamUrl[\s\S]*Right\(url, 5\) = "\.m3u8"/, "Roku must reject web pages and non-HLS URLs");
assert.match(rokuCatalog, /item\.StreamFormat = "hls"/, "Roku must use HLS playback for live channels");
assert.match(rokuManifest, /title=SEBAS PLAY 26\.0/);
assert.match(rokuManifest, /major_version=26/);
assert.match(androidConfig, /com\.eleazarcompany\.sebasplay\.v26\.verifiedlivetv20261128/);
assert.match(androidConfig, /SEBAS PLAY 26\.0/);
console.log("PASS: v26 Spanish live-TV candidates are HTTPS HLS only, draft-only until rights review, and filtered on Android/Roku.");
