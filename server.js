const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg'};
http.createServer((req,res)=>{
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if(pathname === '/health'){res.writeHead(200,{'content-type':'application/json'});return res.end(JSON.stringify({ok:true,service:'smart-adhkar-web',version:'1.4.1'}));}
  if(pathname === '/') pathname='/index.html';
  let file=path.normalize(path.join(root, pathname));
  if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('Not found');}
    const ext=path.extname(file);
    res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':ext==='.html'?'no-cache':'public, max-age=3600'});
    if(pathname==='/index.html'){
      fs.readFile(file,'utf8',(e,html)=>{
        if(e)return res.end('');
        const styles=['/v13.css','/v14.css'];
        styles.forEach(href=>{if(!html.includes(href))html=html.replace('</head>',`<link rel="stylesheet" href="${href}"></head>`)})
        const scripts=['/v12.js','/v13.js','/v14.js'];
        scripts.forEach(src=>{if(!html.includes(src))html=html.replace('</body>',`<script src="${src}"></script></body>`)})
        res.end(html);
      });
      return;
    }
    fs.createReadStream(file).pipe(res);
  });
}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Smart Adhkar web v1.4.1 running'));
