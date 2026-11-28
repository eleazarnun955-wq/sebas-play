import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Radio, Plus, ShieldCheck, PlayCircle, CircleAlert } from "lucide-react";

export type LiveChannelCandidate = {
  name: string;
  streamUrl: string;
  category: string;
  countryCode: string;
  region: string;
};

const candidates: LiveChannelCandidate[] = [
  { name: "Canal Once", streamUrl: "https://vivo.canaloncelive.tv/alivepkgr3/ngrp:cepro_all/playlist.m3u8", category: "Público / cultura", countryCode: "MX", region: "México" },
  { name: "Canal 10 Chetumal", streamUrl: "https://canal10.mediaflix.istream.mx/wza_live/live/movil/playlist.m3u8", category: "General", countryCode: "MX", region: "Quintana Roo, México" },
  { name: "Canal Catorce", streamUrl: "https://cdn.mycloudstream.io/hls/live/broadcast/uqgv4lg6/index.m3u8", category: "Público / noticias", countryCode: "MX", region: "México" },
  { name: "Canal 22.2", streamUrl: "https://5fc584f3f19c9.streamlock.net/canal222/videocanal222/playlist.m3u8", category: "Público / cultura", countryCode: "MX", region: "México" },
  { name: "TV4 Cultura", streamUrl: "https://5f2c1b0d880e5.streamlock.net/tv42/videotv42/playlist.m3u8", category: "Educación / cultura", countryCode: "MX", region: "Guanajuato, México" },
  { name: "TV UNAM", streamUrl: "https://5ca3e84a76d30.streamlock.net/tvunam/videotvunam/playlist.m3u8", category: "Universitario / cultura", countryCode: "MX", region: "México" },
  { name: "Canal 44 Chihuahua", streamUrl: "https://5e50264bd6766.streamlock.net/canal442/videocanal442/playlist.m3u8", category: "Público / regional", countryCode: "MX", region: "Chihuahua, México" },
  { name: "24 Horas RTVE", streamUrl: "https://rtvelivestreamv3.akamaized.net/24h/24h_main_dvr.m3u8", category: "Noticias", countryCode: "ES", region: "España" },
  { name: "La 1 RTVE", streamUrl: "https://rtvelivestream.rtve.es/rtvesec/la1/la1_main_dvr.m3u8", category: "General", countryCode: "ES", region: "España" },
  { name: "La 2 RTVE", streamUrl: "https://rtvelivestream.rtve.es/rtvesec/la2/la2_main_dvr.m3u8", category: "Cultura", countryCode: "ES", region: "España" },
  { name: "Teledeporte RTVE", streamUrl: "https://rtvelivestream.rtve.es/rtvesec/tdp/tdp_main.m3u8", category: "Deportes", countryCode: "ES", region: "España" },
  { name: "Clan RTVE", streamUrl: "https://rtvelivestream.rtve.es/rtvesec/clan/clan_main_dvr.m3u8", category: "Infantil", countryCode: "ES", region: "España" },
  { name: "DW Español", streamUrl: "https://dwamdstream104.akamaized.net/hls/live/2015530/dwstream104/index.m3u8", category: "Noticias", countryCode: "DE", region: "Internacional" },
  { name: "Aragón TV", streamUrl: "https://cartv.streaming.aranova.es/hls/live/aragontv_canal1.m3u8", category: "Público / regional", countryCode: "ES", region: "España" },
  { name: "101TV Málaga", streamUrl: "https://limited38.todostreaming.es/live/101tv-web101tv.m3u8", category: "General / regional", countryCode: "ES", region: "España" },
];

export default function LiveChannelCandidates({ onSelect }: { onSelect: (candidate: LiveChannelCandidate) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [selected, setSelected] = useState<LiveChannelCandidate | null>(null);
  const [status, setStatus] = useState("Elige una señal y pulsa Probar para comprobar si entrega video en este navegador.");
  const [statusKind, setStatusKind] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selected) return;
    hlsRef.current?.destroy();
    hlsRef.current = null;
    setStatus("Conectando con la señal HLS…");
    setStatusKind("idle");
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, manifestLoadingTimeOut: 12000, levelLoadingTimeOut: 12000 });
      hlsRef.current = hls;
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(selected.streamUrl));
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setStatus("Manifiesto HLS recibido. Reproducción iniciada: confirma imagen y audio antes de aprobar.");
        setStatusKind("ok");
        void video.play().catch(() => setStatus("Señal recibida. Pulsa reproducir en el video para confirmar imagen y audio."));
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setStatus("No se pudo reproducir aquí. Puede estar caída, geobloqueada o bloquear solicitudes externas; no se publica.");
          setStatusKind("error");
          hls.destroy();
          hlsRef.current = null;
        }
      });
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = selected.streamUrl;
      video.onloadedmetadata = () => { setStatus("Señal HLS cargada. Confirma imagen y audio antes de aprobar."); setStatusKind("ok"); };
      video.onerror = () => { setStatus("El navegador no pudo cargar esta señal. No se publica."); setStatusKind("error"); };
      void video.play().catch(() => setStatus("Señal seleccionada. Pulsa reproducir para confirmar imagen y audio."));
    } else {
      setStatus("Este navegador no admite HLS para la prueba. No se marca como verificada.");
      setStatusKind("error");
    }
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [selected]);

  return (
    <section className="table-card" style={{ marginBottom: 22 }}>
      <div className="table-title">
        <div><h3><Radio size={17} style={{ verticalAlign: "middle", marginRight: 7 }} />Canales de TV en español — v27.0</h3><span>{candidates.length} señales HLS candidatas · México primero</span></div>
      </div>
      <div style={{ padding: 16 }}>
        <div className="info-strip" style={{ marginBottom: 14 }}>
          <ShieldCheck size={19} />
          <div><b>Prueba técnica antes de publicar</b><p>Estas direcciones son candidatas encontradas en fuentes públicas. La prueba comprueba si el navegador recibe HLS, pero no garantiza reproducción en Android/Roku ni concede derechos. Cada canal sigue como borrador hasta verificar imagen, audio, región y autorización.</p></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
          {candidates.map((candidate) => (
            <article key={candidate.name} style={{ border: "1px solid var(--border, #333)", borderRadius: 12, padding: 12, background: "var(--surface, rgba(255,255,255,.02))" }}>
              <div style={{ fontWeight: 700 }}>{candidate.name}</div>
              <div style={{ fontSize: 12, opacity: .72, margin: "4px 0 10px" }}>{candidate.region} · {candidate.category}</div>
              <div style={{ fontSize: 11, opacity: .6, overflowWrap: "anywhere", marginBottom: 10 }}>{new URL(candidate.streamUrl).hostname} · HLS directo</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button className="secondary-btn" type="button" onClick={() => setSelected(candidate)}><PlayCircle size={15} /> Probar señal</button>
                <button className="secondary-btn" type="button" onClick={() => onSelect(candidate)}><Plus size={15} /> Preparar borrador</button>
              </div>
            </article>
          ))}
        </div>
        <div style={{ marginTop: 16, border: "1px solid var(--border, #333)", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontWeight: 700 }}>
            {statusKind === "error" ? <CircleAlert size={17} /> : <Radio size={17} />}
            {selected ? `Prueba: ${selected.name}` : "Prueba de reproducción"}
          </div>
          <p role="status" style={{ fontSize: 13, margin: "0 0 10px", opacity: .85 }}>{status}</p>
          <video ref={videoRef} controls muted playsInline style={{ width: "100%", maxHeight: 300, background: "#000", borderRadius: 8 }} />
        </div>
      </div>
    </section>
  );
}
