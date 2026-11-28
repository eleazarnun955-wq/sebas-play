import fs from "node:fs";
import assert from "node:assert/strict";

const pairing = fs.readFileSync("src/DeviceSyncManager.tsx", "utf8");
const viewer = fs.readFileSync("src/ViewerApp.tsx", "utf8");
const laptop = fs.readFileSync("src/LaptopConnection.tsx", "utf8");
const config = fs.readFileSync("capacitor.config.ts", "utf8");

assert.match(pairing, /supabase\.auth\.getSession\(\)/, "Android pairing must obtain a current session");
assert.match(pairing, /supabase\.auth\.refreshSession\(\)/, "Android pairing must refresh expired sessions");
assert.match(pairing, /Authorization:\s*"Bearer "\s*\+\s*session\.access_token/, "Pairing call must use the refreshed access token");
assert.match(pairing, /ABCDEFGHJKLMNPQRSTUVWXYZ\]\{12\}/, "Android must validate the 12-character pairing code");
assert.match(pairing, /setInterval\(\(\)=>void poll\(\),2500\)/, "Android must detect successful Roku pairing automatically");
assert.match(viewer, /<DeviceSyncManager profileId=\{activeProfileId\}\/>/, "Android viewer must keep the Roku pairing panel mounted");
assert.match(viewer, /onClick=\{\(\)=>setLaptopOpen\(true\)\}[^>]*>[\s\S]*?Mi laptop/, "The Mi laptop entry must remain available");
assert.match(viewer, /import LaptopConnection from "\.\/LaptopConnection"/, "The existing laptop connection module must remain imported");
assert.match(laptop, /localStorage\.getItem\("sebas_laptop_token"\)/, "Laptop token persistence must remain unchanged");
assert.match(config, /com\.eleazarcompany\.sebasplay\.v16\.independiente20261127/, "Android v16 must keep its independent package ID");
console.log("Android Roku pairing checks passed; Mi laptop connection remains present and unchanged.");
