# SEBAS PLAY Roku device sync

Deploy as `roku-device-sync` with JWT verification disabled only because this handler performs explicit Supabase Auth JWT validation for account actions and one-time code/device-token validation for Roku actions. The service-role key is read only from the Edge Function environment and is never returned to clients.

- Account action `pair-code`: POST with a signed-in user's Bearer JWT. Returns a 12-character one-time code valid for five minutes.
- Roku action `pair-device`: POST `{ action, code, device_name }`. Returns a revocable device token exactly once.
- `GET ?action=sync`: Bearer device token; returns only that token owner's favorites and watch progress.
- `POST { action: favorite, operation, content_type, content_id }`: updates the paired owner's favorites.
- `POST { action: progress, content_type, content_id, position_seconds, duration_seconds }`: updates paired owner's playback progress.
- Account actions `devices` and `revoke-device` list/revoke only the signed-in user's devices.

Pairing codes are stored as SHA-256 hashes, expire after five minutes, and are single-use. Device tokens are random, stored only as SHA-256 hashes, and can be revoked. The two backing tables have RLS enabled and no direct anon/authenticated grants; only the server function's service role can access them.
