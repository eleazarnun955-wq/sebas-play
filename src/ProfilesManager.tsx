import { useCallback, useEffect, useRef, useState } from "react";
import { Users, Plus, ShieldCheck, Trash2, RefreshCw, LockKeyhole } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./profiles-manager.css";

type FamilyProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  pin_enabled: boolean;
};

export default function ProfilesManager() {
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const loadSequence = useRef(0);
  const mounted = useRef(true);

  // Never leave the profile screen waiting forever if the Edge Function stalls.
  const call = useCallback(async (body: Record<string, unknown>) => {
    if (!supabase) throw new Error("Supabase no está configurado.");
    let timeoutId: number | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error("El servidor de perfiles tardó más de 15 segundos. La pantalla se liberó; puedes volver a intentarlo.")), 15000);
      });
      const request = supabase.functions.invoke("sebas-family-profiles", { body });
      const { data, error } = await Promise.race([request, timeout]);
      if (error) throw new Error(error.message || "No se pudo conectar con el servicio de perfiles.");
      if (data?.error) throw new Error(String(data.error));
      if (!data) throw new Error("El servidor de perfiles respondió vacío. Inténtalo de nuevo.");
      return data;
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    }
  }, []);

  const load = useCallback(async () => {
    const request = ++loadSequence.current;
    if (mounted.current) setLoading(true);
    try {
      const data = await call({ action: "list-profiles" });
      if (!mounted.current || request !== loadSequence.current) return;
      setProfiles(Array.isArray(data.profiles) ? data.profiles as FamilyProfile[] : []);
    } catch (error) {
      if (mounted.current && request === loadSequence.current) {
        setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudieron cargar los perfiles." });
      }
    } finally {
      if (mounted.current && request === loadSequence.current) setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      loadSequence.current++;
    };
  }, [load]);

  async function createProfile(event: React.FormEvent) {
    event.preventDefault();
    const displayName = name.trim();
    if (!displayName || saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const data = await call({ action: "create-profile", display_name: displayName, ...(pin ? { pin } : {}) });
      setName("");
      setPin("");
      if (data.profile?.id) {
        const created = data.profile as FamilyProfile;
        setProfiles(current => current.some(item => item.id === created.id) ? current : [...current, created]);
      }
      setNotice({ kind: "ok", text: "Perfil creado correctamente." });
      // Refresh in the background; creation success is not held hostage by list refresh.
      void load();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo crear el perfil." });
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  async function changePin(profile: FamilyProfile) {
    const nextPin = pinDrafts[profile.id] || "";
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      await call({ action: "set-profile-pin", profile_id: profile.id, pin: nextPin });
      setPinDrafts(current => ({ ...current, [profile.id]: "" }));
      setProfiles(current => current.map(item => item.id === profile.id ? { ...item, pin_enabled: true } : item));
      setNotice({ kind: "ok", text: "PIN actualizado para " + profile.display_name + "." });
      void load();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo actualizar el PIN." });
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  async function removeProfile(profile: FamilyProfile) {
    if (!window.confirm("¿Eliminar el perfil " + profile.display_name + "? Esta acción no se puede deshacer.")) return;
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      await call({ action: "delete-profile", profile_id: profile.id });
      setProfiles(current => current.filter(item => item.id !== profile.id));
      setNotice({ kind: "ok", text: "Perfil eliminado." });
      void load();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el perfil." });
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  return <section className="profiles-manager">
    <div className="profiles-intro"><div className="profiles-intro-icon"><Users size={24} /></div><div><h3>Perfiles familiares</h3><p>Crea perfiles separados y protege cada uno con un PIN de 4 a 8 dígitos.</p></div></div>
    <form className="profiles-create" onSubmit={createProfile}>
      <label>Nombre del perfil<input value={name} onChange={event => setName(event.target.value)} maxLength={40} placeholder="Ej. Sala, Niños, Adultos" required /></label>
      <label>PIN opcional<input type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="4 a 8 dígitos" /></label>
      <button className="primary-btn" type="submit" disabled={saving || !name.trim()}><Plus size={16} /> {saving ? "Guardando…" : "Crear perfil"}</button>
    </form>
    {notice && <div className={"profiles-notice " + notice.kind}>{notice.text}</div>}
    <div className="profiles-heading"><b>Perfiles registrados</b><button className="secondary-btn" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Actualizar</button></div>
    {loading ? <p className="profiles-empty">Cargando perfiles…</p> : profiles.length === 0 ? <p className="profiles-empty">Todavía no hay perfiles familiares. Crea el primero arriba.</p> :
      profiles.map(profile => <article className="profile-card" key={profile.id}>
        <div className="profile-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : <Users size={20} />}</div>
        <div className="profile-main"><b>{profile.display_name}</b><small>{profile.pin_enabled ? "PIN activo" : "Sin PIN"} · Creado {new Date(profile.created_at).toLocaleDateString("es-MX")}</small>
          <div className="profile-pin-tools"><input type="password" inputMode="numeric" pattern="[0-9]{4,8}" maxLength={8} value={pinDrafts[profile.id] || ""} onChange={event => setPinDrafts(current => ({ ...current, [profile.id]: event.target.value.replace(/\D/g, "").slice(0, 8) }))} placeholder="Nuevo PIN (4–8 dígitos)" /><button className="secondary-btn" type="button" onClick={() => void changePin(profile)} disabled={saving || (pinDrafts[profile.id] || "").length < 4}><LockKeyhole size={14} /> Guardar PIN</button></div>
        </div>
        <button className="profile-delete" type="button" title="Eliminar perfil" onClick={() => void removeProfile(profile)} disabled={saving}><Trash2 size={17} /></button>
      </article>)}
    <div className="profiles-security"><ShieldCheck size={17} /><span>Los PIN se guardan como hashes seguros en el servidor. Después de cinco intentos incorrectos, el perfil se bloquea temporalmente durante diez minutos.</span></div>
  </section>;
}
