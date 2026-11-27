import { useEffect, useMemo, useState } from "react";
import { HardDrive, RefreshCw, Film, CheckCircle2, AlertCircle, Server, ShieldCheck } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./windows-media.css";

type MediaItem = {
  id: string;
  title: string;
  file: string;
  size_bytes: number;
  mime_type: string;
  media_type?: "movie" | "episode";
  series_title?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  year?: number | null;
  stream_url: string;
};

function normalizeServerBase(value: string) {
  // Remove punctuation accidentally copied after the port (for example :8787.)
  const cleaned = value.trim().replace(/[.,;]+$/, "").replace(/\/+$/, "");
  const parsed = new URL(cleaned);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("La dirección debe comenzar con http:// o https://.");
  }
  if (!parsed.hostname) throw new Error("Escribe una dirección válida para la laptop.");
  if (parsed.search || parsed.hash) {
    throw new Error("La dirección del servidor no debe incluir parámetros ni fragmentos.");
  }
  return parsed.toString().replace(/\/$/, "");
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes, index = 0;
  while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
  return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
}

export default function WindowsMediaManager() {
  const [serverUrl, setServerUrl] = useState("");
  const [token, setToken] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [scanCounts, setScanCounts] = useState({ movies: 0, episodes: 0, series: 0, seasons: 0 });
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

  const seriesGroups = useMemo(() => {
    const groups = new Map<string, MediaItem[]>();
    for (const item of items) {
      if (item.media_type !== "episode" || !item.series_title) continue;
      const key = item.series_title.trim().toLocaleLowerCase("es");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return [...groups.entries()].map(([key, episodes]) => ({
      key,
      title: episodes[0].series_title || episodes[0].title,
      episodes: episodes.sort((a, b) => (a.season_number || 0) - (b.season_number || 0) || (a.episode_number || 0) - (b.episode_number || 0)),
      seasons: new Set(episodes.map(item => item.season_number)).size,
    })).sort((a, b) => a.title.localeCompare(b.title, "es"));
  }, [items]);

  useEffect(() => {
    if (!connected || !serverUrl.trim() || !token.trim()) return;
    let active = true;
    const refresh = async () => {
      try {
        const base = normalizeServerBase(serverUrl);
        const response = await fetch(base + "/api/catalog", { headers: { Authorization: "Bearer " + token.trim() } });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Error HTTP " + response.status);
        if (!active) return;
        setItems((payload.items || []) as MediaItem[]);
        setScanCounts(payload.counts || { movies: payload.count || 0, episodes: 0, series: 0, seasons: 0 });
      } catch {
        if (active) {
          setConnected(false);
          setMessage({ kind: "error", text: "Se perdió la conexión automática con la laptop. Comprueba que el servidor siga encendido y vuelve a conectar." });
        }
      }
    };
    const timer = window.setInterval(() => void refresh(), 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, [connected, serverUrl, token]);

  async function connect() {
    const base = normalizeServerBase(serverUrl);
    if (!/^https?:\/\//i.test(base) || !token.trim()) {
      setMessage({ kind: "error", text: "Escribe la dirección del servidor y el token de administración." });
      return;
    }
    setLoading(true); setMessage(null);
    try {
      const response = await fetch(`${base}/api/catalog`, { headers: { Authorization: `Bearer ${token.trim()}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Error HTTP ${response.status}`);
      setItems((payload.items || []) as MediaItem[]);
      setScanCounts(payload.counts || { movies: payload.count || 0, episodes: 0, series: 0, seasons: 0 });
      setConnected(true);
      setMessage({ kind: "ok", text: `Conectado. Se encontraron ${payload.count || 0} videos compatibles.` });
    } catch (error) {
      setConnected(false);
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo conectar con la laptop." });
    } finally { setLoading(false); }
  }

  async function uploadFile(file: File) {
    if (!connected || !serverUrl.trim() || !token.trim()) {
      setMessage({ kind: "error", text: "Conecta primero la laptop para poder subir videos." });
      return;
    }
    if (file.size > 20 * 1024 * 1024 * 1024) {
      setMessage({ kind: "error", text: "El límite configurado para subir un archivo es 20 GiB." });
      return;
    }
    setUploading(true); setMessage(null);
    try {
    const base = normalizeServerBase(serverUrl);
      const response = await fetch(`${base}/api/upload?name=${encodeURIComponent(file.name)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      const catalogResponse = await fetch(`${base}/api/catalog`, { headers: { Authorization: `Bearer ${token.trim()}` } });
      const catalog = await catalogResponse.json();
      if (!catalogResponse.ok) throw new Error(catalog.error || "No se pudo actualizar el catálogo del servidor.");
      const nextItems = (catalog.items || []) as MediaItem[];
      setItems(nextItems);
      setScanCounts(catalog.counts || { movies: catalog.count || 0, episodes: 0, series: 0, seasons: 0 });
      const uploaded = nextItems.find(item => item.file === result.file);
      if (uploaded) await importMovie(uploaded);
      else setMessage({ kind: "ok", text: `${file.name} se guardó en la laptop. Actualiza la biblioteca para agregarlo al catálogo.` });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo subir el video a la laptop." });
    } finally { setUploading(false); }
  }

  async function importMovie(item: MediaItem) {
    if (!supabase) { setMessage({ kind: "error", text: "El catálogo Supabase no está configurado." }); return; }
    setImporting(item.id); setMessage(null);
    const rightsNote = `Servidor Windows SEBAS PLAY; archivo: ${item.file}; revisar derechos antes de publicar.`;
    const { data: existing, error: lookupError } = await supabase.from("movies").select("id").eq("rights_note", rightsNote).maybeSingle();
    if (lookupError) {
      setMessage({ kind: "error", text: lookupError.message }); setImporting(""); return;
    }
    const record = {
      title: item.title,
      video_url: item.stream_url,
      source_type: "owned_upload",
      rights_note: rightsNote,
      is_published: false,
    };
    const result = existing
      ? await supabase.from("movies").update({ video_url: item.stream_url }).eq("id", existing.id)
      : await supabase.from("movies").insert(record);
    setImporting("");
    if (result.error) { setMessage({ kind: "error", text: result.error.message }); return; }
    setMessage({ kind: "ok", text: existing ? `Enlace renovado para “${item.title}”.` : `“${item.title}” se agregó como borrador al catálogo compartido.` });
  }

  async function importSeries(title: string, episodes: MediaItem[]) {
    if (!supabase) { setMessage({ kind: "error", text: "El catálogo Supabase no está configurado." }); return; }
    const operationId = "series:" + title;
    setImporting(operationId); setMessage(null);
    try {
      const rightsNote = "Servidor Windows SEBAS PLAY; serie detectada: " + title + "; revisar derechos antes de publicar.";
      const { data: foundSeries, error: seriesLookupError } = await supabase
        .from("series").select("id").eq("rights_note", rightsNote).maybeSingle();
      if (seriesLookupError) throw seriesLookupError;

      let seriesId = foundSeries?.id as string | undefined;
      if (!seriesId) {
        const { data: created, error: createError } = await supabase.from("series").insert({
          title, source_type: "owned_upload", rights_note: rightsNote, is_published: false,
        }).select("id").single();
        if (createError) throw createError;
        seriesId = created.id;
      }

      const seasons = [...new Set(episodes.map(item => item.season_number).filter((value): value is number => Number.isInteger(value) && Number(value) > 0))].sort((a, b) => a - b);
      let importedEpisodes = 0;
      for (const seasonNumber of seasons) {
        const { data: foundSeason, error: seasonLookupError } = await supabase.from("seasons")
          .select("id").eq("series_id", seriesId).eq("season_number", seasonNumber).maybeSingle();
        if (seasonLookupError) throw seasonLookupError;
        let seasonId = foundSeason?.id as string | undefined;
        if (!seasonId) {
          const { data: createdSeason, error: createSeasonError } = await supabase.from("seasons")
            .insert({ series_id: seriesId, season_number: seasonNumber, title: "Temporada " + seasonNumber })
            .select("id").single();
          if (createSeasonError) throw createSeasonError;
          seasonId = createdSeason.id;
        }

        const seasonEpisodes = episodes.filter(item => item.season_number === seasonNumber && Number(item.episode_number) > 0);
        const { data: existingEpisodes, error: episodeLookupError } = await supabase.from("episodes")
          .select("episode_number,is_published").eq("season_id", seasonId);
        if (episodeLookupError) throw episodeLookupError;
        const publishedByNumber = new Map((existingEpisodes || []).map(row => [row.episode_number, row.is_published]));
        const records = seasonEpisodes.map(item => ({
          season_id: seasonId,
          episode_number: item.episode_number!,
          title: item.title,
          video_url: item.stream_url,
          is_published: publishedByNumber.get(item.episode_number!) ?? false,
        }));
        if (records.length) {
          const { error: saveEpisodesError } = await supabase.from("episodes")
            .upsert(records, { onConflict: "season_id,episode_number" });
          if (saveEpisodesError) throw saveEpisodesError;
          importedEpisodes += records.length;
        }
      }
      setMessage({ kind: "ok", text: "Serie " + title + " sincronizada: " + seasons.length + " temporadas y " + importedEpisodes + " episodios. Se conservan los estados de publicación existentes." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo importar la serie completa." });
    } finally {
      setImporting("");
    }
  }

  return (
    <section className="windows-media">
      <div className="windows-media-hero">
        <div className="windows-media-icon"><Server size={27} /></div>
        <div><span className="wm-eyebrow">BIBLIOTECA PRINCIPAL</span><h2>Servidor Windows 10</h2><p>Conecta la laptop y envía sus películas al catálogo que comparten Android y Roku.</p></div>
      </div>
      <div className="wm-security"><ShieldCheck size={18} /><span>El token solo se usa desde este panel de administrador. Los videos se transmiten desde la laptop; no se copian a Supabase Storage.</span></div>
      <div className="wm-connect-card">
        <label>Dirección HTTPS pública o dirección local del servidor</label>
        <input value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="http://192.168.1.15:8787" autoComplete="url" />
        <small>En casa, escribe la dirección LAN que muestra la laptop y conecta ambos dispositivos al mismo Wi-Fi. Para fuera de casa se requiere una dirección HTTPS estable.</small>
        <label>Token de administración de la laptop</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Token de SEBAS-PLAY-ACCESS-TOKEN.txt" autoComplete="off" />
        <button className="primary-btn" onClick={() => void connect()} disabled={loading}>
          {loading ? <RefreshCw size={16} className="spin" /> : <Server size={16} />} {loading ? "Conectando…" : connected ? "Actualizar biblioteca" : "Conectar con laptop"}
        </button>
        <div className="wm-upload-card">
          <label>Subir película desde este dispositivo</label>
          <input type="file" accept=".mp4,.m4v,.mov,.webm,video/mp4,video/x-m4v,video/quicktime,video/webm" disabled={!connected || uploading} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadFile(file); event.currentTarget.value = ""; }} />
          <small>{uploading ? "Subiendo video a la laptop…" : "El archivo se guarda directamente en la carpeta Peliculas de Windows y se agrega como borrador al catálogo."}</small>
        </div>
      </div>
      {message && <div className={`wm-message ${message.kind}`}>{message.kind === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{message.text}</div>}
      <div className="wm-list-head"><div><h3><HardDrive size={18} /> Videos encontrados</h3><p>{items.length} archivos · {scanCounts.movies} películas · {scanCounts.series} series · {scanCounts.seasons} temporadas · {scanCounts.episodes} episodios</p></div><button className="secondary-btn" onClick={() => void connect()} disabled={loading || !connected}><RefreshCw size={15} /> Actualizar</button></div>
      {seriesGroups.length > 0 && <div className="wm-series-groups">
        <div className="wm-list-head"><div><h3><Film size={18} /> Series detectadas en la laptop</h3><p>{seriesGroups.length} series · agrupadas automáticamente por temporada y episodio</p></div></div>
        {seriesGroups.map(group => <div className="wm-item" key={group.key}>
          <div className="wm-film"><Film size={19} /></div>
          <div className="wm-item-copy"><b>{group.title}</b><span>{group.seasons} temporadas · {group.episodes.length} episodios</span><small>{group.episodes.slice(0, 3).map(item => "T" + item.season_number + "E" + item.episode_number).join(" · ")}{group.episodes.length > 3 ? " · …" : ""}</small></div>
          <button className="primary-btn" onClick={() => void importSeries(group.title, group.episodes)} disabled={Boolean(importing)}>
            {importing === "series:" + group.title ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}
            {importing === "series:" + group.title ? "Importando…" : "Importar serie completa"}
          </button>
        </div>)}
      </div>}
      {items.length === 0 ? <div className="wm-empty"><Film size={30} /><b>Tu biblioteca aparecerá aquí</b><span>Conecta la laptop para consultar sus archivos MP4, M4V, MOV y WebM.</span></div> :
        <div className="wm-items">{items.map(item => <div className="wm-item" key={item.id}><div className="wm-film"><Film size={19} /></div><div className="wm-item-copy"><b>{item.title}</b><span>{item.file}</span><small>{formatBytes(item.size_bytes)} · {item.mime_type} · {item.media_type === "episode" ? `Episodio T${item.season_number} E${item.episode_number}` : `Película${item.year ? ` · ${item.year}` : ""}`}</small></div>{item.media_type === "episode" ? <span className="wm-episode-tag">Episodio detectado</span> : <button className="primary-btn" onClick={() => void importMovie(item)} disabled={Boolean(importing)}>{importing === item.id ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}{importing === item.id ? "Guardando…" : "Agregar al catálogo"}</button>}</div>)}</div>}
      <p className="wm-footnote">Los títulos se guardan como borradores. Revisa los derechos, la portada y la información de cada ficha antes de publicarla. Renueva los enlaces firmados desde aquí antes de que venzan.</p>
    </section>
  );
}
