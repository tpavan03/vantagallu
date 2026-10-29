import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
async function files(dir) { const entries = await readdir(dir, { withFileTypes: true }); const nested = await Promise.all(entries.map(entry => entry.isDirectory() ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`])); return nested.flat() }
const assets = (await files('dist')).filter(path => !path.endsWith('.map') && !path.endsWith('/sw.js')).map(path => path.replace(/^dist/, ''))
const version = createHash('sha256').update(await readFile('dist/index.html')).digest('hex').slice(0, 12)
await writeFile('dist/sw.js', `const CACHE='vantagallu-static-${version}';const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('vantagallu-static-')&&key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname==='/api')return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
if(ASSETS.includes(url.pathname))event.respondWith(caches.open(CACHE).then(cache=>cache.match(request)).then(cached=>cached||fetch(request)));});`)
console.log(`Offline shell prepared: ${assets.length} public files. Personal API responses are never cached.`)
