import fs from "node:fs";
import assert from "node:assert/strict";

const viewer=fs.readFileSync("src/ViewerApp.tsx","utf8");
const laptop=fs.readFileSync("src/LaptopConnection.tsx","utf8");
const localLibrary=fs.readFileSync("src/LaptopLibraryView.tsx","utf8");
const direct=fs.readFileSync("src/RokuDirectConnect.tsx","utf8");
const nativeInstaller=fs.readFileSync("scripts/install-roku-discovery.mjs","utf8");
const config=fs.readFileSync("capacitor.config.ts","utf8");

assert.match(viewer,/import LaptopConnection from "\.\/LaptopConnection"/,"Existing laptop connection module must remain imported");
assert.match(viewer,/onClick=\{\(\)=>setLaptopOpen\(true\)\}[^>]*>[\s\S]*?Mi laptop/,"Mi laptop shortcut must remain visible in the main navigation");
assert.match(viewer,/RokuDirectConnect/,"Direct Roku connection must be mounted in the main viewer");
assert.match(viewer,/LaptopLibraryView/,"The main screen must display the laptop library");
assert.doesNotMatch(viewer, /<FreePlatforms/, "External movie-platform links must not be shown");
assert.ok(localLibrary.includes('item.category||"Sin categoría"'),"The Android library must group videos by folder category");
assert.match(laptop,/sebas-laptop-updated/,"Connecting Mi laptop must refresh the main library");
assert.match(viewer,/profiles\.map\(p=>/,"Family profiles must remain available");
assert.match(laptop,/localStorage\.getItem\("sebas_laptop_token"\)/,"Laptop token persistence must remain unchanged");
assert.match(direct,/RokuDiscovery\.discover\(\)/,"Android must discover Roku devices automatically");
assert.match(direct,/RokuDiscovery\.launch\(/,"Android must open SEBAS PLAY on the selected Roku");
assert.match(nativeInstaller,/M-SEARCH/,"Native Android plugin must perform SSDP discovery");
assert.match(nativeInstaller,/CHANGE_WIFI_MULTICAST_STATE/,"Android manifest must allow multicast discovery");
assert.match(config,/com\.eleazarcompany\.sebasplay\.v18\.localibrary20261128/,"v18 must use a package ID independent from previous installs");
assert.doesNotMatch(viewer,/Vincular Roku/,"Old manual pairing-code entry must not remain visible");
console.log("PASS: v18 direct Roku discovery, separate Android package, profiles and Mi laptop preservation.");
