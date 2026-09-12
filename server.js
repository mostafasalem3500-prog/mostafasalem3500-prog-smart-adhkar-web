const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'public');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.wav':'audio/wav'};

function json(res,status,obj){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(obj));}
function readJson(req,limit=20000){return new Promise((resolve,reject)=>{let body='';req.on('data',c=>{body+=c;if(body.length>limit){reject(new Error('too_large'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(body||'{}'))}catch(e){reject(e)}});req.on('error',reject);});}
function pcmToWav(pcm,sampleRate=24000,channels=1,bits=16){const h=Buffer.alloc(44);const byteRate=sampleRate*channels*bits/8;const blockAlign=channels*bits/8;h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVE',8);h.write('fmt ',12);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(channels,22);h.writeUInt32LE(sampleRate,24);h.writeUInt32LE(byteRate,28);h.writeUInt16LE(blockAlign,32);h.writeUInt16LE(bits,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
async function generateGeminiTts(text,voice){const key=process.env.GEMINI_API_KEY;if(!key)throw Object.assign(new Error('not_configured'),{code:'NOT_CONFIGURED'});const model=process.env.GEMINI_TTS_MODEL||'gemini-3.1-flash-tts-preview';const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;const prompt=`Synthesize the following Arabic transcript exactly as written. Use clear, careful Modern Standard Arabic pronunciation, a calm respectful tone, natural pauses, and accurate articulation of fully-vocalized Arabic. Do not add, omit, translate, explain, or paraphrase any word.\n\n### TRANSCRIPT\n${text}`;const payload={contents:[{parts:[{text:prompt}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{languageCode:'ar-XA',voiceConfig:{prebuiltVoiceConfig:{voiceName:voice}}}}};let lastErr;for(let attempt=0;attempt<2;attempt++){try{const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':key},body:JSON.stringify(payload)});const data=await r.json();if(!r.ok)throw new Error(data?.error?.message||`Gemini ${r.status}`);const b64=data?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data)?.inlineData?.data;if(!b64)throw new Error('No audio returned');return pcmToWav(Buffer.from(b64,'base64'));}catch(e){lastErr=e;if(attempt===0)continue}}throw lastErr;}
async function handleTts(req,res){try{const body=await readJson(req);const text=String(body.text||'').trim();if(!text||text.length>4000)return json(res,400,{ok:false,error:'invalid_text'});const allowed=new Set(['Kore','Puck','Charon','Fenrir','Orus','Iapetus','Algieba','Algenib','Rasalgethi','Schedar','Alnilam','Achird','Sadaltager']);const voice=allowed.has(body.voice)?body.voice:(process.env.GEMINI_TTS_VOICE||'Kore');const wav=await generateGeminiTts(text,voice);res.writeHead(200,{'content-type':'audio/wav','content-length':wav.length,'cache-control':'private, max-age=86400'});res.end(wav);}catch(e){if(e.code==='NOT_CONFIGURED')return json(res,503,{ok:false,error:'gemini_tts_not_configured'});console.error('TTS error:',e.message);return json(res,502,{ok:false,error:'tts_failed'});}}

http.createServer(async(req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname)}catch{return json(res,400,{ok:false,error:'bad_url'})}
  if(pathname === '/health'){return json(res,200,{ok:true,service:'smart-adhkar-web',version:'2.2.0',tts:!!process.env.GEMINI_API_KEY});}
  if(pathname === '/api/tts' && req.method==='POST')return handleTts(req,res);
  if(pathname === '/') pathname='/index.html';
  let file=path.normalize(path.join(root, pathname));
  if(!file.startsWith(root)){res.writeHead(403);return res.end('Forbidden');}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404,{'content-type':'text/plain; charset=utf-8'});return res.end('Not found');}
    const ext=path.extname(file);
    res.writeHead(200,{'content-type':mime[ext]||'application/octet-stream','cache-control':ext==='.html'||pathname==='/sw.js'?'no-cache':'public, max-age=3600'});
    if(pathname==='/index.html'){
      fs.readFile(file,'utf8',(e,html)=>{
        if(e)return res.end('');
        const css='<link rel="stylesheet" href="/v22.css">';
        const js='<script src="/v22.js" defer></script>';
        if(!html.includes('/v22.css'))html=html.replace('</head>',css+'</head>');
        if(!html.includes('/v22.js'))html=html.replace('</body>',js+'</body>');
        res.end(html);
      });
      return;
    }
    fs.createReadStream(file).pipe(res);
  });
}).listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Smart Adhkar web v2.2.0 stable running'));
