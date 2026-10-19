package tech.tamkeen.offline;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.json.*;
public class ReleaseStoreTest {
  static void check(boolean condition,String message) { if(!condition) throw new AssertionError(message); }
  public static void main(String[] args) throws Exception {
    check(ReleaseStore.valid("/audio/ar-test.mp3"),"audio update");
    check(ReleaseStore.valid("/media/new-image.webp"),"image update");
    check(!ReleaseStore.valid("/server/secrets.js"),"server excluded");
    check(!ReleaseStore.valid("/assets/../private"),"traversal excluded");
    File root=Files.createTempDirectory("tamkeen-update-test").toFile();
    Map<String,byte[]> files=new HashMap<>();
    files.put("/assets/app.js","updated text".getBytes("UTF-8"));
    files.put("/audio/test.mp3",new byte[]{1,2,3});
    files.put("/media/new.webp",new byte[]{4,5,6});
    files.put("/","<html><script src=\"/assets/app.js\"></script></html>".getBytes("UTF-8"));
    JSONArray entries=new JSONArray(); for(String path:files.keySet()) if(!path.equals("/")) entries.put(new JSONObject().put("path",path).put("sha256",ReleaseStore.sha(files.get(path))).put("size",files.get(path).length));
    String version=ReleaseStore.sha("first release".getBytes("UTF-8"));
    files.put("/desktop-release.json",new JSONObject().put("version",version).put("files",entries).toString().getBytes("UTF-8"));
    File saved=ReleaseStore.sync(root,path->files.get(path));
    check(saved.equals(ReleaseStore.current(root)),"saved update survives restart");
    check(Arrays.equals(Files.readAllBytes(new File(saved,"media/new.webp").toPath()),new byte[]{4,5,6}),"image stored offline");
    check(Arrays.equals(Files.readAllBytes(new File(saved,"audio/test.mp3").toPath()),new byte[]{1,2,3}),"audio stored offline");
    String next=ReleaseStore.sha("next release".getBytes("UTF-8"));
    files.put("/desktop-release.json",new JSONObject().put("version",next).put("files",entries).toString().getBytes("UTF-8"));
    Files.delete(new File(saved,"assets/app.js").toPath()); files.put("/assets/app.js","corrupted".getBytes("UTF-8"));
    boolean failed=false; try { ReleaseStore.sync(root,path->files.get(path)); } catch(Exception e) { failed=true; }
    check(failed,"checksum rejects incomplete release");
    check(saved.equals(ReleaseStore.current(root)),"failed update retains current pointer");
    ReleaseStore.remove(root); System.out.println("PASS: offline media, restart persistence, checksum rejection, atomic fallback and safe paths");
  }
}