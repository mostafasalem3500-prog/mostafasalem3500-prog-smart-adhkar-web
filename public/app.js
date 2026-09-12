let adhkar=[];
let activeCategory='الكل';
let activeRoutine='morning';
let routineItems=[];
let routineIdx=0;
let routineCount=0;
let tasbeeh=Number(localStorage.tasbeeh||0);
let tasbeehGoal=Number(localStorage.tasbeehGoal||100);
let deferredInstallPrompt=null;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const todayKey=()=>new Date().toISOString().slice(0,10);
const favs=()=>new Set(JSON.parse(localStorage.favorites||'[]'));
const saveFavs=s=>localStorage.favorites=JSON.stringify([...s]);
const getJSON=(k,fallback)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(fallback))}catch{return fallback}};
const setJSON=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function toast(t){const el=$('#toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)}
function showView(id){$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));$$('[data-nav]').forEach(b=>b.classList.toggle('active',b.dataset.nav===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='routine')loadRoutine(activeRoutine);if(id==='favorites')renderFavorites();if(id==='stats')renderStats()}
function speak(text){if(!('speechSynthesis'in window))return toast('الاستماع غير مدعوم في هذا المتصفح');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ar-SA';u.rate=.78;speechSynthesis.speak(u)}
function renderCard(d){const f=favs().has(d.id);return `<article class="dhikr-card"><div class="card-top"><span class="pill">${d.category}</span><button class="heart ${f?'on':''}" data-fav="${d.id}" aria-label="المفضلة">${f?'♥':'♡'}</button></div><h3>${d.title}</h3><p class="text">${d.text}</p><div class="meta"><span>التكرار: ${d.target}</span>${d.timeHint?`<span>• ${d.timeHint}</span>`:''}</div><div class="card-actions"><button class="secondary" data-speak="${d.id}">🔊 استماع</button><a class="secondary" href="${d.sourceUrl||'#'}" target="_blank" rel="noopener">↗ المصدر</a></div></article>`}
function wireCards(){$$('[data-fav]').forEach(b=>b.onclick=()=>{const s=favs();s.has(b.dataset.fav)?s.delete(b.dataset.fav):s.add(b.dataset.fav);saveFavs(s);renderAll();renderFavorites();toast('تم تحديث المفضلة')});$$('[data-speak]').forEach(b=>b.onclick=()=>speak(adhkar.find(x=>x.id===b.dataset.speak)?.text||''))}
function renderLibrary(){let q=$('#search')?.value.trim().toLowerCase()||'';let data=adhkar.filter(d=>(activeCategory==='الكل'||d.category===activeCategory)&&(!q||[d.title,d.text,d.category,d.sourceName,(d.tags||[]).join(' ')].join(' ').toLowerCase().includes(q)));$('#libraryCards').innerHTML=data.map(renderCard).join('')||'<div class="empty-state">لا توجد نتائج مطابقة.</div>';wireCards()}
function renderFavorites(){const ids=favs();const data=adhkar.filter(d=>ids.has(d.id));$('#favoriteCards').innerHTML=data.map(renderCard).join('')||'<div class="empty-state"><strong>لا توجد أذكار في المفضلة بعد</strong><span>اضغط ♡ على أي ذكر لحفظه هنا.</span><button class="primary" data-go-temp="library">تصفح المكتبة</button></div>';wireCards();const go=$('[data-go-temp]');if(go)go.onclick=()=>showView('library')}
function renderAll(){if(!adhkar.length)return;$('#featured').innerHTML=adhkar.slice(0,4).map(renderCard).join('');$('#countAdhkar').textContent=adhkar.length;$('#countCats').textContent=new Set(adhkar.map(x=>x.category)).size;$('#favCount').textContent=favs().size;renderLibrary();renderFavorites();wireCards();updateToday()}
function initCategories(){const cats=['الكل',...new Set(adhkar.map(x=>x.category))];$('#categories').innerHTML=cats.map((c,i)=>`<button class="${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');$$('[data-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;$$('[data-cat]').forEach(x=>x.classList.toggle('active',x===b));renderLibrary()})}
function routineFor(type){if(type==='morning')return adhkar.filter(d=>(d.tags||[]).includes('الصباح')&&!d.id.startsWith('evening-'));if(type==='evening')return adhkar.filter(d=>(d.tags||[]).includes('المساء')&&!d.id.startsWith('morning-asbahna')&&!d.id.startsWith('morning-bika'));return adhkar.filter(d=>d.category==='أذكار بعد الصلاة')}
function loadRoutine(type){activeRoutine=type||activeRoutine;routineItems=routineFor(activeRoutine);const key='routine-'+activeRoutine;const saved=getJSON(key,{});routineIdx=Math.min(saved.idx||0,Math.max(0,routineItems.length-1));routineCount=saved.count||0;$('#routineTitle').textContent=activeRoutine==='morning'?'ورد الصباح':activeRoutine==='evening'?'ورد المساء':'أذكار بعد الصلاة';renderRoutine()}
function saveRoutine(){setJSON('routine-'+activeRoutine,{idx:routineIdx,count:routineCount,ts:Date.now()});updateToday()}
function renderRoutine(){const d=routineItems[routineIdx];if(!d)return;const total=routineItems.length;const pct=Math.round(((routineIdx+(routineCount/d.target))/total)*100);$('#routineIndex').textContent=`${routineIdx+1} / ${total}`;$('#routinePercent').textContent=`${Math.min(100,pct)}%`;$('#routineBar').style.width=`${Math.min(100,pct)}%`;$('#routineCategory').textContent=d.category;$('#routineItemTitle').textContent=d.title;$('#routineText').textContent=d.text;$('#routineCount').textContent=`${routineCount} / ${d.target}`;$('#routineSource').href=d.sourceUrl||'#'}
function registerRoutineCompletion(type){const day=todayKey();localStorage.setItem('completed-'+type,day);const history=getJSON('completionHistory',{});if(!history[day])history[day]=[];if(!history[day].includes(type))history[day].push(type);setJSON('completionHistory',history);localStorage.routineCompletionCount=String(Number(localStorage.routineCompletionCount||0)+1)}
function routineAdd(n){const d=routineItems[routineIdx];if(!d)return;routineCount=Math.max(0,Math.min(d.target,routineCount+n));if(n>0)incrementStat('dhikrTaps',1);if(routineCount>=d.target&&routineIdx<routineItems.length-1){routineIdx++;routineCount=0;toast('أحسنت، الذكر التالي')}else if(routineCount>=d.target&&routineIdx===routineItems.length-1){if(localStorage.getItem('completed-'+activeRoutine)!==todayKey())registerRoutineCompletion(activeRoutine);toast('تم الورد بحمد الله')}saveRoutine();renderRoutine();renderStats()}
function updateToday(){const day=todayKey();let done=['morning','evening','prayer'].filter(t=>localStorage.getItem('completed-'+t)===day).length;const pct=Math.round(done/3*100);$('#todayProgress').textContent=pct+'%';$('#todayDone').textContent=done?`اكتمل ${done} من 3 أوراد`:'ابدأ أول ورد'}
function incrementStat(key,n=1){localStorage[key]=String(Number(localStorage[key]||0)+n)}
function renderTasbeeh(){tasbeeh=Math.min(tasbeeh,tasbeehGoal);$('#tasbeehCount').textContent=tasbeeh;$('#tasbeehRemaining').textContent=`المتبقي ${Math.max(0,tasbeehGoal-tasbeeh)}`;$('#tasbeehBar').style.width=`${Math.min(100,tasbeeh/tasbeehGoal*100)}%`;localStorage.tasbeeh=String(tasbeeh);localStorage.tasbeehGoal=String(tasbeehGoal)}
function setGoal(g){if(!g||g<1||g>100000)return;tasbeehGoal=g;tasbeeh=0;$$('[data-goal]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.goal)===g));renderTasbeeh()}
function themeInit(){let t=localStorage.theme||'light';document.body.classList.toggle('dark',t==='dark');$('#themeBtn').textContent=t==='dark'?'☀':'☾'}
function streakCount(){const history=getJSON('completionHistory',{});let streak=0;const d=new Date();for(let i=0;i<365;i++){const key=d.toISOString().slice(0,10);if((history[key]||[]).length>0){streak++;d.setDate(d.getDate()-1)}else{if(i===0){d.setDate(d.getDate()-1);continue}break}}return streak}
function renderWeek(){const history=getJSON('completionHistory',{});const days=[];const fmt=new Intl.DateTimeFormat('ar-SA',{weekday:'short'});for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);const count=(history[key]||[]).length;days.push({label:fmt.format(d),count})}$('#weekBars').innerHTML=days.map(x=>`<div><i style="height:${Math.max(8,x.count/3*100)}%"></i><strong>${x.count}</strong><span>${x.label}</span></div>`).join('')}
function renderStats(){if(!$('#statRoutines'))return;$('#statRoutines').textContent=localStorage.routineCompletionCount||'0';$('#statTasbeeh').textContent=localStorage.tasbeehLifetime||'0';$('#statFavs').textContent=favs().size;$('#statStreak').textContent=streakCount();renderWeek()}
function backupPayload(){const keys=['favorites','theme','tasbeeh','tasbeehGoal','tasbeehLifetime','dhikrTaps','routineCompletionCount','completionHistory','routine-morning','routine-evening','routine-prayer','completed-morning','completed-evening','completed-prayer'];const data={version:1,app:'Smart Adhkar Web',exportedAt:new Date().toISOString(),storage:{}};keys.forEach(k=>{if(localStorage.getItem(k)!==null)data.storage[k]=localStorage.getItem(k)});return data}
function exportBackup(){const blob=new Blob([JSON.stringify(backupPayload(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`smart-adhkar-backup-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('تم إنشاء النسخة الاحتياطية')}
async function importBackupFile(file){try{const data=JSON.parse(await file.text());if(data?.app!=='Smart Adhkar Web'||!data.storage)throw new Error('bad');if(!confirm('سيتم استبدال بيانات سمارت أذكار المحلية بهذه النسخة. هل تريد المتابعة؟'))return;Object.entries(data.storage).forEach(([k,v])=>localStorage.setItem(k,String(v)));toast('تمت الاستعادة بنجاح');setTimeout(()=>location.reload(),500)}catch{toast('ملف النسخة الاحتياطية غير صالح')}}
function setupInstall(){const btns=[$('#installBtn'),$('#homeInstall')].filter(Boolean);const applyVisibility=show=>btns.forEach(b=>{if(b.id==='installBtn')b.hidden=!show;b.classList.toggle('install-ready',show)});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;applyVisibility(true)});window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;applyVisibility(false);toast('تم تثبيت سمارت أذكار')});btns.forEach(b=>b.onclick=async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;applyVisibility(false)}else toast('من قائمة المتصفح اختر: إضافة إلى الشاشة الرئيسية')})}
async function init(){const parts=await Promise.all([1,2,3,4].map(i=>fetch(`/adhkar-${i}.json`).then(r=>r.json())));adhkar=parts.flat();initCategories();renderAll();themeInit();renderTasbeeh();loadRoutine('morning');renderStats();setupInstall();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{})}

