const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

function validEntry(entry) {
  return typeof entry.path === 'string' && /^\/(assets|audio|media|catalogs|fonts|brand)\//.test(entry.path)
    && !entry.path.includes('..') && !entry.path.includes('\\')
    && /^[a-f0-9]{64}$/.test(entry.sha256) && Number.isSafeInteger(entry.size) && entry.size >= 0;
}
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000), cache: 'no-store' });
  if (!response.ok) throw new Error('Update download unavailable');
  return Buffer.from(await response.arrayBuffer());
}
async function savedRelease(root) {
  try {
    const id = (await fs.readFile(path.join(root, 'current'), 'utf8')).trim();
    if (!/^[a-f0-9]{64}$/.test(id)) return null;
    const dir = path.join(root, id);
    await fs.access(path.join(dir, 'index.html'));
    return dir;
  } catch { return null; }
}
async function syncRelease(root, origin) {
  const manifest = JSON.parse((await download(`${origin}/desktop-release.json`)).toString());
  if (!/^[a-f0-9]{64}$/.test(manifest.version) || !Array.isArray(manifest.files)) throw new Error('Invalid release');
  const previous = await savedRelease(root);
  if (previous && path.basename(previous) === manifest.version) return previous;
  const staging = path.join(root, `${manifest.version}.partial`);
  await fs.rm(staging, { recursive: true, force: true });
  await fs.mkdir(staging, { recursive: true });
  try {
    const queue = manifest.files.filter(validEntry);
    if (!queue.some((f) => f.path.startsWith('/assets/'))) throw new Error('Missing app assets');
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const entry = queue.shift();
        if (!entry) return;
        let bytes;
        if (previous) {
          try {
            const old = await fs.readFile(path.join(previous, entry.path.slice(1)));
            if (crypto.createHash('sha256').update(old).digest('hex') === entry.sha256) bytes = old;
          } catch {}
        }
        bytes ||= await download(`${origin}${entry.path}`);
        if (bytes.length !== entry.size || crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Release changed during download');
        const target = path.join(staging, entry.path.slice(1));
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, bytes);
      }
    }));
    const html = await download(`${origin}/`);
    const htmlText = html.toString();
    const assets = [...htmlText.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^"]*"/g)].map((m) => m[1]);
    for (const asset of assets) await fs.access(path.join(staging, asset.slice(1)));
    if (!assets.length) throw new Error('Missing release HTML');
    const latest = JSON.parse((await download(`${origin}/desktop-release.json`)).toString());
    if (latest.version !== manifest.version) throw new Error('Release changed');
    await fs.writeFile(path.join(staging, 'index.html'), html);
    const dest = path.join(root, manifest.version);
    await fs.rm(dest, { recursive: true, force: true });
    await fs.rename(staging, dest);
    await fs.writeFile(path.join(root, 'current.next'), manifest.version);
    await fs.rename(path.join(root, 'current.next'), path.join(root, 'current'));
    return dest;
  } catch (error) {
    await fs.rm(staging, { recursive: true, force: true });
    throw error;
  }
}
module.exports = { validEntry, savedRelease, syncRelease };