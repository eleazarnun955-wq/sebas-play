import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { hashProfilePin, verifyProfilePin } from "./profile-security.mjs";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase server environment");
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const reply = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), { status, headers: cors });
const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
async function digest(value: string) {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}
function randomToken(bytes = 32) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const b of data) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function pairingCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}
async function userFromRequest(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  return error ? null : data.user;
}
async function deviceFromRequest(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token.length < 32) return null;
  const tokenHash = await digest(token);
  const { data, error } = await admin.from("paired_devices")
    .select("id,user_id,device_name")
    .eq("token_hash", tokenHash).is("revoked_at", null).maybeSingle();
  if (error || !data) return null;
  await admin.from("paired_devices").update({ last_seen_at: new Date().toISOString() }).eq("id", data.id);
  return data;
}
function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return reply(405, { error: "Método no permitido" });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? (req.method === "GET" ? "sync" : "");
  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return reply(400, { error: "JSON inválido" }); }
  }
  const requestedAction = typeof body.action === "string" ? body.action : action;


  if (requestedAction === "list-profiles") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Inicia sesión para consultar tus perfiles" });
    const { data, error } = await admin.from("family_profiles")
      .select("id,display_name,avatar_url,created_at,pin_hash")
      .eq("user_id", user.id).order("created_at", { ascending: true });
    if (error) return reply(500, { error: "No se pudieron consultar los perfiles" });
    return reply(200, { profiles: (data ?? []).map((item) => ({
      id: item.id, display_name: item.display_name, avatar_url: item.avatar_url,
      created_at: item.created_at, pin_enabled: Boolean(item.pin_hash),
    })) });
  }

  if (requestedAction === "create-profile") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Inicia sesión para crear un perfil" });
    const displayName = String(body.display_name ?? "").trim().slice(0, 40);
    if (displayName.length < 1) return reply(400, { error: "El nombre debe tener entre 1 y 40 caracteres" });
    let pinFields = { pin_hash: null, pin_salt: null, pin_iterations: null };
    if (body.pin !== undefined && body.pin !== null && body.pin !== "") {
      try { pinFields = await hashProfilePin(String(body.pin)); }
      catch (error) { return reply(400, { error: error instanceof Error ? error.message : "PIN inválido" }); }
    }
    const { data, error } = await admin.from("family_profiles").insert({
      user_id: user.id, display_name: displayName, ...pinFields,
    }).select("id,display_name,avatar_url,created_at").single();
    if (error || !data) return reply(500, { error: "No se pudo crear el perfil" });
    return reply(201, { profile: { ...data, pin_enabled: Boolean(pinFields.pin_hash) } });
  }

  if (requestedAction === "verify-profile-pin") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Sesión no válida" });
    if (!validUuid(body.profile_id)) return reply(400, { error: "Perfil inválido" });
    const { data: profile, error } = await admin.from("family_profiles")
      .select("id,pin_hash,pin_salt,pin_iterations,failed_attempts,locked_until")
      .eq("id", body.profile_id).eq("user_id", user.id).maybeSingle();
    if (error || !profile) return reply(404, { error: "No se encontró el perfil" });
    if (profile.locked_until && new Date(profile.locked_until).getTime() > Date.now()) {
      return reply(429, { error: "Perfil bloqueado temporalmente. Intenta más tarde.", locked_until: profile.locked_until });
    }
    if (!profile.pin_hash) return reply(200, { ok: true, unlocked: true });
    const valid = await verifyProfilePin(String(body.pin ?? ""), profile);
    if (!valid) {
      const attempts = Number(profile.failed_attempts ?? 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;
      await admin.from("family_profiles").update({
        failed_attempts: lockedUntil ? 0 : attempts, locked_until: lockedUntil,
      }).eq("id", profile.id).eq("user_id", user.id);
      return reply(401, { error: lockedUntil ? "Demasiados intentos. Perfil bloqueado durante 10 minutos." : "PIN incorrecto." });
    }
    await admin.from("family_profiles").update({ failed_attempts: 0, locked_until: null })
      .eq("id", profile.id).eq("user_id", user.id);
    return reply(200, { ok: true, unlocked: true });
  }

  if (requestedAction === "set-profile-pin") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Sesión no válida" });
    if (!validUuid(body.profile_id)) return reply(400, { error: "Perfil inválido" });
    let pinFields;
    try { pinFields = await hashProfilePin(String(body.pin ?? "")); }
    catch (error) { return reply(400, { error: error instanceof Error ? error.message : "PIN inválido" }); }
    const { data, error } = await admin.from("family_profiles").update({
      ...pinFields, failed_attempts: 0, locked_until: null,
    }).eq("id", body.profile_id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return reply(500, { error: "No se pudo actualizar el PIN" });
    return data ? reply(200, { ok: true }) : reply(404, { error: "No se encontró el perfil" });
  }

  if (requestedAction === "delete-profile") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Sesión no válida" });
    if (!validUuid(body.profile_id)) return reply(400, { error: "Perfil inválido" });
    const { data, error } = await admin.from("family_profiles").delete()
      .eq("id", body.profile_id).eq("user_id", user.id).select("id").maybeSingle();
    if (error) return reply(500, { error: "No se pudo eliminar el perfil" });
    return data ? reply(200, { ok: true }) : reply(404, { error: "No se encontró el perfil" });
  }

  if (requestedAction === "pair-device") {
    const code = String(body.code ?? "").replace(/\s+/g, "").toUpperCase();
    const deviceName = String(body.device_name ?? "Roku").trim().slice(0, 80);
    if (!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{12}$/.test(code) || !deviceName) return reply(400, { error: "Código o nombre de dispositivo inválido" });
    const codeHash = await digest(code);
    const { data: pending, error } = await admin.from("device_pairing_sessions")
      .select("id,user_id").eq("code_hash", codeHash).is("redeemed_at", null)
      .gt("expires_at", new Date().toISOString()).maybeSingle();
    if (error || !pending) return reply(400, { error: "Código vencido, incorrecto o ya utilizado" });
    const redeemedAt = new Date().toISOString();
    const { data: redeemed, error: redeemError } = await admin.from("device_pairing_sessions")
      .update({ redeemed_at: redeemedAt }).eq("id", pending.id).is("redeemed_at", null)
      .select("id").maybeSingle();
    if (redeemError || !redeemed) return reply(409, { error: "El código ya fue utilizado" });
    const deviceToken = randomToken();
    const { data: device, error: insertError } = await admin.from("paired_devices").insert({
      user_id: pending.user_id, device_name: deviceName, token_hash: await digest(deviceToken),
    }).select("id,device_name,created_at").single();
    if (insertError || !device) return reply(500, { error: "No se pudo vincular el dispositivo" });
    return reply(200, { ok: true, device, device_token: deviceToken });
  }

  if (requestedAction === "pair-code") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Inicia sesión en SEBAS PLAY para generar el código" });
    const code = pairingCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await admin.from("device_pairing_sessions").delete().eq("user_id", user.id).is("redeemed_at", null);
    const { error } = await admin.from("device_pairing_sessions").insert({
      user_id: user.id, code_hash: await digest(code), expires_at: expiresAt,
    });
    if (error) return reply(500, { error: "No se pudo generar el código de vinculación" });
    return reply(200, { ok: true, code, expires_at: expiresAt });
  }

  if (requestedAction === "devices") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Sesión no válida" });
    const { data, error } = await admin.from("paired_devices")
      .select("id,device_name,created_at,last_seen_at,revoked_at")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    return error ? reply(500, { error: "No se pudieron consultar los dispositivos" }) : reply(200, { devices: data ?? [] });
  }

  if (requestedAction === "revoke-device") {
    const user = await userFromRequest(req);
    if (!user) return reply(401, { error: "Sesión no válida" });
    if (!validUuid(body.device_id)) return reply(400, { error: "Dispositivo inválido" });
    const { data, error } = await admin.from("paired_devices")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", body.device_id).eq("user_id", user.id).is("revoked_at", null)
      .select("id").maybeSingle();
    if (error) return reply(500, { error: "No se pudo revocar el dispositivo" });
    return reply(200, { ok: true, revoked: Boolean(data) });
  }

  const device = await deviceFromRequest(req);
  if (!device) return reply(401, { error: "Dispositivo no vinculado o revocado" });
  if (requestedAction === "sync" && req.method === "GET") {
    const [favorites, progress] = await Promise.all([
      admin.from("favorites").select("content_type,content_id,created_at").eq("user_id", device.user_id),
      admin.from("watch_progress").select("content_type,content_id,position_seconds,duration_seconds,updated_at").eq("user_id", device.user_id).order("updated_at", { ascending: false }).limit(100),
    ]);
    if (favorites.error || progress.error) return reply(500, { error: "No se pudo sincronizar la biblioteca" });
    return reply(200, { favorites: favorites.data ?? [], watch_progress: progress.data ?? [] });
  }

  if (requestedAction === "favorite") {
    const type = String(body.content_type ?? "");
    if (!["movie", "series", "channel"].includes(type) || !validUuid(body.content_id) || !["add", "remove"].includes(String(body.operation))) {
      return reply(400, { error: "Favorito inválido" });
    }
    if (body.operation === "add") {
      const { error } = await admin.from("favorites").upsert({
        user_id: device.user_id, content_type: type, content_id: body.content_id,
      }, { onConflict: "user_id,content_type,content_id", ignoreDuplicates: true });
      if (error) return reply(500, { error: "No se pudo guardar el favorito" });
    } else {
      const { error } = await admin.from("favorites").delete().eq("user_id", device.user_id)
        .eq("content_type", type).eq("content_id", body.content_id);
      if (error) return reply(500, { error: "No se pudo quitar el favorito" });
    }
    return reply(200, { ok: true });
  }

  if (requestedAction === "progress") {
    if (!["movie", "episode"].includes(String(body.content_type)) || !validUuid(body.content_id) ||
      !Number.isSafeInteger(body.position_seconds) || Number(body.position_seconds) < 0 ||
      (body.duration_seconds !== null && body.duration_seconds !== undefined &&
       (!Number.isSafeInteger(body.duration_seconds) || Number(body.duration_seconds) <= 0))) {
      return reply(400, { error: "Progreso de reproducción inválido" });
    }
    const { error } = await admin.from("watch_progress").upsert({
      user_id: device.user_id, content_type: body.content_type, content_id: body.content_id,
      position_seconds: body.position_seconds, duration_seconds: body.duration_seconds ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,content_type,content_id" });
    if (error) return reply(500, { error: "No se pudo guardar el progreso" });
    return reply(200, { ok: true });
  }
  return reply(404, { error: "Acción no reconocida" });
});
