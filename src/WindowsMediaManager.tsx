import { useState } from "react";
import { HardDrive, RefreshCw, Film, CheckCircle2, AlertCircle, Server, ShieldCheck } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./windows-media.css";

type ServerCapabilities = { ffmpeg:{available:boolean;version:string|null;reason:string|null};direct_play:boolean;http_range:boolean };

type XmltvProgramme = { channel_id:string; start:string; stop:string; title:string; description:string|null; categories:string[] };
type XmltvGuide = { channels:{id:string;display_names:string[]}[]; programmes:XmltvProgramme[]; imported_at:string; source:string };

type MediaItem = {
  id: string;
  title: string;
  file: string;
  size_bytes: number;
  mime_type: string;
  stream_url: string;
  synopsis?: string | null;
  release_year?: number | null;
  age_rating?: string | null;
  genres?: string[];
  duration_minutes?: number | null;
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
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string>("");
  const [capabilities, setCapabilities] = useState<ServerCapabilities | null>(null);
  const [epgImporting, setEpgImporting] = useState(false);
  const [epgStatus, setEpgStatus] = useState<string>("");
  const [epgGuide, setEpgGuide] = useState<XmltvGuide|null>(null);
  const [epgLoading, setEpgLoading] = useState(false);
  const [epgChannel, setEpgChannel] = useState("all");
  const [transcoding, setTranscoding] = useState("");
  const [transcodeMessage, setTranscodeMessage] = useState("");

  async function connect() {
    const base = normalizeServerBase(serverUrl);
    if (!/^https?:\/\//i.test(base) || !token.trim()) {
      setMessage({ kind: "error", text: "Escribe la dirección del servidor y el token de administración." });
      return;
    }
    setLoading(true); setMessage(null);
    try {
      // Check reachability without credentials; send the admin token only in a header.
      const healthResponse = await fetch(`${base}/health`, { cache: "no-store" });
      if (!healthResponse.ok) throw new Error(`La laptop respondió con HTTP ${healthResponse.status} en /health.`);
      const response = await fetch(`${base}/api/catalog`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Error HTTP ${response.status}`);
      setItems((payload.items || []) as MediaItem[]);
      try {
        const capabilityResponse = await fetch(`${base}/api/capabilities`, {
          cache: "no-store",
          headers: { Authorization: `Bearer ${token.trim()}` },
        });
        const capabilityPayload = await capabilityResponse.json();
        if (capabilityResponse.ok && capabilityPayload.capabilities) {
          setCapabilities(capabilityPayload.capabilities as ServerCapabilities);
        } else setCapabilities(null);
      } catch { setCapabilities(null); }
      setConnected(true);
      await loadXmltvGuide();
      setMessage({ kind: "ok", text: `Conectado. Se encontraron ${payload.count || 0} videos compatibles.` });
    } catch (error) {
      setConnected(false);
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo conectar con la laptop." });
    } finally { setLoading(false); }
  }

  async function scanNow() {
    if (!connected || !serverUrl.trim() || !token.trim()) {
      setMessage({ kind: "error", text: "Conecta primero la laptop para iniciar el escaneo." });
      return;
    }
    setScanning(true); setMessage(null);
    try {
      const base = normalizeServerBase(serverUrl);
      const response = await fetch(`${base}/api/scan`, {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      setLastScan(new Date().toLocaleString());
      await connect();
      setMessage({ kind: "ok", text: `Escaneo completado. El servidor informa ${result.library_count ?? result.count ?? "—"} archivos en la biblioteca.` });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "No se pudo completar el escaneo de la laptop." });
    } finally { setScanning(false); }
  }


  async function loadXmltvGuide() {
    if (!serverUrl.trim() || !token.trim()) return;
    setEpgLoading(true);
    try {
      const base = normalizeServerBase(serverUrl);
      const response = await fetch(`${base}/api/epg`, {
        cache:"no-store", headers:{ Authorization:`Bearer ${token.trim()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      setEpgGuide(result.configured && result.guide ? result.guide as XmltvGuide : null);
    } catch (error) {
      setEpgStatus(error instanceof Error ? error.message : "No se pudo consultar la guía XMLTV.");
    } finally { setEpgLoading(false); }
  }

  async function importXmltv(file: File) {
    if (!connected || !serverUrl.trim() || !token.trim()) {
      setEpgStatus("Conecta primero la laptop para importar la guía.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setEpgStatus("El archivo XMLTV no debe superar 8 MB.");
      return;
    }
    setEpgImporting(true); setEpgStatus("");
    try {
      const base = normalizeServerBase(serverUrl);
      const response = await fetch(`${base}/api/epg/import`, {
        method: "POST",
        cache: "no-store",
        headers: { Authorization: `Bearer ${token.trim()}`, "Content-Type": "application/xml; charset=utf-8" },
        body: await file.text(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      setEpgStatus(`Guía importada: ${result.channel_count} canales y ${result.programme_count} programas.`);
      await loadXmltvGuide();
    } catch (error) {
      setEpgStatus(error instanceof Error ? error.message : "No se pudo importar la guía XMLTV.");
    } finally { setEpgImporting(false); }
  }


  async function transcodeMedia(item:MediaItem, profile:"roku"|"mobile") {
    if (!connected || !capabilities?.ffmpeg.available) {
      setTranscodeMessage("FFmpeg no está disponible en la laptop. Instálalo y reinicia el servidor.");
      return;
    }
    setTranscoding(item.id);setTranscodeMessage("Preparando conversión…");
    try {
      const base=normalizeServerBase(serverUrl);
      const response=await fetch(`${base}/api/transcode`,{
        method:"POST",cache:"no-store",
        headers:{Authorization:`Bearer ${token.trim()}`,"Content-Type":"application/json"},
        body:JSON.stringify({file:item.file,profile}),
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||`Error HTTP ${response.status}`);
      const jobId=String(payload.job?.id||"");
      if(!jobId)throw new Error("El servidor no devolvió el identificador de conversión.");
      setTranscodeMessage("Convirtiendo video… Puedes dejar esta ventana abierta.");
      for(let attempt=0;attempt<900;attempt++){
        await new Promise(resolve=>window.setTimeout(resolve,4000));
        const statusResponse=await fetch(`${base}/api/transcode/${encodeURIComponent(jobId)}`,{
          cache:"no-store",headers:{Authorization:`Bearer ${token.trim()}`},
        });
        const statusPayload=await statusResponse.json();
        if(!statusResponse.ok)throw new Error(statusPayload.error||`Error HTTP ${statusResponse.status}`);
        const job=statusPayload.job;
        if(job?.status==="completed"){
          await connect();
          setTranscodeMessage(`Conversión terminada: ${job.output}`);
          return;
        }
        if(job?.status==="failed")throw new Error(job.error||"Falló la conversión FFmpeg.");
      }
      throw new Error("La conversión sigue en curso. Revisa el estado en la laptop y vuelve a conectar la biblioteca.");
    }catch(error){
      setTranscodeMessage(error instanceof Error?error.message:"No se pudo convertir el video.");
    }finally{setTranscoding("")}
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
      const uploadUrl = new URL(`${base}/api/upload`);
      uploadUrl.searchParams.set("name", file.name);
      const response = await fetch(uploadUrl.toString(), {
        method: "POST",
        // The server handles the Authorization preflight and never receives secrets in URLs.
        headers: { "Content-Type": "text/plain;charset=UTF-8", Authorization: `Bearer ${token.trim()}` },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Error HTTP ${response.status}`);
      const catalogResponse = await fetch(`${base}/api/catalog`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
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
      synopsis: item.synopsis || null,
      release_year: item.release_year || null,
      age_rating: item.age_rating || null,
      genres: item.genres || [],
      duration_minutes: item.duration_minutes || null,
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
        <input value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="http://192.168.1.15:8787" autoComplete="url" />
        <small>En casa, escribe la dirección LAN que muestra la laptop y conecta ambos dispositivos al mismo Wi-Fi. Para fuera de casa se requiere una dirección HTTPS estable.</small>
        <label>Token de administración de la laptop</label>
        <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Token de SEBAS-PLAY-ACCESS-TOKEN.txt" autoComplete="off" />
        <button className="primary-btn" onClick={() => void connect()} disabled={loading}>
          {loading ? <RefreshCw size={16} className="spin" /> : <Server size={16} />} {loading ? "Conectando…" : connected ? "Actualizar biblioteca" : "Conectar con laptop"}
        </button>
        <div className="wm-upload-card">
          <label>Guía de programación XMLTV (opcional)</label>
          <input type="file" accept=".xml,.xmltv,application/xml,text/xml" disabled={!connected || epgImporting} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void importXmltv(file); event.currentTarget.value = ""; }} />
          <small>{epgImporting ? "Importando guía…" : "Importa un archivo XMLTV de hasta 8 MB. No es obligatorio: SEBAS PLAY funciona normalmente si no agregas una guía."}</small>
          {epgStatus && <small role="status">{epgStatus}</small>}
        </div>

        {connected && <div className="wm-upload-card" style={{marginTop:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <label>Guía de televisión · horario local</label>
            <button className="secondary-btn" type="button" onClick={()=>void loadXmltvGuide()} disabled={epgLoading}>{epgLoading?"Consultando…":"Actualizar guía"}</button>
          </div>
          {!epgGuide ? <small>{epgLoading?"Consultando la guía guardada en la laptop…":"Todavía no hay una guía XMLTV importada."}</small> : <>
            <small>{epgGuide.channels.length} canales · {epgGuide.programmes.length} programas · Horas mostradas según la zona horaria de este dispositivo.</small>
            <label>Canal<select value={epgChannel} onChange={e=>setEpgChannel(e.target.value)}><option value="all">Todos los canales</option>{epgGuide.channels.map(channel=><option key={channel.id} value={channel.id}>{channel.display_names[0]||channel.id}</option>)}</select></label>
            <div style={{display:"grid",gap:8,maxHeight:280,overflowY:"auto"}}>
              {epgGuide.programmes.filter(programme=>epgChannel==="all"||programme.channel_id===epgChannel).slice(0,60).map((programme,index)=>{
                const channel=epgGuide.channels.find(item=>item.id===programme.channel_id);
                const time=(value:string)=>new Date(value).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
                return <div key={programme.channel_id+programme.start+index} style={{padding:"10px 12px",borderRadius:10,background:"#ffffff0a",display:"grid",gridTemplateColumns:"100px 1fr",gap:10}}>
                  <b>{time(programme.start)}–{time(programme.stop)}</b>
                  <span><b>{programme.title}</b><small style={{display:"block",opacity:.72}}>{channel?.display_names[0]||programme.channel_id}{programme.categories?.length?" · "+programme.categories.join(", "):""}</small>{programme.description&&<small style={{display:"block",opacity:.72}}>{programme.description}</small>}</span>
                </div>;
              })}
            </div>
          </>}
        </div>}
\n        <div className="wm-upload-card">\n          <label>Subir película desde este dispositivo</label>
          <input type="file" accept=".mp4,.m4v,.mov,.webm,video/mp4,video/x-m4v,video/quicktime,video/webm" disabled={!connected || uploading} onChange={event => { const file = event.currentTarget.files?.[0]; if (file) void uploadFile(file); event.currentTarget.value = ""; }} />
          <small>{uploading ? "Subiendo video a la laptop…" : "El archivo se guarda directamente en la carpeta Peliculas de Windows y se agrega como borrador al catálogo."}</small>
        </div>
      </div>
      {transcodeMessage && <div className="wm-message ok"><CheckCircle2 size={17}/>{transcodeMessage}</div>}\n      {message && <div className={`wm-message ${message.kind}`}>{message.kind === "ok" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}{message.text}</div>}
      {connected && capabilities && <div className="wm-capability">
        <div><b>Compatibilidad del servidor</b><span>Reproducción directa y transmisión por fragmentos (HTTP Range) disponibles.</span></div>
        <div className={capabilities.ffmpeg.available ? "wm-ffmpeg available" : "wm-ffmpeg unavailable"}>
          <b>FFmpeg: {capabilities.ffmpeg.available ? "Detectado" : "No detectado"}</b>
          <span>{capabilities.ffmpeg.available ? capabilities.ffmpeg.version : "La reproducción directa sigue disponible. No se instaló ni activó ninguna transcodificación."}</span>
        </div>
      </div>}
      <div className="wm-list-head"><div><h3><HardDrive size={18} /> Videos encontrados</h3><p>{items.length} archivos en la biblioteca de la laptop{lastScan ? ` · Último escaneo: ${lastScan}` : ""}</p></div><div className="wm-list-actions"><button className="secondary-btn" onClick={() => void scanNow()} disabled={loading || scanning || !connected}><RefreshCw size={15} className={scanning ? "spin" : ""} /> {scanning ? "Escaneando…" : "Escanear ahora"}</button><button className="secondary-btn" onClick={() => void connect()} disabled={loading || scanning || !connected}><RefreshCw size={15} /> Actualizar</button></div></div>
      {items.length === 0 ? <div className="wm-empty"><Film size={30} /><b>Tu biblioteca aparecerá aquí</b><span>Conecta la laptop para consultar sus archivos MP4, M4V, MOV y WebM.</span></div> :
        <div className="wm-items">{items.map(item => <div className="wm-item" key={item.id}><div className="wm-film"><Film size={19} /></div><div className="wm-item-copy"><b>{item.title}</b><span>{item.file}</span><small>{formatBytes(item.size_bytes)} · {item.mime_type}</small>{(item.release_year || item.age_rating || item.genres?.length || item.duration_minutes) && <small>{[item.release_year, item.age_rating, item.duration_minutes ? `${item.duration_minutes} min` : null, ...(item.genres || [])].filter(Boolean).join(" · ")}</small>}{item.synopsis && <small>{item.synopsis}</small>}</div><div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}><button className="primary-btn" onClick={() => void importMovie(item)} disabled={Boolean(importing)||Boolean(transcoding)}>{importing === item.id ? <RefreshCw size={15} className="spin" /> : <CheckCircle2 size={15} />}{importing === item.id ? "Guardando…" : "Agregar al catálogo"}</button>{capabilities?.ffmpeg.available&&<><button className="secondary-btn" onClick={()=>void transcodeMedia(item,"roku")} disabled={Boolean(transcoding)||Boolean(importing)}>{transcoding===item.id?"Convirtiendo…":"MP4 Roku"}</button><button className="secondary-btn" onClick={()=>void transcodeMedia(item,"mobile")} disabled={Boolean(transcoding)||Boolean(importing)}>MP4 móvil</button></>}</div></div>)}</div>}
      <p className="wm-footnote">Los títulos se guardan como borradores. Revisa los derechos, la portada y la información de cada ficha antes de publicarla. Renueva los enlaces firmados desde aquí antes de que venzan.</p>
    </section>
  );
}
