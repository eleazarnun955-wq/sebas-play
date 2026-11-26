const PROFILES = new Set(["roku", "mobile"]);

export function transcodeOutputPath(jobId) {
  if (typeof jobId !== "string" || !/^[0-9a-f-]{36}$/i.test(jobId)) {
    throw new Error("Identificador de conversión inválido.");
  }
  return `Transcodificados/${jobId}.mp4`;
}

export function buildTranscodeArgs(inputPath, outputPath, profile = "roku") {
  if (typeof inputPath !== "string" || !inputPath || typeof outputPath !== "string" || !outputPath) {
    throw new Error("Se requieren rutas de entrada y salida.");
  }
  if (!PROFILES.has(profile)) throw new Error("Perfil de conversión no admitido.");
  const maxWidth = profile === "mobile" ? 1280 : 1920;
  return [
    "-nostdin", "-hide_banner", "-y", "-i", inputPath,
    "-map", "0:v:0", "-map", "0:a:0?",
    "-vf", `scale=w='min(${maxWidth},iw)':h=-2:force_original_aspect_ratio=decrease`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-f", "mp4", outputPath,
  ];
}
