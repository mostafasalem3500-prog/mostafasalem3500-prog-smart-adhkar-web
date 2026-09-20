(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let library=[];
const trustedHosts=new Map([
 ['qurancomplex.gov.sa',{label:'مجمع الملك فهد لطباعة المصحف الشريف',kind:'quran'}],
 ['risala.prh.gov.sa',{label:'رئاسة الشؤون الدينية — حصن المسلم',kind:'book'}],
 ['binbaz.org.sa',{label:'الموقع الرسمي للشيخ ابن باز',kind:'official'}]
]);
const quranMeta={
 'morning-ayat-kursi':{ref:'سورة البقرة — الآية 255',edition:'رواية حفص عن عاصم'},
 'morning-ikhlas':{ref:'سورة الإخلاص — الآيات 1–4',edition:'رواية حفص عن عاصم'},
 'morning-falaq':{ref:'سورة الفلق — الآيات 1–5',edition:'رواية حفص عن عاصم'},
 'morning-nas':{ref:'سورة الناس — الآيات 1–6',edition:'رواية حفص عن عاصم'}
};
function safeHost(url){try{return new URL(url||'',location.origin).hostname}catch{return''}}
function trustFor(d){return trustedHosts.get(safeHost(d?.sourceUrl))||null}
function itemId(card){return card?.querySelector('[data-fav]')?.dataset.fav||''}
async function load(){try{library=(await Promise.all([1,2,3,4].map(i=>fetch('/adhkar-'+i+'.json',{cache:'no-store'}).then(r=>r.json())))).flat()}catch{library=[]}}
function removeAudio(){
 $$('[data-speak],#routineSpeak,#tasbeehSpeak').forEach(el=>el.remove());
 const a=$('#sources .audio-card');
 if(a){a.classList.add('v24-audio-off');a.innerHTML='<div><span class="v24-kicker">الصوت</span><h3>قيد التحسين والمراجعة</h3><p>خصائص الصوت موقوفة مؤقتًا حتى اعتماد قراءة عربية صحيحة ومصدر صوت موثوق. لا يعمل صوت المتصفح أو أي TTS في هذه النسخة.</p></div>'}
}
function sourceProof(d){
 const t=trustFor(d),q=d?.sourceKind==='quran'||quranMeta[d?.id];
 if(q){const m=quranMeta[d.id]||{};return '<div class="v24-proof quran"><span>قرآن كريم موثوق</span><strong>مجمع الملك فهد لطباعة المصحف الشريف</strong><small>'+(m.ref||d.sourceRef||'')+' • '+(m.edition||'رواية حفص عن عاصم')+'</small></div>'}
 if(t)return '<div class="v24-proof"><span>مصدر موثوق</span><strong>'+t.label+'</strong><small>'+(d.sourceRef||d.source||'')+'</small></div>';
 return '<div class="v24-proof review"><span>قيد المراجعة</span><strong>لن يُعتمد هذا النص نهائيًا قبل مراجعة المصدر</strong></div>'
}
function decorateCards(){
 $$('.dhikr-card').forEach(card=>{
  const d=library.find(x=>x.id===itemId(card));if(!d)return;
  card.querySelector('.v24-proof')?.remove();
  const isQuran=d.sourceKind==='quran'||!!quranMeta[d.id];
  card.classList.toggle('v24-quran',isQuran);
  card.querySelector('.text')?.classList.toggle('v24-quran-text',isQuran);
  card.querySelector('.source-inline')?.remove();
  const actions=card.querySelector('.card-actions');
  (actions||card).insertAdjacentHTML(actions?'beforebegin':'beforeend',sourceProof(d));
  const link=card.querySelector('.card-actions a');if(link){link.textContent=isQuran?'المصدر القرآني الرسمي ↗':'فتح المرجع ↗';link.classList.add('v24-source-link')}
 })}
function decorateRoutine(){
 const text=$('#routineText')?.textContent?.trim();if(!text)return;
 const d=library.find(x=>x.text===text);const card=$('#routine .focus-card');if(!card||!d)return;
 card.classList.toggle('v24-quran',d.sourceKind==='quran'||!!quranMeta[d.id]);
 $('#routineText')?.classList.toggle('v24-quran-text',d.sourceKind==='quran'||!!quranMeta[d.id]);
 let p=card.querySelector('.v24-routine-proof');if(!p){p=document.createElement('div');p.className='v24-routine-proof';card.appendChild(p)}
 p.innerHTML=sourceProof(d);
 const a=$('#routineSource');if(a)a.textContent=d.sourceKind==='quran'?'المصدر القرآني الرسمي ↗':'فتح المرجع ↗'
}
function readingControls(){
 if($('#v24Reading'))return;
 const top=$('.top-actions');if(!top)return;
 const b=document.createElement('button');b.id='v24Reading';b.className='icon-btn v24-reading-btn';b.type='button';b.title='وضع القراءة';b.setAttribute('aria-label','تبديل وضع القراءة');b.textContent='Aa';top.prepend(b);
 const apply=()=>{const on=localStorage.v24Reading==='1';document.body.classList.toggle('v24-reading',on);b.classList.toggle('active',on);b.title=on?'إيقاف وضع القراءة':'تشغيل وضع القراءة'};
 b.onclick=()=>{localStorage.v24Reading=localStorage.v24Reading==='1'?'0':'1';apply()};apply()
}
function libraryTools(){
 const filters=$('#library .filters');if(!filters||$('#v24ResultCount'))return;
 const bar=document.createElement('div');bar.className='v24-filter-meta';bar.innerHTML='<span id="v24ResultCount">—</span><div><button data-v24-source="all" class="active">كل المصادر</button><button data-v24-source="quran">القرآن</button><button data-v24-source="book">حصن المسلم</button><button data-v24-source="official">ابن باز</button></div>';filters.appendChild(bar);
 let mode='all';
 const apply=()=>{const cards=$$('#libraryCards .dhikr-card');let shown=0;cards.forEach(c=>{const d=library.find(x=>x.id===itemId(c));const t=trustFor(d);const kind=(d?.sourceKind==='quran'||quranMeta[d?.id])?'quran':t?.kind||'other';const ok=mode==='all'||kind===mode;c.classList.toggle('v24-source-hidden',!ok);if(ok)shown++});$('#v24ResultCount').textContent=shown+' ذكرًا ظاهرًا'};
 bar.querySelectorAll('[data-v24-source]').forEach(btn=>btn.onclick=()=>{mode=btn.dataset.v24Source;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===btn));apply()});
 const mo=new MutationObserver(apply);mo.observe($('#libraryCards'),{childList:true});setTimeout(apply,250)
}
function homeTrust(){
 if($('#v24Assurance'))return;const home=$('#home');if(!home)return;
 const s=document.createElement('section');s.id='v24Assurance';s.className='v24-assurance';s.innerHTML='<div><span class="v24-kicker">الثقة أولًا</span><h2>نص موثوق، مصدر واضح، وتجربة عربية هادئة</h2><p>النص القرآني مميز عن بقية الأذكار، وكل بطاقة تعرض مصدرها بوضوح قبل أي ميزة إضافية.</p></div><div class="v24-assurance-grid"><article><b>قرآن</b><strong>مجمع الملك فهد</strong><small>رواية حفص عن عاصم</small></article><article><b>أذكار</b><strong>حصن المسلم</strong><small>عبر رئاسة الشؤون الدينية</small></article><article><b>مراجع</b><strong>مصادر رسمية</strong><small>مثل موقع الشيخ ابن باز</small></article></div>';
 home.querySelector('.hero')?.insertAdjacentElement('afterend',s)
}
function tasbeehEnhance(){
 const tap=$('#tapCounter');if(!tap||$('#v24TasRing'))return;
 const ring=document.createElement('div');ring.id='v24TasRing';ring.className='v24-tas-ring';tap.parentNode.insertBefore(ring,tap);ring.appendChild(tap);
 const update=()=>{const c=Number($('#tasbeehCount')?.textContent||0),txt=$('#tasbeehRemaining')?.textContent||'',m=txt.match(/(\d+)/),r=m?Number(m[1]):0,g=Math.max(1,c+r),pct=Math.min(100,Math.round(c/g*100));ring.style.setProperty('--p',pct+'%');ring.dataset.progress=pct+'%';};
 tap.addEventListener('click',()=>{if(navigator.vibrate)navigator.vibrate(8);setTimeout(update,0)});new MutationObserver(update).observe($('#tasbeehCount'),{childList:true,subtree:true});update()
}
function a11y(){
 document.documentElement.style.setProperty('text-rendering','optimizeLegibility');
 $$('.heart').forEach(b=>{b.setAttribute('title','إضافة أو إزالة من المفضلة')});
}
function observe(){
 let t;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{removeAudio();decorateCards();decorateRoutine();a11y()},60)}).observe(document.body,{childList:true,subtree:true,characterData:true})
}
async function init(){await load();document.body.classList.add('v24-identity');removeAudio();decorateCards();decorateRoutine();readingControls();libraryTools();homeTrust();tasbeehEnhance();a11y();observe();document.documentElement.dataset.smartAdhkar='24'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()
})();