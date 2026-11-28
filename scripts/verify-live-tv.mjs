// v28 Mexico-first live TV regression suite.
import assert from "node:assert/strict";
import fs from "node:fs";

const admin = fs.readFileSync("src/App.tsx", "utf8");
const candidates = fs.readFileSync("src/LiveChannelCandidates.tsx", "utf8");
const viewer = fs.readFileSync("src/ViewerApp.tsx", "utf8");
const rokuCatalog = fs.readFileSync("apps/roku/components/CatalogTask.brs", "utf8");
const rokuPlayer = fs.readFileSync("apps/roku/components/PlayerScene.brs", "utf8");
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
assert.match(candidates, /Prueba técnica antes de publicar/, "Candidate UI must explain review-only status");
assert.match(candidates, /Hls\.isSupported\(\)/, "Admin must offer an HLS playback probe");
assert.match(candidates, /ni concede derechos/, "Technical playback must not be confused with retransmission rights");
assert.match(candidates, /Canal Catorce/);
assert.match(candidates, /TV UNAM/);
assert.match(candidates, /Canal 44 Chihuahua/);
assert.match(admin, /Solo se aceptan señales HLS directas HTTPS/, "Admin must reject web pages and non-HLS URLs");
assert.ok(admin.includes('/\\.m3u8$/i'), "Admin HLS validator must check the URL path suffix");
assert.match(admin, /rights_note/,"Admin must require documented rights before publishing live channels");
assert.match(admin, /LiveChannelCandidates/, "Admin must expose the candidate list for review");
assert.match(viewer, /isDirectLiveStreamUrl\(item\.stream_url\)/, "Android must filter live TV to direct HLS URLs");
assert.match(rokuCatalog, /function isDirectLiveStreamUrl[\s\S]*Right\(url, 5\) = "\.m3u8"/, "Roku must reject web pages and non-HLS URLs");
assert.match(rokuCatalog, /item\.StreamFormat = "hls"/, "Roku must use HLS playback for live channels");
assert.match(rokuManifest, /title=SEBAS PLAY 28\.0/);
assert.match(rokuManifest, /major_version=28/);
assert.match(androidConfig, /com\.eleazarcompany\.sebasplay\.v28\.mexicolivetv20261128/);
assert.match(androidConfig, /SEBAS PLAY 28\.0/);
assert.match(rokuPlayer, /content\.StreamFormat = "hls"/, "Roku player must force HLS for live channels");
console.log("PASS: v28 Mexico-first Spanish live-TV candidates are HTTPS HLS only, draft-only until rights review, and filtered for Android/Roku.");
