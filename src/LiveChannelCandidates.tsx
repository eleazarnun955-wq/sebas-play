import { Radio, Plus, ShieldCheck } from "lucide-react";

export type LiveChannelCandidate = {
  name: string;
  streamUrl: string;
  category: string;
  countryCode: string;
  region: string;
};

// Direct HLS candidates only. They are intentionally never auto-published:
// each broadcaster may geo-restrict, rotate, or limit external playback.
const candidates: LiveChannelCandidate[] = [
  { name: "Canal Once", streamUrl: "https://vivo.canaloncelive.tv/alivepkgr3/ngrp:cepro_all/playlist.m3u8", category: "Público / cultura", countryCode: "MX", region: "México" },
  { name: "Canal 10 Chetumal", streamUrl: "https://canal10.mediaflix.istream.mx/wza_live/live/movil/playlist.m3u8", category: "General", countryCode: "MX", region: "México" },
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
  return (
    <section className="table-card" style={{ marginBottom: 22 }}>
      <div className="table-title">
        <div><h3><Radio size={17} style={{ verticalAlign: "middle", marginRight: 7 }} />Señales HLS candidatas</h3><span>{candidates.length} señales directas para revisar</span></div>
      </div>
      <div style={{ padding: 16 }}>
        <div className="info-strip" style={{ marginBottom: 14 }}>
          <ShieldCheck size={19} />
          <div><b>No se publican automáticamente</b><p>Son direcciones HLS encontradas en fuentes públicas. Pueden cambiar o tener bloqueo por país. Antes de publicar, prueba la reproducción y documenta la autorización o los derechos de uso.</p></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
          {candidates.map((candidate) => (
            <article key={candidate.name} style={{ border: "1px solid var(--border, #333)", borderRadius: 12, padding: 12, background: "var(--surface, rgba(255,255,255,.02))" }}>
              <div style={{ fontWeight: 700 }}>{candidate.name}</div>
              <div style={{ fontSize: 12, opacity: .72, margin: "4px 0 10px" }}>{candidate.region} · {candidate.category}</div>
              <div style={{ fontSize: 11, opacity: .6, overflowWrap: "anywhere", marginBottom: 10 }}>{new URL(candidate.streamUrl).hostname} · HLS directo</div>
              <button className="secondary-btn" type="button" onClick={() => onSelect(candidate)}><Plus size={15} /> Preparar borrador</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
