import fs from "node:fs";
import path from "node:path";

const appDir = path.resolve("android/app");
const javaRoot = path.join(appDir, "src/main/java");
const manifestPath = path.join(appDir, "src/main/AndroidManifest.xml");
if (!fs.existsSync(manifestPath) || !fs.existsSync(javaRoot)) throw new Error("Primero genera y sincroniza el proyecto Android.");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){const found=walk(full);if(found)return found;}
    else if(entry.name==="MainActivity.java")return full;
  }
}
const mainPath=walk(javaRoot);
if(!mainPath)throw new Error("No se encontró MainActivity.java.");
let main=fs.readFileSync(mainPath,"utf8");
const pkg=main.match(/^package\s+([\w.]+);/m)?.[1];
if(!pkg)throw new Error("No se pudo detectar el paquete Android.");
const dir=path.dirname(mainPath);
if(!main.includes("RokuDiscoveryPlugin")){
 main=main.replace(/^(package\s+[\w.]+;\s*)/m,"$1\nimport "+pkg+".RokuDiscoveryPlugin;\n");
 main=main.replace(/(public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{)/,"$1\n    @Override public void onCreate(android.os.Bundle state) {\n        registerPlugin(RokuDiscoveryPlugin.class);\n        super.onCreate(state);\n    }");
 fs.writeFileSync(mainPath,main);
}
const java = `package ${pkg};

import android.content.Context;
import android.net.wifi.WifiManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.net.DatagramPacket;
import java.net.InetAddress;
import java.net.MulticastSocket;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "RokuDiscovery")
public class RokuDiscoveryPlugin extends Plugin {
 private final ExecutorService worker=Executors.newSingleThreadExecutor();
 @PluginMethod public void discover(PluginCall call){
  worker.execute(()->{
   WifiManager wifi=(WifiManager)getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
   WifiManager.MulticastLock lock=null;
   JSONArray found=new JSONArray();
   try{
    if(wifi!=null){lock=wifi.createMulticastLock("SebasPlayRokuDiscovery");lock.setReferenceCounted(false);lock.acquire();}
    Map<String,String> devices=new LinkedHashMap<>();
    try(MulticastSocket socket=new MulticastSocket()){
     socket.setReuseAddress(true);socket.setSoTimeout(450);
     byte[] request=("M-SEARCH * HTTP/1.1\\r\\nHOST: 239.255.255.250:1900\\r\\nMAN: \"ssdp:discover\"\\r\\nMX: 2\\r\\nST: roku:ecp\\r\\n\\r\\n").getBytes(StandardCharsets.US_ASCII);
     DatagramPacket packet=new DatagramPacket(request,request.length,InetAddress.getByName("239.255.255.250"),1900);
     socket.send(packet);
     long until=System.currentTimeMillis()+4500;
     while(System.currentTimeMillis()<until){
      try{
       byte[] buf=new byte[8192];DatagramPacket reply=new DatagramPacket(buf,buf.length);socket.receive(reply);
       String headers=new String(reply.getData(),0,reply.getLength(),StandardCharsets.UTF_8);
       Matcher m=Pattern.compile("(?im)^LOCATION:\\s*(http://[^\\r\\n]+)").matcher(headers);
       if(m.find()){String location=m.group(1).trim();String host=location.replaceFirst("^http://","").replaceFirst("/.*$","");devices.put(host,location);}
      }catch(java.net.SocketTimeoutException timeout){continue;}
     }
    }
    for(Map.Entry<String,String> entry:devices.entrySet()){
     try{
      String info=httpGet(entry.getValue().replaceAll("/+$","")+"/query/device-info");
      String apps=httpGet(entry.getValue().replaceAll("/+$","")+"/query/apps");
      String name=xmlTag(info,"user-device-name");if(name.isEmpty())name=xmlTag(info,"friendly-device-name");if(name.isEmpty())name="Roku "+entry.getKey();
      String channelId="";Matcher app=Pattern.compile("(?is)<app\\b[^>]*id=\"([^\"]+)\"[^>]*>(.*?)</app>").matcher(apps);
      while(app.find()){if(app.group(2).trim().equalsIgnoreCase("SEBAS PLAY")||app.group(2).toUpperCase().contains("SEBAS PLAY")){channelId=app.group(1);break;}}
      JSONObject row=new JSONObject();row.put("ip",entry.getKey());row.put("name",name);row.put("channelId",channelId);row.put("sebasPlayInstalled",!channelId.isEmpty());found.put(row);
     }catch(Exception ignored){}
    }
    call.resolve(new JSONObject().put("devices",found));
   }catch(Exception e){call.reject("No se pudieron buscar dispositivos Roku en la red local: "+e.getMessage(),e);}
   finally{if(lock!=null&&lock.isHeld())lock.release();}
  });
 }
 @PluginMethod public void launch(PluginCall call){
  String ip=call.getString("ip"), id=call.getString("channelId");
  if(ip==null||id==null||ip.trim().isEmpty()||id.trim().isEmpty()){call.reject("No se encontró SEBAS PLAY instalado en ese Roku.");return;}
  worker.execute(()->{
   try{
    String path="http://"+ip+":8060/launch/"+URLEncoder.encode(id,"UTF-8");
    String contentId=call.getString("contentId","");String mediaType=call.getString("mediaType","");
    if(!contentId.isEmpty())path+="?contentId="+URLEncoder.encode(contentId,"UTF-8")+"&mediaType="+URLEncoder.encode(mediaType,"UTF-8");
    HttpURLConnection c=(HttpURLConnection)new URL(path).openConnection();c.setRequestMethod("POST");c.setConnectTimeout(4000);c.setReadTimeout(5000);int status=c.getResponseCode();c.disconnect();
    if(status>=200&&status<300)call.resolve(new JSONObject().put("launched",true));else call.reject("Roku respondió HTTP "+status+".");
   }catch(Exception e){call.reject("No se pudo abrir SEBAS PLAY en Roku: "+e.getMessage(),e);}
  });
 }
 private static String httpGet(String address)throws Exception{
  HttpURLConnection c=(HttpURLConnection)new URL(address).openConnection();c.setConnectTimeout(2500);c.setReadTimeout(2500);
  try(java.io.InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))>0)out.write(b,0,n);return out.toString("UTF-8");}finally{c.disconnect();}
 }
 private static String xmlTag(String xml,String tag){Matcher m=Pattern.compile("(?is)<"+tag+"[^>]*>(.*?)</"+tag+">").matcher(xml);return m.find()?m.group(1).replaceAll("<[^>]+>","").trim():"";}
}
`;
fs.writeFileSync(path.join(dir,"RokuDiscoveryPlugin.java"),java);
let manifest=fs.readFileSync(manifestPath,"utf8");
if(!manifest.includes("android.permission.ACCESS_WIFI_STATE"))manifest=manifest.replace("<manifest","<manifest\\n    xmlns:android=\"http://schemas.android.com/apk/res/android\"");
if(!manifest.includes("android.permission.INTERNET"))manifest=manifest.replace("<application","<uses-permission android:name=\"android.permission.INTERNET\" />\\n<uses-permission android:name=\"android.permission.ACCESS_WIFI_STATE\" />\\n<uses-permission android:name=\"android.permission.CHANGE_WIFI_MULTICAST_STATE\" />\\n<application");
fs.writeFileSync(manifestPath,manifest);
console.log("Plugin nativo de descubrimiento SSDP/ECP de Roku integrado.");
