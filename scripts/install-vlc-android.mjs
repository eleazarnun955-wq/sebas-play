import fs from "node:fs";
import path from "node:path";

const appDir = path.resolve("android/app");
const gradlePath = path.join(appDir, "build.gradle");
const mainPath = path.join(appDir, "src/main/AndroidManifest.xml");
if (!fs.existsSync(gradlePath) || !fs.existsSync(mainPath)) {
  throw new Error("No se encontró el proyecto Android generado por Capacitor.");
}
let gradle = fs.readFileSync(gradlePath, "utf8");
if (!gradle.includes("org.videolan.android:libvlc-all")) {
  const deps = /dependencies\s*\{/;
  if (!deps.test(gradle)) throw new Error("No se encontró el bloque dependencies de Gradle.");
  gradle = gradle.replace(deps, match => match + '\n    implementation "org.videolan.android:libvlc-all:3.7.8"');
  fs.writeFileSync(gradlePath, gradle);
}
const javaRoot = path.join(appDir, "src/main/java");
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { const found=walk(full); if(found)return found; }
    else if (entry.name === "MainActivity.java") return full;
  }
}
const mainActivity = walk(javaRoot);
if (!mainActivity) throw new Error("No se encontró MainActivity.java.");
let mainJava = fs.readFileSync(mainActivity, "utf8");
const pkg = mainJava.match(/^package\s+([\w.]+);/m)?.[1];
if (!pkg) throw new Error("No se pudo detectar el paquete Android.");
const packageDir = path.dirname(mainActivity);
const pluginImport = `import ${pkg}.VlcPlayerPlugin;\n`;
if (!mainJava.includes("VlcPlayerPlugin")) {
  mainJava = mainJava.replace(/^(package\s+[\w.]+;\s*)/m, "$1\n"+pluginImport);
  mainJava = mainJava.replace(/(public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{)/, "$1\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(VlcPlayerPlugin.class);\n        super.onCreate(savedInstanceState);\n    }");
  fs.writeFileSync(mainActivity, mainJava);
}
const plugin = `package ${pkg};

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VlcPlayer")
public class VlcPlayerPlugin extends Plugin {
    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "SEBAS PLAY");
        if (url == null || url.trim().isEmpty()) {
            call.reject("No se recibió una dirección de video.");
            return;
        }
        try {
            Intent intent = new Intent(getContext(), VlcPlaybackActivity.class);
            intent.putExtra("url", url);
            intent.putExtra("title", title);
            intent.putExtra("supabaseUrl", call.getString("supabaseUrl", ""));
            intent.putExtra("anonKey", call.getString("anonKey", ""));
            intent.putExtra("accessToken", call.getString("accessToken", ""));
            intent.putExtra("userId", call.getString("userId", ""));
            intent.putExtra("contentType", call.getString("contentType", ""));
            intent.putExtra("contentId", call.getString("contentId", ""));
            intent.putExtra("profileId", call.getString("profileId", ""));
            getActivity().runOnUiThread(() -> getActivity().startActivity(intent));
            call.resolve();
        } catch (Exception error) {
            call.reject("No se pudo abrir el reproductor VLC: " + error.getMessage(), error);
        }
    }
}
`;
const activity = `package ${pkg};

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.SharedPreferences;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.LinearLayout;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.graphics.Color;
import android.net.Uri;
import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;
import java.util.ArrayList;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicBoolean;

public class VlcPlaybackActivity extends Activity {
    private LibVLC libVLC;
    private MediaPlayer player;
    private VLCVideoLayout videoLayout;
    private Button playPause;
    private SeekBar seekBar;
    private TextView timeLabel;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean released = false;
    private String progressKey = "";
    private long savedPosition = 0;
    private boolean resumeApplied = false;
    private boolean finishedProgressCleared = false;
    private long lastRemoteSyncSeconds = -10;
    private final AtomicBoolean syncInFlight = new AtomicBoolean(false);
    private String supabaseUrl = "";
    private String anonKey = "";
    private String accessToken = "";
    private String userId = "";
    private String contentType = "";
    private String contentId = "";
    private String profileId = "";
    private final Runnable progressUpdate = new Runnable() {
        @Override public void run() {
            if (player != null && seekBar != null && timeLabel != null) {
                long length = player.getLength();
                long current = player.getTime();
                if (length > 0 && current >= length - 1500 && !player.isPlaying()) {
                    if (!finishedProgressCleared) {
                        syncProgress(0, length / 1000);
                        finishedProgressCleared = true;
                    }
                } else if (current < length - 1500) {
                    finishedProgressCleared = false;
                }
                if (length > 0) {
                    if (!resumeApplied) {
                        resumeApplied = true;
                        if (savedPosition > 5000 && savedPosition < length - 15000) {
                            player.setTime(savedPosition);
                            current = savedPosition;
                            android.widget.Toast.makeText(VlcPlaybackActivity.this, "Continuando donde lo dejaste", android.widget.Toast.LENGTH_SHORT).show();
                        }
                    }
                    seekBar.setMax(1000);
                    seekBar.setProgress((int)Math.min(1000, Math.max(0, current * 1000 / length)));
                }
                timeLabel.setText(formatTime(current) + " / " + formatTime(length));
                long seconds = current / 1000;
                if (seconds - lastRemoteSyncSeconds >= 10) {
                    lastRemoteSyncSeconds = seconds;
                    syncProgress(seconds, length > 0 ? length / 1000 : 0);
                }
                if (!released) handler.postDelayed(this, 1000);
            }
        }
    };

    private String formatTime(long millis) {
        long seconds = Math.max(0, millis / 1000);
        return String.format(java.util.Locale.US, "%02d:%02d", seconds / 60, seconds % 60);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        String url = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");
        if (url == null || url.trim().isEmpty()) { finish(); return; }
        progressKey = "position_" + Integer.toHexString(url.hashCode());
        SharedPreferences resumeStore = getSharedPreferences("sebas_play_resume", MODE_PRIVATE);
        savedPosition = resumeStore.getLong(progressKey, 0);
        supabaseUrl = getIntent().getStringExtra("supabaseUrl");
        anonKey = getIntent().getStringExtra("anonKey");
        accessToken = getIntent().getStringExtra("accessToken");
        userId = getIntent().getStringExtra("userId");
        contentType = getIntent().getStringExtra("contentType");
        contentId = getIntent().getStringExtra("contentId");
        profileId = getIntent().getStringExtra("profileId");

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        videoLayout = new VLCVideoLayout(this);
        root.addView(videoLayout, new FrameLayout.LayoutParams(-1, -1));

        LinearLayout controls = new LinearLayout(this);
        controls.setOrientation(LinearLayout.VERTICAL);
        controls.setPadding(20, 18, 20, 18);
        controls.setBackgroundColor(0x99000000);
        FrameLayout.LayoutParams cp = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        TextView heading = new TextView(this);
        heading.setText(title == null ? "SEBAS PLAY" : title);
        heading.setTextColor(Color.WHITE);
        heading.setTextSize(16);
        heading.setMaxLines(2);
        controls.addView(heading);
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        Button back = new Button(this); back.setText("← Volver");
        back.setOnClickListener(v -> finish());
        playPause = new Button(this); playPause.setText("Pausar");
        playPause.setOnClickListener(v -> {
            if (player == null) return;
            if (player.isPlaying()) { player.pause(); playPause.setText("Reproducir"); }
            else { player.play(); playPause.setText("Pausar"); }
        });
        Button skipBack = new Button(this); skipBack.setText("−10 s");
        skipBack.setOnClickListener(v -> { if (player != null) player.setTime(Math.max(0, player.getTime() - 10000)); });
        Button skipForward = new Button(this); skipForward.setText("+10 s");
        skipForward.setOnClickListener(v -> { if (player != null && player.getLength() > 0) player.setTime(Math.min(player.getLength(), player.getTime() + 10000)); });
        row.addView(back, new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(skipBack, new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(playPause, new LinearLayout.LayoutParams(0, -2, 1));
        row.addView(skipForward, new LinearLayout.LayoutParams(0, -2, 1));
        controls.addView(row);
        seekBar = new SeekBar(this);
        seekBar.setMax(1000);
        seekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) {
                if (fromUser && player != null && player.getLength() > 0) {
                    player.setTime(player.getLength() * progress / 1000);
                }
            }
            @Override public void onStartTrackingTouch(SeekBar bar) {}
            @Override public void onStopTrackingTouch(SeekBar bar) {}
        });
        controls.addView(seekBar);
        timeLabel = new TextView(this);
        timeLabel.setTextColor(Color.WHITE);
        timeLabel.setText("00:00 / 00:00");
        controls.addView(timeLabel);
        root.addView(controls, cp);
        setContentView(root);

        try {
            ArrayList<String> options = new ArrayList<>();
            options.add("--network-caching=1500");
            options.add("--file-caching=500");
            options.add("--http-reconnect");
            libVLC = new LibVLC(this, options);
            player = new MediaPlayer(libVLC);
            player.attachViews(videoLayout, null, false, false);
            Media media = new Media(libVLC, Uri.parse(url));
            media.setHWDecoderEnabled(true, false);
            player.setMedia(media);
            media.release();
            player.play();
            handler.post(progressUpdate);
        } catch (Exception error) {
            android.widget.Toast.makeText(this, "VLC no pudo abrir este video: " + error.getMessage(), android.widget.Toast.LENGTH_LONG).show();
            finish();
        }
    }

    @Override protected void onStop() {
        super.onStop();
        releasePlayer();
    }

    private void syncProgress(long positionSeconds, long durationSeconds) {
        if (supabaseUrl == null || supabaseUrl.isEmpty() || anonKey == null || anonKey.isEmpty() ||
            accessToken == null || accessToken.isEmpty() || userId == null || userId.isEmpty() ||
            contentId == null || contentId.isEmpty() ||
            !("movie".equals(contentType) || "episode".equals(contentType))) return;
        if (!syncInFlight.compareAndSet(false, true)) return;
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL endpoint = new URL(supabaseUrl.replaceAll("/$", "") +
                    "/functions/v1/roku-device-sync");
                connection = (HttpURLConnection) endpoint.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.setDoOutput(true);
                connection.setRequestProperty("apikey", anonKey);
                connection.setRequestProperty("Authorization", "Bearer " + accessToken);
                connection.setRequestProperty("Content-Type", "application/json");
                
                org.json.JSONObject payload = new org.json.JSONObject();
                payload.put("action", "progress-user");
                payload.put("profile_id", profileId == null || profileId.isEmpty() ? org.json.JSONObject.NULL : profileId);
                payload.put("content_type", contentType);
                payload.put("content_id", contentId);
                payload.put("position_seconds", positionSeconds);
                if (durationSeconds > 0) payload.put("duration_seconds", durationSeconds);
                else payload.put("duration_seconds", org.json.JSONObject.NULL);
                payload.put("updated_at", Instant.now().toString());
                byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
                try (OutputStream stream = connection.getOutputStream()) { stream.write(bytes); }
                connection.getResponseCode();
            } catch (Exception ignored) {
            } finally {
                if (connection != null) connection.disconnect();
                syncInFlight.set(false);
            }
        }, "SebasPlayProgressSync").start();
    }

    private void releasePlayer() {
        if (released) return;
        if (player != null) {
            long current = Math.max(0, player.getTime());
            long length = Math.max(0, player.getLength());
            long positionSeconds = length > 0 && current >= length - 1500 ? 0 : current / 1000;
            syncProgress(positionSeconds, length / 1000);
        }
        released = true;
        handler.removeCallbacks(progressUpdate);
        if (player != null) {
            long current = player.getTime();
            long length = player.getLength();
            SharedPreferences.Editor editor = getSharedPreferences("sebas_play_resume", MODE_PRIVATE).edit();
            if (length > 0 && current > 5000 && current < length - 15000) editor.putLong(progressKey, current);
            else editor.remove(progressKey);
            editor.apply();
            player.stop(); player.detachViews(); player.release(); player = null;
        }
        if (libVLC != null) { libVLC.release(); libVLC = null; }
    }

    @Override protected void onDestroy() { releasePlayer(); super.onDestroy(); }
}
`;
fs.writeFileSync(path.join(packageDir, "VlcPlayerPlugin.java"), plugin);
fs.writeFileSync(path.join(packageDir, "VlcPlaybackActivity.java"), activity);

let manifest = fs.readFileSync(mainPath, "utf8");
if (!manifest.includes("VlcPlaybackActivity")) {
  manifest = manifest.replace("</application>", '        <activity android:name=".' + "VlcPlaybackActivity" + '" android:configChanges="orientation|screenSize|keyboardHidden" android:exported="false" android:screenOrientation="sensorLandscape" />\n    </application>');
  fs.writeFileSync(mainPath, manifest);
}
console.log("LibVLC 3.7.8 integrado: formatos y protocolos ampliados para reproducción nativa Android.");
