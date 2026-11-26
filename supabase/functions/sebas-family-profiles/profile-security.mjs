const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  try {
    const binary = atob(base64);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
  } catch {
    return null;
  }
}
function validPin(pin) {
  return typeof pin === "string" && /^\d{4,8}$/.test(pin);
}
async function derive(pin, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    HASH_BYTES * 8,
  );
  return new Uint8Array(bits);
}
export async function hashProfilePin(pin) {
  if (!validPin(pin)) throw new Error("El PIN debe contener entre 4 y 8 dígitos.");
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(pin, salt, ITERATIONS);
  return {
    pin_salt: toBase64Url(salt),
    pin_hash: toBase64Url(hash),
    pin_iterations: ITERATIONS,
  };
}
export async function verifyProfilePin(pin, record) {
  if (!validPin(pin) || !record || !Number.isInteger(record.pin_iterations) ||
      record.pin_iterations < 100_000 || record.pin_iterations > 1_000_000) return false;
  const salt = fromBase64Url(record.pin_salt);
  const expected = fromBase64Url(record.pin_hash);
  if (!salt || salt.length !== SALT_BYTES || !expected || expected.length !== HASH_BYTES) return false;
  const actual = await derive(pin, salt, record.pin_iterations);
  let difference = 0;
  for (let index = 0; index < HASH_BYTES; index++) difference |= actual[index] ^ expected[index];
  return difference === 0;
}
