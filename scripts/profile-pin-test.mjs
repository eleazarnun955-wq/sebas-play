import assert from "node:assert/strict";
import { hashProfilePin, verifyProfilePin } from "../supabase/functions/roku-device-sync/profile-security.mjs";

const first = await hashProfilePin("4826");
const second = await hashProfilePin("4826");
assert.equal(first.pin_iterations, 310000);
assert.notEqual(first.pin_salt, second.pin_salt, "each profile PIN must use a fresh random salt");
assert.notEqual(first.pin_hash, second.pin_hash, "salted PIN hashes must differ");
assert.equal(await verifyProfilePin("4826", first), true);
assert.equal(await verifyProfilePin("4827", first), false);
assert.equal(await verifyProfilePin("4826", second), true);
assert.equal(await verifyProfilePin("123", first), false);
assert.equal(await verifyProfilePin("123456789", first), false);
assert.equal(await verifyProfilePin("4826", { ...first, pin_iterations: 1 }), false);
assert.equal(await verifyProfilePin("4826", { ...first, pin_hash: "invalid" }), false);
await assert.rejects(() => hashProfilePin("12ab"), /4 y 8 dígitos/);
await assert.rejects(() => hashProfilePin("123"), /4 y 8 dígitos/);
console.log("Family profile PIN security tests passed.");
