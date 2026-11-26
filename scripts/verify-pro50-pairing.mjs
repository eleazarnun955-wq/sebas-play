import assert from "node:assert/strict";
import fs from "node:fs";

const fn = fs.readFileSync("supabase/functions/roku-device-sync/index.ts", "utf8");
const schema = fs.readFileSync("supabase/migrations/20261125235247_roku_device_pairing.sql", "utf8");
const deny = fs.readFileSync("supabase/migrations/20261125235559_roku_pairing_deny_client_policies.sql", "utf8");
const rokuPair = fs.readFileSync("apps/roku-pro40/components/PairingTask.brs", "utf8");
const rokuFavorite = fs.readFileSync("apps/roku-pro40/components/FavoriteTask.brs", "utf8");
const rokuHome = fs.readFileSync("apps/roku-pro40/components/HomeScene.brs", "utf8");
const rokuProgress = fs.readFileSync("apps/roku-pro40/components/ProgressTask.brs", "utf8");
const rokuPlayer = fs.readFileSync("apps/roku-pro40/components/PlayerScene.brs", "utf8");
const android = fs.readFileSync("src/ViewerApp.tsx", "utf8");

for (const action of ["pair-code", "pair-device", "devices", "revoke-device", "sync", "favorite", "progress"]) {
  assert.ok(fn.includes('"'+action+'"'), "missing Edge Function action: " + action);
}
assert.match(fn, /crypto\.subtle\.digest\("SHA-256"/);
assert.match(fn, /expires_at/);
assert.match(fn, /redeemed_at/);
assert.match(fn, /revoked_at/);
assert.match(fn, /auth\.getUser\(token\)/);
assert.match(schema, /enable row level security/);
assert.match(schema, /revoke all on table public\.paired_devices from anon, authenticated/);
assert.match(deny, /using \(false\) with check \(false\)/);
assert.match(rokuPair, /device_token/);
assert.match(rokuFavorite, /Authorization/);
assert.match(rokuFavorite, /operation/);
assert.match(rokuHome, /toggleFocusedFavorite/);
assert.match(rokuHome, /Agregar \/ quitar de Mi lista/);
assert.match(rokuProgress, /Authorization/);
assert.match(rokuPlayer, /saveProgress\(true\)/, "Roku player must checkpoint progress on exit/error");
assert.match(rokuPlayer, /saveProgress\(false\)/, "Roku player must checkpoint progress during playback and pause");
assert.match(rokuPlayer, /pendingPosition/, "Roku player must queue the newest checkpoint while a request is active");
assert.match(rokuPlayer, /startProgressTask\(nextPosition, nextDuration\)/, "Roku player must flush the latest queued checkpoint after the previous request");
assert.match(android, /Vincular Roku/);
assert.match(android, /revoke-device/);
console.log("PASS: PRO 5.0 secure Roku pairing, token revocation, private RLS and Android/Roku client wiring.");
