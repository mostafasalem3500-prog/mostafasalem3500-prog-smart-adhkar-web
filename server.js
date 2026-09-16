const http=require('http');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
function json(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(obj));}
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,`http://${req.headers.host}`).pathname)}catch{return json(res,400,{ok:false,error:'bad_url'})}
 if(pathname==='/health')return json(res,200,{ok:true,service:'smart-adhkar-web',version:'2.3.0',audio:false,contentPolicy:'trusted-sources'});
 if(pathname.startsWith('/api/tts'))return json(res,503,{ok:false,error:'audio_temporarily_disabled'});
 if(pathname==='/')pathname='/index.html';
 const file=path.normalize(path.join(root,pathname));if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden')}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('Not found')}
  const ext=path.extname(file);res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':ext==='.html'||pathname==='/sw.js'?'no-cache':'public, max-age=3600'});
  if(pathname==='/index.html')return fs.readFile(file,'utf8',(e,html)=>{if(e)return res.end('');const css='<link rel="stylesheet" href="/v23.css">';const js='<script src="/v23.js" defer></script>';if(!html.includes('/v23.css'))html=html.replace('</head>',css+'</head>');if(!html.includes('/v23.js'))html=html.replace('</body>',js+'</body>');res.end(html)});
  fs.createReadStream(file).pipe(res);
 });
}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Smart Adhkar web v2.3.0 trusted-content running'));
