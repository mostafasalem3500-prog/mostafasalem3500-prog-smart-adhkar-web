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
async function load(){try{library=(await Promise.all([1,2,3,4].map(i=>fetch(`/adhkar-${i}.json`,{cache:'no-store'}).then(r=>r.json())))).flat()}catch{library=[]}}
function idFromCard(card){return card.querySelector('[data-fav]')?.dataset.fav||card.querySelector('[data-speak]')?.dataset.speak||''}
function trustFor(d){try{const h=new URL(d.sourceUrl||'',location.origin).hostname;return trustedHosts.get(h)||null}catch{return null}}
function disableAudio(){
 $$('[data-speak],#routineSpeak,#tasbeehSpeak').forEach(el=>el.remove());
 const audio=$('#sources .audio-card');
 if(audio){audio.innerHTML='<div><span class="v23-eyebrow">الصوت</span><h3>متوقف مؤقتًا</h3><p>تم إيقاف جميع خصائص النطق مؤقتًا إلى حين اعتماد حل صوت عربي أدق. لا يتم تشغيل TTS من المتصفح ولا Gemini في هذه النسخة.</p></div>';audio.classList.add('v23-audio-off')}
}
function decorateCards(){
 $$('.dhikr-card').forEach(card=>{
  const id=idFromCard(card),d=library.find(x=>x.id===id);if(!d)return;
  const old=card.querySelector('.v23-source-proof');if(old)old.remove();
  const trust=trustFor(d),isQuran=d.sourceKind==='quran'||!!quranMeta[id];
  card.classList.toggle('v23-quran',isQuran);
  const text=card.querySelector('.text');if(text)text.classList.toggle('v23-quran-text',isQuran);
  const proof=document.createElement('div');proof.className='v23-source-proof';
  if(isQuran){const m=quranMeta[id]||{};proof.innerHTML=`<div class="v23-proof-head"><span class="v23-trust v23-trust-quran">نص قرآني موثوق</span><span>${m.edition||'رواية حفص'}</span></div><strong>مجمع الملك فهد لطباعة المصحف الشريف</strong><small>${m.ref||d.sourceRef||''}</small>`}
  else if(trust){proof.innerHTML=`<div class="v23-proof-head"><span class="v23-trust">مصدر موثوق</span><span>${d.sourceKind==='hadith'?'حديث/ذكر':'مرجع رسمي'}</span></div><strong>${trust.label}</strong><small>${d.sourceRef||d.source||''}</small>`}
  else{proof.innerHTML='<div class="v23-proof-head"><span class="v23-trust v23-trust-review">قيد المراجعة</span></div><strong>يحتاج مراجعة مصدر قبل الاعتماد النهائي</strong>'}
  const actions=card.querySelector('.card-actions');(actions||card).insertAdjacentElement(actions?'beforebegin':'beforeend',proof);
  const sourceInline=card.querySelector('.source-inline');if(sourceInline)sourceInline.hidden=true;
  const sourceLink=card.querySelector('.card-actions a');if(sourceLink){sourceLink.textContent=isQuran?'فتح مرجع المجمع':'فتح المرجع';sourceLink.setAttribute('aria-label','فتح المصدر الموثوق')}
 })
}
function addTrustOverview(){const home=$('#home');if(!home||$('#v23Trust'))return;const s=document.createElement('section');s.id='v23Trust';s.className='v23-trust-overview';s.innerHTML=`<div class="v23-trust-title"><span>منهج المحتوى</span><h2>مصادر واضحة قبل أي إضافة</h2><p>القرآن من مجمع الملك فهد، والأذكار من حصن المسلم عبر رئاسة الشؤون الدينية، والمراجع الفقهية من المواقع الرسمية المعتمدة.</p></div><div class="v23-trust-grid"><article><b>01</b><strong>القرآن الكريم</strong><small>مجمع الملك فهد • رواية حفص</small></article><article><b>02</b><strong>حصن المسلم</strong><small>منصة رئاسة الشؤون الدينية</small></article><article><b>03</b><strong>مراجع رسمية</strong><small>الموقع الرسمي للشيخ ابن باز</small></article></div>`;home.querySelector('.hero')?.insertAdjacentElement('afterend',s)}
function addQuranNotice(){const sources=$('#sources');if(!sources||$('#v23QuranNotice'))return;const n=document.createElement('section');n.id='v23QuranNotice';n.className='v23-quran-notice';n.innerHTML='<span>الرسم القرآني</span><h2>مرجع الآيات: مجمع الملك فهد</h2><p>الآيات القرآنية داخل التطبيق مميزة بصريًا عن سائر الأذكار، ومرجعها منصة مطوري برمجيات القرآن الكريم التابعة للمجمع. تم اعتماد رواية حفص عن عاصم للمحتوى الحالي.</p><a href="https://qurancomplex.gov.sa/en/techquran/dev/" target="_blank" rel="noopener">فتح منصة المطورين الرسمية ↗</a>';sources.querySelector('.source-grid')?.insertAdjacentElement('beforebegin',n)}
function observe(){const mo=new MutationObserver(()=>{disableAudio();decorateCards()});mo.observe(document.body,{childList:true,subtree:true})}
async function init(){await load();document.body.classList.add('v23-identity');disableAudio();decorateCards();addTrustOverview();addQuranNotice();observe();document.documentElement.dataset.smartAdhkar='23'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();