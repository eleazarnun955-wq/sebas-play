import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public/icons/sebas-play.svg");
const android = path.join(root, "android/app/src/main/res");
const svg = await fs.readFile(source);
const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [density, size] of Object.entries(densities)) {
  const dir = path.join(android, `mipmap-${density}`);
  await fs.mkdir(dir, { recursive: true });
  await sharp(svg).resize(size, size).png().toFile(path.join(dir, "ic_launcher.png"));
  await sharp(svg).resize(size, size).png().toFile(path.join(dir, "ic_launcher_round.png"));
}
const drawable = path.join(android, "drawable");
const anydpi = path.join(android, "mipmap-anydpi-v26");
const values = path.join(android, "values");
await Promise.all([fs.mkdir(drawable,{recursive:true}),fs.mkdir(anydpi,{recursive:true}),fs.mkdir(values,{recursive:true})]);
await fs.writeFile(path.join(drawable,"ic_launcher_foreground.xml"), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
  <path android:fillColor="#E50914" android:pathData="M54,8 A46,46 0,1 0,54 100 A46,46 0,1 0,54 8"/>
  <path android:fillColor="#FFFFFFFF" android:pathData="M43,29 Q39,27 39,33 L39,75 Q39,81 45,78 L76,58 Q81,54 76,50 Z"/>
</vector>`);
await fs.writeFile(path.join(values,"ic_launcher_colors.xml"), `<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#080808</color></resources>`);
await fs.writeFile(path.join(anydpi,"ic_launcher.xml"), `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>`);
console.log("SEBAS PLAY launcher icons generated for all Android densities.");
