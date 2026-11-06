import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { gzip } from "node:zlib";
import { promisify } from "node:util";

const root = fileURLToPath(new URL("../out/", import.meta.url));
const port = Number(process.env.PORT || 4173);
const compress = promisify(gzip);
const cache = new Map();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".json": "application/json", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method || '')) { res.writeHead(405); res.end(); return; }
  try {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://127.0.0.1").pathname);
    let filename = path.resolve(root, "." + pathname);
    if (filename !== path.resolve(root) && !filename.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, "index.html");
    let data = await fs.readFile(filename);
    const compressed = /\.(html|js|css|svg|json|txt)$/.test(filename) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (compressed) {
      const stat = await fs.stat(filename);
      const key = `${filename}:${stat.mtimeMs}`;
      if (!cache.has(key)) cache.set(key, await compress(data));
      data = cache.get(key);
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Content-Length": data.length, ...(compressed ? { "Content-Encoding": "gzip", "Vary": "Accept-Encoding" } : {}), "X-Content-Type-Options": "nosniff", "Cache-Control": pathname.startsWith("/_next/static/") ? "public, max-age=31536000, immutable" : "no-cache" });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); }
});
server.listen(port, "127.0.0.1", () => console.log(`Portfolio preview: http://127.0.0.1:${port}`));
