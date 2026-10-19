package tech.tamkeen.offline;

import java.io.*;
import java.nio.file.*;
import java.security.MessageDigest;
import org.json.*;

/** Public snapshots only. Never contains the TanStack server or credentials. */
public final class ReleaseStore {
  public interface Source { byte[] get(String path) throws Exception; }
  public static boolean valid(String path) {
    return path.matches("^/(assets|audio|media|catalogs|fonts|brand)/.+") && !path.contains("..") && !path.contains("\\") && !path.contains("%") && !path.endsWith(".map");
  }
  public static String sha(byte[] bytes) throws Exception {
    StringBuilder out = new StringBuilder();
    for (byte b : MessageDigest.getInstance("SHA-256").digest(bytes)) out.append(String.format("%02x", b & 255));
    return out.toString();
  }
  public static File current(File root) {
    try {
      String id = new String(Files.readAllBytes(new File(root,"current").toPath()),"UTF-8").trim();
      File folder = new File(root,id);
      return id.matches("[a-f0-9]{64}") && new File(folder,"index.html").isFile() ? folder : null;
    } catch(Exception e) { return null; }
  }
  public static void remove(File file) {
    File[] children = file.listFiles();
    if (children != null) for (File child : children) remove(child);
    file.delete();
  }
  public static File sync(File root, Source source) throws Exception {
    JSONObject manifest = new JSONObject(new String(source.get("/desktop-release.json"),"UTF-8"));
    String version = manifest.getString("version");
    if (!version.matches("[a-f0-9]{64}")) throw new IOException("Invalid release");
    File old = current(root);
    if (old != null && old.getName().equals(version)) return old;
    File staging = new File(root,version+".partial"); remove(staging); staging.mkdirs();
    try {
      JSONArray entries = manifest.getJSONArray("files"); boolean assets = false;
      java.util.Set<String> seen = new java.util.HashSet<>();
      for (int i=0;i<entries.length();i++) {
        JSONObject entry = entries.getJSONObject(i); String path = entry.getString("path");
        if (!valid(path)) continue;
        if (!seen.add(path)) throw new IOException("Duplicate file");
        String hash = entry.getString("sha256"); long size = entry.getLong("size");
        if (!hash.matches("[a-f0-9]{64}") || size < 0 || size > 50_000_000) throw new IOException("Invalid file");
        byte[] bytes = null;
        if (old != null) try { byte[] saved=Files.readAllBytes(new File(old,path.substring(1)).toPath()); if (sha(saved).equals(hash)) bytes=saved; } catch(Exception ignored) {}
        if (bytes == null) bytes=source.get(path);
        if (bytes.length != size || !sha(bytes).equals(hash)) throw new IOException("Incomplete update");
        File target = new File(staging,path.substring(1)); target.getParentFile().mkdirs(); Files.write(target.toPath(),bytes);
        assets |= path.startsWith("/assets/");
      }
      if (!assets) throw new IOException("Missing client");
      byte[] html=source.get("/"); String text=new String(html,"UTF-8");
      java.util.regex.Matcher refs=java.util.regex.Pattern.compile("(?:src|href)=\"(/assets/[^\"?#]+)").matcher(text); boolean referenced=false;
      while(refs.find()) { if (!new File(staging,refs.group(1).substring(1)).isFile()) throw new IOException("Missing HTML asset"); referenced=true; }
      if (!referenced) throw new IOException("Invalid HTML");
      if (!version.equals(new JSONObject(new String(source.get("/desktop-release.json"),"UTF-8")).getString("version"))) throw new IOException("Release changed");
      Files.write(new File(staging,"index.html").toPath(),html);
      File dest=new File(root,version); remove(dest); Files.move(staging.toPath(),dest.toPath(),StandardCopyOption.ATOMIC_MOVE);
      File pointer=new File(root,"current.next"); Files.write(pointer.toPath(),version.getBytes("UTF-8"));
      Files.move(pointer.toPath(),new File(root,"current").toPath(),StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING);
      return dest;
    } catch(Exception e) { remove(staging); throw e; }
  }
}