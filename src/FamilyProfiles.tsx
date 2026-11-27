import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Users, LoaderCircle, RefreshCw } from "lucide-react";
import { supabase } from "./lib/supabase";

type FamilyProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_primary: boolean;
  created_at: string;
};

export default function FamilyProfiles() {
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  async function loadProfiles() {
    if (!supabase) { setError("El servicio de perfiles no está configurado."); setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.rpc("list_my_family_profiles");
    if (error) setError("No se pudieron cargar los perfiles: " + error.message);
    else setProfiles((data ?? []) as FamilyProfile[]);
    setLoading(false);
  }

  useEffect(() => { void loadProfiles(); }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase || saving) return;
    const clean = name.trim();
    if (!clean || clean.length > 40) { setError("Escribe un nombre de 1 a 40 caracteres."); return; }
    setSaving(true);
    setError("");
    const result = editing
      ? await supabase.rpc("rename_my_family_profile", { p_profile_id: editing, p_display_name: clean })
      : await supabase.rpc("create_my_family_profile", { p_display_name: clean, p_avatar_url: null });
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    setName("");
    setEditing(null);
    await loadProfiles();
  }

  async function removeProfile(profile: FamilyProfile) {
    if (!supabase || profile.is_primary || saving) return;
    if (!window.confirm("¿Eliminar el perfil " + profile.display_name + "? Sus favoritos e historial asociados también dejarán de estar disponibles.")) return;
    setSaving(true);
    const { error } = await supabase.rpc("delete_my_family_profile", { p_profile_id: profile.id });
    setSaving(false);
    if (error) { setError(error.message); return; }
    await loadProfiles();
  }

  return <section className="family-profiles">
    <div className="family-profiles-head">
      <div><span className="viewer-kicker">SEBAS PLAY</span><h2><Users size={21}/> Perfiles de la cuenta</h2><p>Cada perfil puede tener su propio nombre y espacio familiar.</p></div>
      <button type="button" className="viewer-close" onClick={() => void loadProfiles()} aria-label="Actualizar perfiles"><RefreshCw size={17}/></button>
    </div>
    {error && <p className="viewer-auth-error" role="alert">{error}</p>}
    {loading ? <div className="viewer-loading"><LoaderCircle size={22}/> Cargando perfiles…</div> : <div className="family-profile-list">
      {profiles.map(profile => <article className="family-profile-item" key={profile.id}>
        <div className="family-profile-avatar">{profile.display_name.slice(0,1).toLocaleUpperCase("es-MX")}</div>
        <div className="family-profile-info"><b>{profile.display_name}</b><small>{profile.is_primary ? "Cuenta principal · protegida" : "Perfil familiar"}</small></div>
        {!profile.is_primary && <div className="family-profile-actions">
          <button type="button" aria-label={"Editar " + profile.display_name} onClick={() => { setEditing(profile.id); setName(profile.display_name); setError(""); }}><Pencil size={16}/></button>
          <button type="button" aria-label={"Eliminar " + profile.display_name} onClick={() => void removeProfile(profile)}><Trash2 size={16}/></button>
        </div>}
      </article>)}
      {profiles.length === 0 && <div className="viewer-empty">Todavía no hay perfiles. Crea el primero para tu familia.</div>}
    </div>}
    <form className="family-profile-form" onSubmit={saveProfile}>
      <label>{editing ? "Cambiar nombre del perfil" : "Crear perfil familiar"}
        <input value={name} onChange={event => setName(event.target.value)} maxLength={40} placeholder="Ej. Mamá, Papá, Niños" required/>
      </label>
      <div className="family-profile-form-actions">
        {editing && <button type="button" className="viewer-feature-more" onClick={() => { setEditing(null); setName(""); }}>Cancelar</button>}
        <button type="submit" className="viewer-play" disabled={saving || loading}>{saving ? "Guardando…" : editing ? "Guardar cambios" : <><Plus size={17}/> Crear perfil</>}</button>
      </div>
    </form>
    <p className="family-profile-note">La cuenta principal no se puede eliminar ni renombrar. Puedes crear hasta 5 perfiles adicionales.</p>
  </section>;
}