$$('[data-nav]').forEach(b=>b.onclick=()=>showView(b.dataset.nav));
$$('[data-go]').forEach(b=>b.onclick=()=>{if(b.dataset.routine)activeRoutine=b.dataset.routine;showView(b.dataset.go)});
$('#search').oninput=renderLibrary;
$('#themeBtn').onclick=()=>{const dark=!document.body.classList.contains('dark');localStorage.theme=dark?'dark':'light';themeInit()};
$('#routinePlus').onclick=()=>routineAdd(1);
$('#routineMinus').onclick=()=>routineAdd(-1);
$('#routineNext').onclick=()=>{if(routineIdx<routineItems.length-1){routineIdx++;routineCount=0;saveRoutine();renderRoutine()}};
$('#routinePrev').onclick=()=>{if(routineIdx>0){routineIdx--;routineCount=0;saveRoutine();renderRoutine()}};
$('#routineReset').onclick=()=>{if(confirm('إعادة هذا الورد من البداية؟')){routineIdx=0;routineCount=0;localStorage.removeItem('completed-'+activeRoutine);saveRoutine();renderRoutine()}};
$('#routineSpeak').onclick=()=>speak(routineItems[routineIdx]?.text||'');
$$('[data-goal]').forEach(b=>b.onclick=()=>setGoal(Number(b.dataset.goal)));
$('#customGoal').onchange=e=>setGoal(Number(e.target.value));
$('#tapCounter').onclick=()=>{if(tasbeeh<tasbeehGoal){tasbeeh++;incrementStat('tasbeehLifetime',1);if(navigator.vibrate)navigator.vibrate(tasbeeh===tasbeehGoal?80:12);renderTasbeeh();renderStats();if(tasbeeh===tasbeehGoal)toast('تم الهدف بحمد الله')}};
$('#tasbeehReset').onclick=()=>{tasbeeh=0;renderTasbeeh()};
$('#tasbeehMinus').onclick=()=>{tasbeeh=Math.max(0,tasbeeh-1);renderTasbeeh()};
$('#exportBackup').onclick=exportBackup;
$('#statsExport').onclick=exportBackup;
$('#importBackup').onchange=e=>{const f=e.target.files?.[0];if(f)importBackupFile(f)};
init();
