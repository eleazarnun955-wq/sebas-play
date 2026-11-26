import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("apps/roku-100-ultra");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const manifest = read("manifest");
const catalog = read("components/CatalogTask.brs");
const home = read("components/HomeScene.brs");
const player = read("components/PlayerScene.brs");
const pairing = read("components/PairingTask.brs");
const favorites = read("components/FavoriteTask.brs");
const progress = read("components/ProgressTask.brs");

assert.match(manifest, /^title=SEBAS PLAY 10\.0 ULTRA$/m);
assert.match(manifest, /^major_version=10$/m);
assert.match(home, /SEBAS PLAY 10\.0 ULTRA/);
assert.match(home, /SEBASPLAY100ULTRA/);
assert.match(catalog, /laptopRow\.title = "Mi laptop"/);
assert.match(catalog, /function isLaptopMediaUrl/);
assert.match(catalog, /\/media\//);
assert.match(catalog, /isDirectPlayableUrl\(clean\)/);
assert.match(catalog, /functions\/v1\/roku-device-sync\?action=sync/);
assert.match(pairing, /SEBASPLAY100ULTRA/);
assert.match(favorites, /action: "favorite"/);
assert.match(progress, /action: "progress"/);
assert.match(player, /detectStreamFormat/);
assert.match(player, /return "mp4"/);
assert.doesNotMatch([catalog, home, pairing, favorites, progress].join("\n"), /SEBASPLAY90ULTRA/);

console.log("PASS: Roku 10.0 independent identity, Mi laptop row, signed laptop MP4 playback, pairing, favorites and progress contracts.");
