import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Plus, RefreshCw, Trash2, Radio, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./epg-manager.css";

type Channel = { id: string; name: string };
type Program = { id: string; channel_id: string; title: string; description: string | null; starts_at: string; ends_at: string; is_published: boolean; source_name: string | null };

function localDate(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
function displayTime(value: string) {
  return new Date(value).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function EpgManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [channelId, setChannelId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(localDate(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState(localDate(new Date(Date.now() + 60 * 60 * 1000).toISOString()));
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const [channelResult, programResult] = await Promise.all([
      supabase.from("live_channels").select("id,name").order("name"),
      supabase.from("epg_programs").select("id,channel_id,title,description,starts_at,ends_at,is_published,source_name").order("starts_at", { ascending: true }).limit(300),
    ]);
    const error = channelResult.error || programResult.error;
    if (error) setNotice({ kind: "error", text: error.message });
    const nextChannels = (channelResult.data || []) as Channel[];
    setChannels(nextChannels);
    setPrograms((programResult.data || []) as Program[]);
    if (!channelId && nextChannels[0]) setChannelId(nextChannels[0].id);
    setLoading(false);
  }, [channelId]);

  useEffect(() => { void load(); }, [load]);

  async function addProgram(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !channelId || !title.trim()) return;
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setNotice({ kind: "error", text: "La hora de finalización debe ser posterior al inicio." }); return;
    }
    setSaving(true); setNotice(null);
    const { error } = await supabase.from("epg_programs").insert({
      channel_id: channelId, title: title.trim(), description: description.trim() || null,
      starts_at: start.toISOString(), ends_at: end.toISOString(),
      source_name: sourceName.trim() || null, is_published: false,
      rights_note: sourceName.trim() ? "Programación proporcionada por: " + sourceName.trim() : null,
    });
    setSaving(false);
    if (error) { setNotice({ kind: "error", text: error.message }); return; }
    setTitle(""); setDescription(""); setSourceName("");
    setNotice({ kind: "ok", text: "Programa guardado como borrador. Revísalo antes de publicarlo." });
    await load();
  }

  async function togglePublished(program: Program) {
    if (!supabase) return;
    const { error } = await supabase.from("epg_programs").update({ is_published: !program.is_published, updated_at: new Date().toISOString() }).eq("id", program.id);
    if (error) setNotice({ kind: "error", text: error.message });
    else { setNotice({ kind: "ok", text: program.is_published ? "Programa retirado de la guía." : "Programa publicado en la guía." }); await load(); }
  }

  async function remove(program: Program) {
    if (!supabase || !window.confirm("¿Eliminar el programa " + program.title + "?")) return;
    const { error } = await supabase.from("epg_programs").delete().eq("id", program.id);
    if (error) setNotice({ kind: "error", text: error.message });
    else { setNotice({ kind: "ok", text: "Programa eliminado." }); await load(); }
  }

  const channelName = (id: string) => channels.find(channel => channel.id === id)?.name || "Canal";
  return <section className="epg-manager">
    <div className="epg-intro"><CalendarClock size={25} /><div><h3>Guía electrónica de programación</h3><p>Organiza la programación por canal, fecha y horario. Los registros nuevos quedan privados hasta que los publiques.</p></div></div>
    <form className="epg-form" onSubmit={addProgram}>
      <label>Canal<select value={channelId} onChange={event => setChannelId(event.target.value)} required><option value="">Selecciona un canal</option>{channels.map(channel => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
      <label>Nombre del programa<input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="Noticiero, película, deportes…" required /></label>
      <label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="Sinopsis o detalles del programa" /></label>
      <div className="epg-time-grid"><label>Inicio<input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} required /></label><label>Fin<input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} required /></label></div>
      <label>Fuente de la programación (opcional)<input value={sourceName} onChange={event => setSourceName(event.target.value)} placeholder="Proveedor autorizado / guía oficial" /></label>
      <button className="primary-btn" type="submit" disabled={saving || !channels.length || !title.trim()}><Plus size={16} /> {saving ? "Guardando…" : "Agregar programa"}</button>
      {!channels.length && <small>Primero agrega canales de televisión al catálogo.</small>}
    </form>
    {notice && <div className={"epg-notice " + notice.kind}>{notice.text}</div>}
    <div className="epg-list-head"><b>Programación registrada</b><button className="secondary-btn" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Actualizar</button></div>
    {loading ? <p className="epg-empty">Cargando guía…</p> : programs.length === 0 ? <p className="epg-empty">Todavía no hay programas registrados.</p> : programs.map(program => <article className="epg-program" key={program.id}>
      <div className="epg-channel-icon"><Radio size={18} /></div><div className="epg-program-copy"><b>{program.title}</b><span>{channelName(program.channel_id)} · {displayTime(program.starts_at)} – {new Date(program.ends_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>{program.description && <small>{program.description}</small>}</div>
      <button className={program.is_published ? "epg-published" : "secondary-btn"} onClick={() => void togglePublished(program)} disabled={saving}>{program.is_published ? "Publicado" : "Publicar"}</button>
      <button className="epg-delete" title="Eliminar programa" onClick={() => void remove(program)} disabled={saving}><Trash2 size={16} /></button>
    </article>)}
    <div className="epg-note"><CheckCircle2 size={16} /><span>La guía utiliza horarios locales convertidos a UTC para guardarse correctamente. Solo publica horarios que tengas derecho a distribuir.</span></div>
  </section>;
}
