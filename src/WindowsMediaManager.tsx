import { useState } from "react";
import { HardDrive, RefreshCw, Film, CheckCircle2, AlertCircle, Server, ShieldCheck } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./windows-media.css";

type MediaItem = {
  id: string;
  title: string;
  file: string;
  size_bytes: number;
  mime_type: string;
  stream_url: string;
};

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
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function connect() {
    const base = serverUrl.trim().replace(/\/+$/, "");
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
      const base = serverUrl.trim().replace(/\/+$/, "");
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

  return (
    <section className="windows-media">
      <div className="windows-media-hero">
        <div className="windows-media-icon"><Server size={27} /></div>
        <div><span className="wm-eyebrow">BIBLIOTECA PRINCIPAL</span><h2>Servidor Windows 10</h2><p>Conecta la laptop y envía sus películas al catálogo que comparten Android y Roku.</p></div>
      </div>
      <div className="wm-security"><ShieldCheck size={18} /><span>El token solo se usa desde este panel de administrador. Los videos se transmiten desde la laptop; no se copian a Supabase Storage.</span></div>
      <div className="wm-connect-card">
        <label>Dirección HTTPS pública o dirección local del servidor</label>
        <input value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://media.tudominio.com" autoComplete="url" />
        <label>Token de administración de la laptop</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Token configurado en server-config.bat" autoComplete="off" />
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
      <div className="wm-list-head"><div><h3><HardDrive size={18} /> Videos encontrados</h3><p>{items.length} archivos en la biblioteca de la laptop</p></div><button className="secondary-btn" onClick={() => void connect()} disabled={loading || !connected}><RefreshCw size={15} /> Actualizar</button></div>
      {items.length === 0 ? <div className="wm-empty"><Film size={30} /><b>Tu biblioteca aparecerá aquí</b><span>Conecta la laptop para consultar sus archivos MP4, M4V, MOV y WebM.</span></div> :
        <div className="wm-items">{items.map(item => <div className="wm-item" key={item.id}><div className="wm-film"><Film size={19} /></div><div className="wm-item-copy"><b>{item.title}</b><span>{item.file}</span><small>{formatBytes(item.size_bytes)} · {item.mime_type}</small></div><button className="primary-btn" onClick={() => void importMovie(item)} disabled={Boolean(importing)}>{importing === item.id ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}{importing === item.id ? "Guardando…" : "Agregar al catálogo"}</button></div>)}</div>}
      <p className="wm-footnote">Los títulos se guardan como borradores. Revisa los derechos, la portada y la información de cada ficha antes de publicarla. Renueva los enlaces firmados desde aquí antes de que venzan.</p>
    </section>
  );
}
