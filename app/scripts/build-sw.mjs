import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const files = readdirSync("dist", { recursive: true, withFileTypes: true })
  .filter((f) => f.isFile())
  .map((f) => (f.parentPath + "/" + f.name).replace(/^dist\//, ""))
  .filter((f) => f !== "sw.js")
  .sort();
const version = createHash("sha256");
for (const file of files) version.update(readFileSync("dist/" + file));
const cache = "ciby-" + version.digest("hex").slice(0, 12);
writeFileSync(
  "dist/sw.js",
  `const CACHE=${JSON.stringify(cache)};const FILES=${JSON.stringify(files.map((f) => "./" + f))};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('ciby-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request,{ignoreVary:true}).then(hit=>hit||fetch(e.request).catch(error=>{if(e.request.mode==='navigate')return caches.match(new URL('./index.html',self.registration.scope));throw error;})));});`,
);
console.log("Offline cache:", files.length, "files,", cache);
