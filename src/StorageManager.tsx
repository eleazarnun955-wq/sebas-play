import { useEffect, useMemo, useRef, useState } from "react";
import { CloudUpload, HardDrive, Play, Trash2, Film, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabase";
import "./storage-manager.css";

type LocalMovie = { id: string; title: string; size: number; createdAt: number; file: Blob };
const DB_NAME = "sebas-play-local-library";
const STORE = "movies";
const CLOUD_BUCKET = "sebas-play-videos";
const MAX_CLOUD_BYTES = 50 * 1024 * 1024;

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir el almacenamiento local."));
  });
}

async function listLocalMovies(): Promise<LocalMovie[]> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => { db.close(); resolve((request.result ?? []) as LocalMovie[]); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function saveLocalMovie(movie: LocalMovie): Promise<void> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(movie);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error("No se pudo guardar el archivo.")); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Se canceló el guardado.")); };
  });
}

async function deleteLocalMovie(id: string): Promise<void> {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function StorageManager() {
  const [localMovies, setLocalMovies] = useState<LocalMovie[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cloudTitle, setCloudTitle] = useState("");
  const [rightsNote, setRightsNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null);
  const [playing, setPlaying] = useState<LocalMovie | null>(null);
  const [playUrl, setPlayUrl] = useState("");
  const refreshSequence = useRef(0);

  const localTotal = useMemo(() => localMovies.reduce((sum, movie) => sum + movie.size, 0), [localMovies]);

  async function refresh() {
    const request = ++refreshSequence.current;
    try {
      const items = await listLocalMovies();
      if (request !== refreshSequence.current) return;
      setLocalMovies(items.sort((a, b) => b.createdAt - a.createdAt));
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        if (request !== refreshSequence.current) return;
        setQuota({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 });
      }
    } catch (error) {
      if (request === refreshSequence.current) setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo leer la biblioteca local." });
    }
  }

  useEffect(() => { void refresh(); return () => { refreshSequence.current++; }; }, []);
  useEffect(() => {
    if (!playing) { setPlayUrl(""); return; }
    const url = URL.createObjectURL(playing.file);
    setPlayUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [playing]);

  function chooseFile(file: File | null) {
    setSelectedFile(file);
    setCloudTitle(file?.name.replace(/\.[^.]+$/, "") ?? "");
    setNotice(null);
  }

  async function saveOnPhone() {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("video/") && !/\.(mp4|m4v|mov|webm)$/i.test(selectedFile.name)) {
      setNotice({ type: "error", text: "Selecciona un archivo de video compatible." });
      return;
    }
    setBusy(true);
    try {
      if (navigator.storage?.persist) await navigator.storage.persist();
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota ?? 0) - (estimate.usage ?? 0);
        if (available > 0 && selectedFile.size > available * 0.9) {
          throw new Error("No hay espacio local suficiente. Libera espacio en el teléfono e inténtalo de nuevo.");
        }
      }
      const movie: LocalMovie = {
        id: crypto.randomUUID(),
        title: cloudTitle.trim() || selectedFile.name.replace(/\.[^.]+$/, ""),
        size: selectedFile.size,
        createdAt: Date.now(),
        file: selectedFile,
      };
      await saveLocalMovie(movie);
      await refresh();
      setNotice({ type: "ok", text: "Película guardada en el almacenamiento de este teléfono. Estará disponible sin internet dentro de SEBAS PLAY en este dispositivo." });
      setSelectedFile(null);
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo guardar en el teléfono." });
    } finally { setBusy(false); }
  }

  async function uploadToCloud() {
    if (!supabase || !selectedFile || busy) return;
    const file = selectedFile;
    const title = cloudTitle.trim() || file.name.replace(/\\.[^.]+$/, "");
    const rights = rightsNote.trim();
    if (!file.name.toLowerCase().endsWith(".mp4") || file.type !== "" && file.type !== "video/mp4") {
      setNotice({ type: "error", text: "Para la nube y Roku utiliza MP4 (H.264/AAC) para mayor compatibilidad." });
      return;
    }
    if (file.size > MAX_CLOUD_BYTES) {
      setNotice({ type: "error", text: "El plan gratuito de Supabase limita cada archivo a 50 MB. Comprime el video o guárdalo localmente." });
      return;
    }
    if (!rights) {
      setNotice({ type: "error", text: "Confirma el origen o autorización del contenido antes de subirlo." });
      return;
    }
    setBusy(true);
    setNotice(null);
    let objectPath: string | null = null;
    let uploaded = false;
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) throw new Error("La sesión expiró. Vuelve a iniciar sesión.");
      objectPath = auth.user.id + "/" + crypto.randomUUID() + ".mp4";
      const { error: uploadError } = await supabase.storage.from(CLOUD_BUCKET).upload(objectPath, file, {
        cacheControl: "3600", contentType: "video/mp4", upsert: false,
      });
      if (uploadError) throw uploadError;
      uploaded = true;
      const { data: publicData } = supabase.storage.from(CLOUD_BUCKET).getPublicUrl(objectPath);
      const { error: insertError } = await supabase.from("movies").insert({
        title,
        video_url: publicData.publicUrl,
        source_type: "owned_upload",
        rights_note: rights,
        is_published: false,
      });
      if (insertError) throw insertError;
      uploaded = false;
      setNotice({ type: "ok", text: "Video subido y registrado como borrador. Revísalo y publícalo desde Películas para que aparezca en Android y Roku." });
      setSelectedFile(current => current === file ? null : current);
      setRightsNote("");
    } catch (error) {
      if (uploaded && objectPath) {
        const { error: cleanupError } = await supabase.storage.from(CLOUD_BUCKET).remove([objectPath]);
        if (cleanupError) {
          setNotice({ type: "error", text: "No se pudo registrar el video y tampoco confirmar la limpieza del archivo subido. Revisa Storage antes de volver a intentarlo. " + cleanupError.message });
        } else {
          setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir el video. Verifica el bucket y sus políticas." });
        }
      } else {
        setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir el video. Verifica el bucket y sus políticas." });
      }
    } finally { setBusy(false); }
  }

  async function removeLocal(id: string) {
    if (!window.confirm("¿Eliminar esta copia del teléfono? La copia en la nube y el catálogo no se modificarán.")) return;
    try {
      await deleteLocalMovie(id);
      if (playing?.id === id) setPlaying(null);
      await refresh();
      setNotice({ type: "ok", text: "Copia local eliminada. El catálogo en la nube permanece intacto." });
    } catch (error) {
      setNotice({ type: "error", text: error instanceof Error ? error.message : "No se pudo eliminar el archivo." });
    }
  }

  return <section className="storage-page">
    <div className="storage-intro"><div><span className="storage-eyebrow">BIBLIOTECA HÍBRIDA</span><h2>Almacenamiento de SEBAS PLAY</h2><p>Guarda archivos en este teléfono para verlos sin internet o súbelos a la nube para compartir el catálogo con Roku.</p></div><button className="secondary-btn" onClick={() => void refresh()}><RefreshCw size={16}/> Actualizar</button></div>
    <div className="storage-stats">
      <article><HardDrive size={22}/><span>En este teléfono</span><b>{formatBytes(localTotal)}</b><small>{localMovies.length} películas guardadas localmente</small></article>
      <article><CloudUpload size={22}/><span>Nube compartida</span><b>Supabase Storage</b><small>Cuota gratuita limitada; videos MP4 de hasta 50 MB por archivo.</small></article>
      {quota && <article><Film size={22}/><span>Uso del almacenamiento web</span><b>{formatBytes(quota.usage)}</b><small>Cuota estimada del navegador: {formatBytes(quota.quota)}</small></article>}
    </div>
    <div className="storage-upload-card">
      <h3><Film size={19}/> Agregar película desde el celular</h3>
      <label className="storage-file-picker">Seleccionar video<input type="file" accept="video/mp4,video/*,.mp4,.m4v,.mov,.webm" onChange={e => chooseFile(e.target.files?.[0] ?? null)} disabled={busy}/></label>
      {selectedFile && <div className="storage-selected"><b>{selectedFile.name}</b><span>{formatBytes(selectedFile.size)}</span></div>}
      <label className="storage-field">Nombre para el catálogo<input value={cloudTitle} onChange={e => setCloudTitle(e.target.value)} placeholder="Título de la película" /></label>
      <label className="storage-field">Origen o autorización (obligatorio para nube)<input value={rightsNote} onChange={e => setRightsNote(e.target.value)} placeholder="Contenido propio, dominio público o licencia…" /></label>
      <div className="storage-actions"><button className="secondary-btn" onClick={() => void saveOnPhone()} disabled={!selectedFile || busy}><HardDrive size={16}/> Guardar solo en el teléfono</button><button className="primary-btn" onClick={() => void uploadToCloud()} disabled={!selectedFile || busy}><CloudUpload size={16}/>{busy ? "Procesando…" : "Subir a nube + catálogo"}</button></div>
      <p className="storage-footnote"><AlertTriangle size={15}/> Los videos de la nube usan la cuota de almacenamiento y transferencia. La versión gratuita de Supabase limita los archivos a 50 MB; no se generarán pagos desde esta aplicación, pero revisa el plan y uso de tu proyecto. Roku necesita una URL HTTPS pública compatible con su reproductor.</p>
    </div>
    {playing && <div className="storage-player"><div><b>Reproduciendo: {playing.title}</b><button className="icon-btn" onClick={() => setPlaying(null)}>Cerrar</button></div>{playUrl && <video controls autoPlay playsInline src={playUrl}/>}</div>}
    <div className="storage-library"><div className="storage-library-head"><h3>Películas guardadas en este teléfono</h3><span>{localMovies.length} archivos</span></div>{localMovies.length === 0 ? <p className="storage-empty">Todavía no hay películas guardadas localmente.</p> : localMovies.map(movie => <div className="storage-local-row" key={movie.id}><div className="storage-local-icon"><Film size={20}/></div><div className="storage-local-copy"><b>{movie.title}</b><small>{formatBytes(movie.size)} · Guardada en este dispositivo</small></div><button className="text-action" onClick={() => setPlaying(movie)}><Play size={15}/> Reproducir</button><button className="delete-action" onClick={() => void removeLocal(movie.id)}><Trash2 size={15}/> Eliminar</button></div>)}</div>
    {notice && <div className={"storage-notice " + notice.type}>{notice.type === "ok" ? <CheckCircle2 size={17}/> : <AlertTriangle size={17}/>} {notice.text}</div>}
  </section>;
}
