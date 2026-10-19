package tech.tamkeen.offline;

import android.app.*;
import android.os.*;
import android.webkit.*;
import android.view.*;
import android.widget.*;
import android.content.*;
import android.net.Uri;
import android.print.*;
import android.provider.MediaStore;
import android.util.Base64;
import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;
import fi.iki.elonen.NanoHTTPD;

public class MainActivity extends Activity {
  static final String CLOUD="https://markmuse-logo-garden.lovable.app";
  static final String VERIFY="64d9edb191fcc72a0f2036e0d7f8cab40791da1b07c4403a57bd93992139252f";
  static final String CONFIRM="cc0f31a04885643a70c861667ea5bd81a4ff310863649fbe0a60333d9655fdb3";
  static final String DEFAULT_HASH="a7a2ae458dfd820589f0af06418f27885ca30999f1d8fc429286c67c63b38be1";
  static final String OFFLINE="الإنترنت غير متوفر أو تعذر الاتصال؛ لم يتم الإرسال. اتصل بالشبكة ثم حاول مجدداً.";
  WebView web; LocalServer server; File active, releases; String origin; boolean syncing;
  final ScheduledExecutorService worker=Executors.newScheduledThreadPool(2);
  android.content.SharedPreferences prefs;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state); prefs=getSharedPreferences("tamkeen",MODE_PRIVATE); releases=new File(getFilesDir(),"releases");
    web=new WebView(this); setContentView(web); configure(web);
    worker.execute(() -> {
      try {
        active=ReleaseStore.current(releases);
        if (active==null) { active=new File(getFilesDir(),"bundled"); if (!new File(active,"index.html").isFile()) copyAssets("web",active); }
        int port=prefs.getInt("port",0);
        if (port==0) { try(ServerSocket socket=new ServerSocket(0,1,InetAddress.getByName("127.0.0.1"))) { port=socket.getLocalPort(); } prefs.edit().putInt("port",port).commit(); }
        origin="http://127.0.0.1:"+port; server=new LocalServer(port); server.start();
        runOnUiThread(() -> web.loadUrl(origin+"/")); checkUpdates(false);
        worker.scheduleWithFixedDelay(() -> checkUpdates(false),10,10,TimeUnit.MINUTES);
      } catch(Exception e) { runOnUiThread(() -> new AlertDialog.Builder(this).setMessage("تعذر فتح النسخة المحلية. أغلق التطبيق ثم حاول مجددًا.").setPositiveButton("إغلاق",(d,w)->finish()).show()); }
    });
  }
  void copyAssets(String path,File target) throws Exception {
    String[] children=getAssets().list(path);
    if (children!=null && children.length>0) { target.mkdirs(); for(String child:children) copyAssets(path+"/"+child,new File(target,child)); }
    else { target.getParentFile().mkdirs(); try(InputStream in=getAssets().open(path); OutputStream out=new FileOutputStream(target)) { byte[] buffer=new byte[65536]; int n; while((n=in.read(buffer))!=-1) out.write(buffer,0,n); } }
  }
  void configure(WebView view) {
    WebSettings s=view.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
    s.setAllowFileAccess(false); s.setAllowContentAccess(false); s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW); s.setSupportMultipleWindows(true); s.setJavaScriptCanOpenWindowsAutomatically(true);
    view.addJavascriptInterface(new Bridge(view),"TamkeenNative");
    view.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request) {
        String url=request.getUrl().toString();
        if (origin!=null && url.startsWith(origin+"/")) return false;
        if (url.equals("about:blank") || url.startsWith("blob:")) return false;
        external(url); return true;
      }
      @Override public void onPageFinished(WebView v,String url) { if (url.startsWith("http://127.0.0.1:") || url.equals("about:blank") || url.startsWith("blob:")) v.evaluateJavascript(bridgeScript(),null); }
    });
    view.setWebChromeClient(new WebChromeClient() {
      @Override public boolean onCreateWindow(WebView v,boolean dialog,boolean user,Message result) {
        WebView popup=new WebView(MainActivity.this); configure(popup);
        Dialog window=new Dialog(MainActivity.this); window.setContentView(popup); window.show(); window.getWindow().setLayout(-1,-1);
        window.setOnDismissListener(d -> popup.destroy());
        ((WebView.WebViewTransport)result.obj).setWebView(popup); result.sendToTarget(); return true;
      }
      @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result) { new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("حسنًا",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show(); return true; }
      @Override public boolean onShowFileChooser(WebView v,android.webkit.ValueCallback<Uri[]> callback,FileChooserParams params) { fileCallback=callback; try { startActivityForResult(params.createIntent(),42); } catch(Exception e) { callback.onReceiveValue(null); } return true; }
    });
    view.setDownloadListener((url,ua,disposition,mime,length) -> {
      if (url.startsWith("blob:")) view.evaluateJavascript("fetch("+JSONObject.quote(url)+").then(r=>r.blob()).then(b=>{let f=new FileReader();f.onload=()=>TamkeenNative.save(f.result,'application/pdf','TAMKEEN.pdf');f.readAsDataURL(b)})",null);
      else external(url);
    });
  }
  android.webkit.ValueCallback<Uri[]> fileCallback;
  @Override protected void onActivityResult(int request,int result,Intent data) { super.onActivityResult(request,result,data); if(request==42 && fileCallback!=null) { fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result,data)); fileCallback=null; } }
  String bridgeScript() { return "window.print=()=>TamkeenNative.print();if(!window.__tamkeenDownloads){window.__tamkeenDownloads=true;document.addEventListener('click',e=>{let button=e.target.closest('button');if(button&&button.textContent.includes('تحديث التطبيق')){e.preventDefault();e.stopImmediatePropagation();TamkeenNative.update();return}let a=e.target.closest('a[download]');if(a&&a.href.startsWith('blob:')){e.preventDefault();fetch(a.href).then(r=>r.blob()).then(b=>{let f=new FileReader();f.onload=()=>TamkeenNative.save(f.result,b.type,a.download||'TAMKEEN.pdf');f.readAsDataURL(b)})}},true)}"; }
  class Bridge {
    WebView target; Bridge(WebView v) { target=v; }
    @JavascriptInterface public void update() { worker.execute(() -> checkUpdates(true)); }
    @JavascriptInterface public void print() { runOnUiThread(() -> ((PrintManager)getSystemService(PRINT_SERVICE)).print("TAMKEEN",target.createPrintDocumentAdapter("TAMKEEN"),new PrintAttributes.Builder().build())); }
    @JavascriptInterface public void save(String data,String mime,String filename) {
      worker.execute(() -> { try {
        if (!data.startsWith("data:") || data.length()>55_000_000) throw new IOException();
        byte[] bytes=Base64.decode(data.substring(data.indexOf(',')+1),Base64.DEFAULT);
        ContentValues values=new ContentValues(); values.put(MediaStore.Downloads.DISPLAY_NAME,filename.replaceAll("[\\\\/]","_")); values.put(MediaStore.Downloads.MIME_TYPE,mime); values.put(MediaStore.Downloads.IS_PENDING,1);
        Uri uri=getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values); if(uri==null) throw new IOException();
        try(OutputStream out=getContentResolver().openOutputStream(uri)) { if(out==null) throw new IOException(); out.write(bytes); }
        values.clear(); values.put(MediaStore.Downloads.IS_PENDING,0); getContentResolver().update(uri,values,null,null); notice("تم حفظ الملف في التنزيلات.");
      } catch(Exception e) { notice("تعذر حفظ الملف."); } });
    }
  }
  void external(String url) { if(!url.matches("^(https?://|mailto:|tel:|whatsapp:).+")) return; try { startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url))); } catch(Exception e) { notice("لا يوجد تطبيق لفتح الرابط."); } }
  void notice(String text) { runOnUiThread(() -> Toast.makeText(this,text,Toast.LENGTH_LONG).show()); }
  @Override public boolean onCreateOptionsMenu(Menu menu) { menu.add("فحص التحديثات الآن").setShowAsAction(MenuItem.SHOW_AS_ACTION_NEVER); return true; }
  @Override public boolean onOptionsItemSelected(MenuItem item) { worker.execute(() -> checkUpdates(true)); return true; }
  @Override public void onBackPressed() { web.evaluateJavascript("history.back()",null); }
  @Override protected void onDestroy() { if(server!=null) server.stop(); worker.shutdownNow(); web.destroy(); super.onDestroy(); }
  synchronized void checkUpdates(boolean manual) {
    if(syncing) return; syncing=true;
    try {
      File saved=ReleaseStore.sync(releases,path -> request(path,"GET",null,null).checked());
      if(!saved.equals(active)) runOnUiThread(() -> new AlertDialog.Builder(this).setMessage("تم حفظ تحديث تمكين؛ سيعمل دون إنترنت.").setNegativeButton("لاحقًا",null).setPositiveButton("تطبيق الآن",(d,w)->{active=saved;web.loadUrl(origin+"/");}).show());
      else if(manual) notice("التطبيق محدث.");
    } catch(Exception e) { if(manual) notice("التحديث غير متوفر الآن؛ نسختك المحلية محفوظة."); }
    finally { syncing=false; }
  }
  static class Reply {
    int status; String type; byte[] body; Map<String,String> headers=new HashMap<>();
    byte[] checked() throws Exception { if(status<200 || status>=300) throw new IOException("Unavailable: "+status); return body; }
  }
  Reply request(String path,String method,byte[] body,Map<String,String> headers) throws Exception {
    if(!path.startsWith("/") || path.startsWith("//") || path.contains("\\")) throw new IOException();
    HttpURLConnection c=(HttpURLConnection)new URL(CLOUD+path).openConnection(); c.setConnectTimeout(5000); c.setReadTimeout(60000); c.setInstanceFollowRedirects(false); c.setRequestMethod(method);
    c.setRequestProperty("Origin",CLOUD); c.setRequestProperty("Referer",CLOUD+"/"); c.setRequestProperty("Accept","application/json"); c.setRequestProperty("Cache-Control","no-cache");
    if(headers!=null) for(String key:Arrays.asList("content-type","authorization","x-tsr-serverfn")) if(headers.containsKey(key)) c.setRequestProperty(key,headers.get(key));
    if(body!=null && !method.equals("GET") && !method.equals("HEAD")) { c.setDoOutput(true); try(OutputStream out=c.getOutputStream()) { out.write(body); } }
    Reply reply=new Reply(); reply.status=c.getResponseCode(); reply.type=c.getContentType();
    for(String name:Arrays.asList("x-tss-serialized","x-tss-raw-response")) if(c.getHeaderField(name)!=null) reply.headers.put(name,c.getHeaderField(name));
    InputStream in=reply.status>=400?c.getErrorStream():c.getInputStream(); ByteArrayOutputStream out=new ByteArrayOutputStream();
    if(in!=null) try(InputStream stream=in) { byte[] buffer=new byte[65536]; int n; while((n=stream.read(buffer))!=-1) { if(out.size()+n>50_000_000) throw new IOException("Oversize"); out.write(buffer,0,n); } }
    reply.body=out.toByteArray(); c.disconnect(); return reply;
  }
  boolean online() { try { return request("/robots.txt","HEAD",null,null).status==200; } catch(Exception e) { return false; } }
  static Object decode(Object value) throws Exception {
    if(!(value instanceof JSONObject)) return value;
    JSONObject node=(JSONObject)value;
    if(node.opt("t") instanceof JSONObject) return decode(node.get("t"));
    int type=node.optInt("t",-1);
    if(type==1) return node.optString("s"); if(type==2) return node.optInt("s")==2;
    if(type==10) { JSONObject out=new JSONObject(); JSONObject props=node.getJSONObject("p"); JSONArray keys=props.getJSONArray("k"), values=props.getJSONArray("v"); for(int i=0;i<keys.length();i++) out.put(keys.getString(i),decode(values.get(i))); return out; }
    return node;
  }
  class LocalServer extends NanoHTTPD {
    LocalServer(int port) { super("127.0.0.1",port); }
    @Override public Response serve(IHTTPSession session) {
      try {
        String host=session.getHeaders().get("host"); if(host==null || !host.equals(origin.substring(7))) return json(403,"{}");
        String path=session.getUri();
        if(path.equals("/desktop-online")) return json(online()?204:503,"{}");
        if(path.startsWith("/_serverFn") || path.startsWith("/api/")) {
          String from=session.getHeaders().get("origin"); if(from!=null && !from.equals(origin)) return json(403,"{}");
          Map<String,String> parsed=new HashMap<>(); session.parseBody(parsed); byte[] body=parsed.getOrDefault("postData","").getBytes("UTF-8");
          JSONObject data=new JSONObject(); try { JSONObject decoded=(JSONObject)decode(new JSONObject(new String(body,"UTF-8"))); data=decoded.optJSONObject("data"); if(data==null) data=new JSONObject(); } catch(Exception ignored) {}
          boolean verify=path.equals("/_serverFn/"+VERIFY); boolean confirm=path.equals("/_serverFn/"+CONFIRM);
          String password=data.optString(verify?"password":"newPassword","");
          if(!online()) {
            if(verify) { String expected=prefs.getString("adminHash",DEFAULT_HASH); boolean ok=java.security.MessageDigest.isEqual(ReleaseStore.sha(password.getBytes("UTF-8")).getBytes("UTF-8"),expected.getBytes("UTF-8")); return json(200,"{\"result\":{\"ok\":"+ok+"},\"context\":{}}"); }
            return json(503,new JSONObject().put("error",OFFLINE).toString());
          }
          String query=session.getQueryParameterString(); Reply upstream=request(path+(query==null?"":"?"+query),session.getMethod().name(),body,session.getHeaders());
          if((verify||confirm) && upstream.status==200) try { JSONObject decoded=(JSONObject)decode(new JSONObject(new String(upstream.body,"UTF-8"))); if(decoded.optJSONObject("result")!=null && decoded.getJSONObject("result").optBoolean("ok")) prefs.edit().putString("adminHash",ReleaseStore.sha(password.getBytes("UTF-8"))).commit(); } catch(Exception ignored) {}
          Response result=newFixedLengthResponse(Response.Status.lookup(upstream.status),upstream.type==null?"application/json":upstream.type,new ByteArrayInputStream(upstream.body),upstream.body.length); for(Map.Entry<String,String> header:upstream.headers.entrySet()) result.addHeader(header.getKey(),header.getValue()); return result;
        }
        if(session.getMethod()!=Method.GET && session.getMethod()!=Method.HEAD) return json(405,"{}");
        File root=active, file=new File(root,path.equals("/")?"index.html":path.substring(1));
        if(!file.getCanonicalPath().startsWith(root.getCanonicalPath()+File.separator)) return json(403,"{}");
        if(!file.isFile()) { if(path.contains(".")) return json(404,"{}"); file=new File(root,"index.html"); }
        String mime=getMimeTypeForFile(file.getName()); if(file.getName().endsWith(".js")) mime="text/javascript"; if(file.getName().endsWith(".webp")) mime="image/webp"; if(file.getName().endsWith(".woff2")) mime="font/woff2";
        Response response;
        if(file.getName().equals("index.html")) { String html=new String(Files.readAllBytes(file.toPath()),"UTF-8").replace("<head>","<head><script>"+bridgeScript()+"</script>"); response=newFixedLengthResponse(Response.Status.OK,"text/html; charset=utf-8",html); }
        else response=newFixedLengthResponse(Response.Status.OK,mime,new FileInputStream(file),file.length());
        response.addHeader("Cache-Control","no-store"); return response;
      } catch(Exception e) { return json(503,"{\"error\":\"تعذر الاتصال\"}"); }
    }
    Response json(int code,String text) { Response r=newFixedLengthResponse(Response.Status.lookup(code),"application/json; charset=utf-8",text); r.addHeader("Cache-Control","no-store"); return r; }
  }
}