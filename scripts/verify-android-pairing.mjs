import fs from "node:fs";
import assert from "node:assert/strict";

const viewer=fs.readFileSync("src/ViewerApp.tsx","utf8");
const laptop=fs.readFileSync("src/LaptopConnection.tsx","utf8");
const direct=fs.readFileSync("src/RokuDirectConnect.tsx","utf8");
const nativeInstaller=fs.readFileSync("scripts/install-roku-discovery.mjs","utf8");
const config=fs.readFileSync("capacitor.config.ts","utf8");

assert.match(viewer,/import LaptopConnection from "\.\/LaptopConnection"/,"Existing laptop connection module must remain imported");
assert.match(viewer,/onClick=\{\(\)=>setLaptopOpen\(true\)\}[^>]*>[\s\S]*?Mi laptop/,"Mi laptop shortcut must remain visible in the main navigation");
assert.match(viewer,/RokuDirectConnect/,"Direct Roku connection must remain mounted in the main viewer");
assert.match(viewer,/profiles\.map\(p=>/,"Family profiles must remain available");
assert.match(laptop,/localStorage\.getItem\("sebas_laptop_token"\)/,"Existing laptop token persistence must remain unchanged");
assert.match(direct,/RokuDiscovery\.discover\(\)/,"Android must discover Roku devices automatically");
assert.match(direct,/localStorage\.getItem\("sebas_laptop_url"\)/,"Android must pass the saved laptop address to Roku");
assert.match(direct,/localStorage\.getItem\("sebas_laptop_token"\)/,"Android must pass the saved laptop token to Roku");
assert.match(direct,/RokuDiscovery\.launch\(\{ip:device\.ip,channelId:device\.channelId\|\|"dev",laptopUrl,laptopToken\}\)/,"Android must launch Roku with laptop connection details");
assert.match(nativeInstaller,/M-SEARCH/,"Native Android plugin must perform SSDP discovery");
assert.match(nativeInstaller,/CHANGE_WIFI_MULTICAST_STATE/,"Android manifest must allow multicast discovery");
assert.match(nativeInstaller,/channelId="dev"/,"Native discovery must attempt Roku developer-mode sideloads when app listing omits them");
assert.match(nativeInstaller,/laptopUrl=/,"Native ECP launch must transfer the laptop address");
assert.match(nativeInstaller,/laptopToken=/,"Native ECP launch must transfer the laptop token");
assert.match(config,/com\.eleazarcompany\.sebasplay\.v19\.directroku20261128/,"v19 must use a new independent package ID");
assert.match(config,/SEBAS PLAY 19\.0/,"Android app must display version 19.0");
assert.doesNotMatch(viewer,/Vincular Roku/,"Old manual pairing-code entry must not be visible");
console.log("PASS: v19 Android SSDP/ECP discovery, laptop handoff, separate package, Mi laptop and profiles preserved.");
