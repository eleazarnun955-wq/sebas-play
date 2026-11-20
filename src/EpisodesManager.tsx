import { useEffect, useState } from "react";
import { Plus, Trash2, Film, Clapperboard } from "lucide-react";
import { supabase } from "./lib/supabase";

type Show = { id: string; title: string };
type Season = { id: string; series_id: string; season_number: number; title: string | null };
function isValidMediaUrl(value: string) {\n  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }\n}\n\ntype Episode = { id: string; season_id: string; episode_number: number; title: string; synopsis: string | null; duration_minutes: number | null; video_url: string | null; is_published: boolean };

export default function EpisodesManager() {
  const [shows, setShows] = useState<Show[]>([]);
  const [showId, setShowId] = useState("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonId] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [busy, setBusy] = useState(false);
  const [seasonNo, setSeasonNo] = useState("1");
  const [seasonTitle, setSeasonTitle] = useState("");
  const [episodeNo, setEpisodeNo] = useState("1");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeUrl, setEpisodeUrl] = useState("");
  const [episodeDuration, setEpisodeDuration] = useState("");
  const [message, setMessage] = useState("");

  async function loadShows() {
    if (!supabase) return;
    const { data } = await supabase.from("series").select("id,title").order("title");
    const list = (data ?? []) as Show[];
    setShows(list);
    if (!showId && list[0]) setShowId(list[0].id);
  }
  async function loadSeasons(id: string) {
    if (!supabase || !id) { setSeasons([]); setSeasonId(""); return; }
    const { data, error } = await supabase.from("seasons").select("id,series_id,season_number,title").eq("series_id", id).order("season_number");
    if (error) { setMessage(error.message); return; }
    const list = (data ?? []) as Season[];
    setSeasons(list);
    setSeasonId((current) => list.some((s) => s.id === current) ? current : list[0]?.id ?? "");
  }
  async function loadEpisodes(id: string) {
    if (!supabase || !id) { setEpisodes([]); return; }
    const { data, error } = await supabase.from("episodes").select("id,season_id,episode_number,title,synopsis,duration_minutes,video_url,is_published").eq("season_id", id).order("episode_number");
    if (error) { setMessage(error.message); return; }
    setEpisodes((data ?? []) as Episode[]);
  }
  useEffect(() => { void loadShows(); }, []);
  useEffect(() => { void loadSeasons(showId); }, [showId]);
  useEffect(() => { void loadEpisodes(seasonId); }, [seasonId]);

  async function addSeason(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !showId) return; setBusy(true);
    const { error } = await supabase.from("seasons").insert({ series_id: showId, season_number: Number(seasonNo), title: seasonTitle.trim() || null });
    setBusy(false); setMessage(error ? error.message : "Temporada creada.");
    if (!error) { setSeasonTitle(""); await loadSeasons(showId); }
  }
  async function addEpisode(e: React.FormEvent) {
    e.preventDefault(); if (!supabase || !seasonId) return; setBusy(true);
    const { error } = await supabase.from("episodes").insert({ season_id: seasonId, episode_number: Number(episodeNo), title: episodeTitle.trim(), video_url: episodeUrl.trim() || null, duration_minutes: episodeDuration ? Number(episodeDuration) : null, is_published: false });
    setBusy(false); setMessage(error ? error.message : "Episodio guardado como borrador.");
    if (!error) { setEpisodeTitle(""); setEpisodeUrl(""); setEpisodeDuration(""); await loadEpisodes(seasonId); }
  }
  async function toggleEpisode(ep: Episode) {
    if (!supabase) return;
    const { error } = await supabase.from("episodes").update({ is_published: !ep.is_published }).eq("id", ep.id);
    setMessage(error ? error.message : (ep.is_published ? "Episodio retirado." : "Episodio publicado."));
    if (!error) await loadEpisodes(seasonId);
  }
  async function removeEpisode(id: string) {
    if (!supabase || !window.confirm("¿Eliminar este episodio?")) return;
    const { error } = await supabase.from("episodes").delete().eq("id", id);
    setMessage(error ? error.message : "Episodio eliminado.");
    if (!error) await loadEpisodes(seasonId);
  }
  async function removeSeason(id: string) {
    if (!supabase || !window.confirm("¿Eliminar esta temporada y sus episodios?")) return;
    const { error } = await supabase.from("seasons").delete().eq("id", id);
    setMessage(error ? error.message : "Temporada eliminada.");
    if (!error) await loadSeasons(showId);
  }

  return <section className="content">
    <div className="section-heading"><h3>Temporadas y episodios</h3><p>Organiza cada serie por temporadas y administra sus capítulos. Todo episodio nuevo queda como borrador.</p></div>
    <div className="table-card" style={{ padding: 18, marginBottom: 18 }}>
      <label className="field-label">Selecciona una serie<select value={showId} onChange={e => setShowId(e.target.value)}><option value="">Seleccionar serie…</option>{shows.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
      {shows.length === 0 && <p className="muted">Primero agrega una serie en la sección Series.</p>}
      <form className="form-row" onSubmit={addSeason} style={{ marginTop: 16, alignItems: "end" }}>
        <label className="field-label">Número de temporada<input type="number" min="1" required value={seasonNo} onChange={e => setSeasonNo(e.target.value)} /></label>
        <label className="field-label">Nombre (opcional)<input value={seasonTitle} onChange={e => setSeasonTitle(e.target.value)} placeholder="Temporada especial" /></label>
        <button className="primary-btn" disabled={busy || !showId}><Plus size={16}/> Crear temporada</button>
      </form>
    </div>
    <div className="table-card" style={{ padding: 18, marginBottom: 18 }}>
      <label className="field-label">Temporada<select value={seasonId} onChange={e => setSeasonId(e.target.value)}><option value="">Seleccionar temporada…</option>{seasons.map(s => <option key={s.id} value={s.id}>Temporada {s.season_number}{s.title ? " · " + s.title : ""}</option>)}</select></label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>{seasons.map(s => <button type="button" key={s.id} className="secondary-btn" onClick={() => setSeasonId(s.id)}>T{s.season_number} <span onClick={e => { e.stopPropagation(); void removeSeason(s.id); }}><Trash2 size={13}/></span></button>)}</div>
      <form onSubmit={addEpisode} className="modal-form" style={{ padding: "18px 0 0" }}>
        <div className="form-row"><label className="field-label">Número de episodio<input type="number" min="1" required value={episodeNo} onChange={e => setEpisodeNo(e.target.value)} /></label><label className="field-label">Duración (minutos)<input type="number" min="1" value={episodeDuration} onChange={e => setEpisodeDuration(e.target.value)} /></label></div>
        <label className="field-label">Título del episodio<input required value={episodeTitle} onChange={e => setEpisodeTitle(e.target.value)} placeholder="Nombre del capítulo" /></label>
        <label className="field-label">URL del video autorizado<input type="url" value={episodeUrl} onChange={e => setEpisodeUrl(e.target.value)} placeholder="https://…" /></label>
        <button className="primary-btn" disabled={busy || !seasonId}><Plus size={16}/> Guardar episodio como borrador</button>
      </form>
    </div>
    <div className="table-card"><div className="table-title"><h3><Clapperboard size={17} style={{ display: "inline", verticalAlign: "middle" }}/> Episodios</h3><span>{episodes.length} capítulos</span></div>
      {episodes.length === 0 ? <div className="empty-state"><Film size={18}/> Selecciona una temporada o agrega su primer episodio.</div> : <div className="table-wrap"><table><thead><tr><th>#</th><th>Episodio</th><th>Duración</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{episodes.map(ep => <tr key={ep.id}><td>{ep.episode_number}</td><td><b>{ep.title}</b></td><td>{ep.duration_minutes ? ep.duration_minutes + " min" : "—"}</td><td><span className={ep.is_published ? "badge published" : "badge draft"}>{ep.is_published ? "Publicado" : "Borrador"}</span></td><td><div className="row-actions"><button className="text-action" onClick={() => void toggleEpisode(ep)}>{ep.is_published ? "Retirar" : "Publicar"}</button><button className="delete-action" onClick={() => void removeEpisode(ep.id)}>Eliminar</button></div></td></tr>)}</tbody></table></div>}
    </div>
    {message && <p className="muted" role="status" style={{ marginTop: 12 }}>{message}</p>}
  </section>;
}
