// Preview the exact exported frontend used by Tauri; never exposes filesystem save APIs.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('out');
const port = Number(process.env.PORT ?? 3002);
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.png':'image/png','.ico':'image/x-icon'};
http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url, 'http://localhost');
  const requested = path.resolve(root, '.'+decodeURIComponent(url.pathname));
  if (!requested.startsWith(root+path.sep) && requested !== root) { res.writeHead(403).end(); return; }
  let file;
  for (const candidate of [requested, requested+'.html', path.join(requested,'index.html')]) { try { if ((await fs.stat(candidate)).isFile()) { file=candidate; break; } } catch {} }
  if (!file) {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end(await fs.readFile(path.join(root,'404.html')));return;}
  const data=await fs.readFile(file);
  const headers={'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range??'');
  if(range){const start=Number(range[1]),end=Math.min(data.length-1,range[2]?Number(range[2]):data.length-1);if(start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`}).end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));return;}
  res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data);
 } catch {res.writeHead(500).end('Preview error');}
}).listen(port,'127.0.0.1',()=>process.stdout.write(`Preview: http://127.0.0.1:${port}\n`));
