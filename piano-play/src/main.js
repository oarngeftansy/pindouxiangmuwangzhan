import { builtinSongs } from './catalog.js';
import { castleChart } from './castle-chart.js';
import { juebieshuChart } from './juebieshu-chart.js';
import { riverChart } from './river-chart.js';
import { summerChart } from './summer-chart.js';
import { createRhythmGame } from './rhythm.js';

const WHITE_KEYS='ABCDEFGHIJKLMNOPQRSTUVWX'.split('');
const WHITE_NOTES=[];for(const o of [3,4,5])for(const n of ['C','D','E','F','G','A','B'])WHITE_NOTES.push(n+o);WHITE_NOTES.push('C6','D6','E6');
const BLACK_NOTES=['C#3','D#3','F#3','G#3','A#3','C#4','D#4','F#4','G#4','A#4','C#5','D#5','F#5','G#5','A#5','C#6','D#6'];
const BLACK_KEYS=['1','2','3','4','5','6','7','8','9','0','-','=','[',']',';','\'','/'];
// Extra high register F6-C#7. Shift combos keep exact pitch instead of folding notes down an octave.
WHITE_NOTES.push('F6','G6','A6','B6','C7'); WHITE_KEYS.push('⇧A','⇧D','⇧G','⇧J','⇧K');
BLACK_NOTES.push('F#6','G#6','A#6','C#7'); BLACK_KEYS.push('⇧S','⇧F','⇧H','⇧L');
const keyToNote={};WHITE_KEYS.forEach((k,i)=>keyToNote[k]=WHITE_NOTES[i]);BLACK_KEYS.forEach((k,i)=>keyToNote[k]=BLACK_NOTES[i]);
const noteToKey=Object.fromEntries(Object.entries(keyToNote).map(([k,n])=>[n,k]));
const sampleRoots=['C3','D#3','F#3','A3','C4','D#4','F#4','A4','C5','D#5','F#5','A5','C6','D#6','F#6','A6','C7'];
const sampleName=n=>n.replace('#','s')+'.mp3';
let audioCtx=null,buffers={},audioReady=false;
const noteMidi=n=>{const m=n.match(/^([A-G])(#?)(\d)$/);if(!m)return 60;const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]?1:0);return 12*(+m[3]+1)+pc};
async function initAudio(){if(audioCtx){if(audioCtx.state==='suspended')await audioCtx.resume();return;} audioCtx=new (window.AudioContext||window.webkitAudioContext)(); const status=document.getElementById('audioStatus');try{const base='https://tonejs.github.io/audio/salamander/';await Promise.all(sampleRoots.map(async n=>{const r=await fetch(base+sampleName(n));if(!r.ok)throw new Error('sample');buffers[n]=await audioCtx.decodeAudioData(await r.arrayBuffer())}));audioReady=true;status.textContent='真实钢琴采样已就绪';}catch(e){status.textContent='钢琴采样加载失败，请检查网络';audioReady=false}}
function nearestSample(note){const m=noteMidi(note);return sampleRoots.reduce((a,b)=>Math.abs(noteMidi(a)-m)<=Math.abs(noteMidi(b)-m)?a:b)}
function playNote(note,duration=.9){initAudio().then(()=>{if(!audioReady)return;const root=nearestSample(note),src=audioCtx.createBufferSource(),g=audioCtx.createGain();src.buffer=buffers[root];src.playbackRate.value=Math.pow(2,(noteMidi(note)-noteMidi(root))/12);g.gain.setValueAtTime(.66,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+Math.max(.25,duration));src.connect(g).connect(audioCtx.destination);src.start();src.stop(audioCtx.currentTime+Math.max(.35,duration)+.05)})}

let songs=[...builtinSongs],current=songs.find(s=>s.id==='river-flows-in-you')||songs[0],category='全部',query='',step=0,mode='guide',demoTimer=null;
const STRUCTURE_REVIEW_IDS=new Set(['merry-christmas-mr-lawrence']);
function rebuildCastleFromCanonicalTimeline(){
  const song=songs.find(s=>s.id==='castle-in-the-sky'); if(!song)return;
  const barSec=(60/castleChart.bpm)*4, bars=new Map();
  castleChart.events.forEach((e,i)=>{
    const k=noteToKey[e.n]; if(!k)return;
    const next=castleChart.events[i+1];
    const gap=next?Math.max(.25,next.t-e.t):Math.max(.25,e.d||.5);
    const token={k,n:e.n,w:Math.max(.5,Math.min(6,gap/(60/castleChart.bpm)))};
    const bi=Math.max(0,Math.floor(e.t/barSec));
    if(!bars.has(bi))bars.set(bi,[]); bars.get(bi).push(token);
  });
  const measures=[...bars.keys()].sort((a,b)=>a-b).map(i=>bars.get(i));
  const sections=[]; for(let i=0;i<measures.length;i+=9)sections.push({name:`第 ${sections.length+1} 段`,measures:measures.slice(i,i+9)});
  song.sections=sections;song.fullLength=true;song.verified=true;song.midiReady=true;
  song.source=`完整主旋律 · 54 小节时间轴 · ${castleChart.events.length} 音`;
  song.description='基于完整节奏时间轴重建的主旋律跟练版；与音游模式共用同一结构。';
}
rebuildCastleFromCanonicalTimeline();
function rebuildJuebieFromStructuredTimeline(){
  const song=songs.find(s=>s.id==='juebieshu'); if(!song)return;
  const beat=.6, barSec=beat*4, bars=new Map();
  juebieshuChart.events.forEach((e,i)=>{
    const k=noteToKey[e.n]; if(!k)return;
    const next=juebieshuChart.events[i+1];
    const gap=next?Math.max(.18,next.t-e.t):Math.max(.18,e.d||.6);
    const token={k,n:e.n,w:Math.max(.5,Math.min(6,gap/beat))};
    const bi=Math.max(0,Math.floor(e.t/barSec));
    if(!bars.has(bi))bars.set(bi,[]); bars.get(bi).push(token);
  });
  const measures=[...bars.keys()].sort((a,b)=>a-b).map(i=>bars.get(i));
  const sections=[]; for(let i=0;i<measures.length;i+=16)sections.push({name:`第 ${sections.length+1} 段`,measures:measures.slice(i,i+16)});
  song.sections=sections;song.fullLength=false;song.verified=false;song.midiReady=true;
  song.source=`完整编配测试 · F调结构化时间轴 · ${juebieshuChart.events.length} 时间点`;
  song.description='邓垚《诀别书》完整时间轴转谱测试版；用于验证整曲结构，非官方原版钢琴谱。';
}
rebuildJuebieFromStructuredTimeline();
function rebuildFullRightHandTimeline(songId,chart,source,description,sectionSize=9){
  const song=songs.find(s=>s.id===songId); if(!song||!chart?.events?.length)return;
  const beatSec=60/(chart.tempo||90), byMeasure=new Map();
  chart.events.forEach((e,i)=>{
    const k=noteToKey[e.n]; if(!k)return;
    const next=chart.events[i+1];
    const gap=next?Math.max(.12,next.t-e.t):Math.max(.12,e.d||beatSec);
    const token={k,n:e.n,w:Math.max(.5,Math.min(6,gap/beatSec))};
    const m=Number(e.measure)||1;
    if(!byMeasure.has(m))byMeasure.set(m,[]);
    byMeasure.get(m).push(token);
  });
  const measures=[...byMeasure.keys()].sort((a,b)=>a-b).map(m=>byMeasure.get(m)).filter(x=>x.length);
  const sections=[]; for(let i=0;i<measures.length;i+=sectionSize)sections.push({name:`第 ${sections.length+1} 段`,measures:measures.slice(i,i+sectionSize)});
  song.sections=sections;song.fullLength=true;song.verified=true;song.midiReady=true;song.source=source;song.description=description;
}
rebuildFullRightHandTimeline(
  'river-flows-in-you',
  riverChart,
  `完整右手单音化 · MusicXML ${riverChart.measureCount} 小节 · ${riverChart.events.length} 音`,
  '基于完整钢琴 MusicXML 的右手声部重建；和弦取最高音以适配单键跟练，保留整曲结构。',
  8
);
rebuildFullRightHandTimeline(
  'kikujiro-summer',
  summerChart,
  `完整右手单音化 · MusicXML ${summerChart.measureCount} 小节 · ${summerChart.events.length} 音`,
  '基于 1–54 小节完整 MusicXML 右手 Voice 1 重建；和弦单音化以适配跟练。',
  9
);
let songEntries=[],sectionStarts=[],rhythmGame=null;
const $=id=>document.getElementById(id);
const appRoot=document.querySelector('.app');
const isCastleSong=s=>!!s&&String(s.title||'').includes('天空之城');
function ensureRhythmGame(){
  if(rhythmGame)return rhythmGame;
  rhythmGame=createRhythmGame({
    root:$('rhythmShell'),
    chart:castleChart,
    playNote,
    onProgress:(pct,t)=>{
      $('progress').textContent=`${Math.max(0,Math.floor(t))}s / ${Math.floor(castleChart.duration)}s`;
      $('progressText').textContent=`音游 · ${Math.round(Math.max(0,pct)*100)}%`;
    },
    onModeMessage:msg=>{$('audioStatus').textContent=msg}
  });
  return rhythmGame;
}
function categories(){return ['全部',...new Set(songs.map(s=>s.category))]}
function filtered(){return songs.filter(s=>(category==='全部'||s.category===category)&&(!query||(s.title+s.composer).toLowerCase().includes(query.toLowerCase())))}
function renderCats(){$('cats').innerHTML=categories().map(c=>`<button class="cat ${c===category?'active':''}" data-cat="${c}">${c}</button>`).join('');document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCats();renderSongList()})}
function songBadge(s){
  if(STRUCTURE_REVIEW_IDS.has(s.id))return '<span class="badge pending">结构复核</span>';
  if(s.id==='castle-in-the-sky')return '<span class="badge simple">完整主旋律</span>';
  if(s.id==='river-flows-in-you'||s.id==='kikujiro-summer')return '<span class="badge simple">完整右手</span>';
  if(s.id==='juebieshu')return '<span class="badge simple">编配测试版</span>';
  if(s.id==='mariage-damour')return '<span class="badge simple">完整右手轨</span>';
  return s.fullLength?'<span class="badge full">完整版</span>':s.verified?'<span class="badge verified">已校谱</span>':s.midiReady?'<span class="badge simple">主旋律版</span>':'<span class="badge pending">待校谱</span>';
}
function renderSongList(){const list=filtered();$('songCount').textContent=`(${songs.length})`;$('songList').innerHTML=list.map(s=>`<div class="song ${s.id===current.id?'active':''}" data-song="${s.id}"><div class="song-title"><span>${escapeHtml(s.title)}</span>${songBadge(s)}</div><div class="song-meta">${escapeHtml(s.category)} · ${'★'.repeat(s.difficulty)}${'☆'.repeat(3-s.difficulty)}</div></div>`).join('')||'<div class="empty">没有匹配曲谱</div>';document.querySelectorAll('[data-song]').forEach(el=>el.onclick=()=>selectSong(el.dataset.song))}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function stopDemo(){if(demoTimer){clearTimeout(demoTimer);demoTimer=null}}
function selectSong(id){
  stopDemo();
  const next=songs.find(s=>s.id===id)||current;
  if(mode==='rhythm'&&!isCastleSong(next))setMode('guide');
  current=next;step=0;renderSongList();renderSong();
}
function tokKey(x){return typeof x==='string'?x:(x&&x.k)||''}
function tokNote(x){const k=tokKey(x);return typeof x==='object'&&x.n?x.n:(keyToNote[k]||'')}
function tokWeight(x){return typeof x==='object'&&x.w?Math.max(.5,Math.min(6,x.w)):1}
function formatKey(k=''){return k.startsWith('⇧')?'Shift + '+k.slice(1):k}
function rebuildSongCache(){songEntries=[];sectionStarts=[];let idx=0;(current.sections||[]).forEach((sec,si)=>{sectionStarts.push({sectionIndex:si,start:idx,name:sec.name||`第 ${si+1} 段`});(sec.measures||[]).forEach((m,mi)=>m.forEach(x=>{const k=tokKey(x);if(k==='·'||!k)return;songEntries.push({token:x,key:k,note:tokNote(x),weight:tokWeight(x),sectionIndex:si,measureIndex:mi,index:idx++})}))})}
function clearTargetKey(){document.querySelectorAll('.white.target,.black.target').forEach(el=>el.classList.remove('target'))}
function updateTargetKey(k){clearTargetKey();if(!k||mode!=='guide')return;const el=document.querySelector(`[data-key="${CSS.escape(k)}"]`);if(el)el.classList.add('target')}
function renderSong(){$('title').textContent=current.title;$('composer').textContent=current.composer;$('desc').textContent=current.description;$('source').textContent=current.source||'';$('stars').textContent='★'.repeat(current.difficulty)+'☆'.repeat(3-current.difficulty);rebuildSongCache();const sel=$('sectionSelect');sel.innerHTML=`<option value="">完整乐谱 · ${current.sections?.length||0} 段</option>`+(current.sections||[]).map((s,i)=>`<option value="${i}">跳到 · ${escapeHtml(s.name||`第 ${i+1} 段`)}</option>`).join('');sel.disabled=!songEntries.length;sel.value='';renderScore()}
function scoreTokenHtml(x,idx){const k=tokKey(x);if(k==='·')return '<span class="note-token hold">·</span>';const n=tokNote(x),w=tokWeight(x),px=Math.round(27+Math.sqrt(w)*12);return `<span style="width:${px}px" class="note-token ${idx<step?'done':''} ${idx===step&&mode==='guide'?'current':''}" data-step="${idx}"><b>${escapeHtml(formatKey(k))}</b>${n?`<small>${escapeHtml(n)}</small>`:''}</span>`}
function renderScore(){const score=$('score');if(!songEntries.length){score.innerHTML=`<div class="empty"><div><b>${escapeHtml(current.title)}</b><br><br>这首曲目正在制作完整跟弹版本，当前暂未开放。<br>完成校谱后会由游戏版本统一更新。</div></div>`;$('expected').textContent='—';$('expectedNote').textContent='—';$('progress').textContent='0 / 0';$('progressText').textContent='';clearTargetKey();return}
 let noteCounter=0;
 score.innerHTML=(current.sections||[]).map((sec,si)=>`<section class="score-section" data-score-section="${si}"><div class="score-section-head"><span>${escapeHtml(sec.name||`第 ${si+1} 段`)}</span><small>${(sec.measures||[]).reduce((a,m)=>a+m.filter(x=>tokKey(x)!=='·').length,0)} 键</small></div><div class="score-section-body">${(sec.measures||[]).map((m,mi)=>`<div class="measure-row"><div class="measure" data-measure="${mi}">${m.map(x=>{if(tokKey(x)==='·')return scoreTokenHtml(x,-1);return scoreTokenHtml(x,noteCounter++)}).join('')}</div></div>`).join('')}</div></section>`).join('');
 syncScoreState(true)
}
function ensureCurrentVisible(force=false){const score=$('score'),cur=score.querySelector('.note-token.current');if(!cur)return;const sr=score.getBoundingClientRect(),r=cur.getBoundingClientRect();const outside=r.top<sr.top+42||r.bottom>sr.bottom-24;if(force||outside){score.scrollTo({top:score.scrollTop+(r.top-sr.top)-score.clientHeight*.42,behavior:force?'auto':'smooth'})}}
function syncScoreState(forceScroll=false){const total=songEntries.length,entry=songEntries[step];$('progress').textContent=`${Math.min(step,total)} / ${total}`;$('progressText').textContent=`${current.sections?.length||0} 段 · ${total} 个按键`;
 document.querySelectorAll('#score .note-token.current').forEach(el=>el.classList.remove('current'));
 if(mode==='guide'&&entry){const cur=$('score').querySelector(`[data-step="${step}"]`);if(cur)cur.classList.add('current')}
 const rawExpected=mode==='guide'&&entry?entry.key:'';$('expected').textContent=mode==='guide'?(entry?formatKey(entry.key):'完成 ✓'):'—';$('expectedNote').textContent=mode==='guide'?(entry?entry.note:'✓'):'—';updateTargetKey(rawExpected);if(mode==='guide'&&entry)ensureCurrentVisible(forceScroll)}
function setMode(m){
  stopDemo();
  if(m==='rhythm'){
    const castle=songs.find(isCastleSong);
    if(!castle)return;
    if(current!==castle){current=castle;step=0;renderSongList();renderSong()}
    mode='rhythm';
    appRoot.classList.add('rhythm-mode');
    $('guideMode').classList.remove('active');$('rhythmMode').classList.add('active');
    $('modeText').textContent='音游模式';
    document.querySelector('.kbd-help').textContent='固定六键 A S D / J K L · Perfect ±85ms · Good ±180ms';
    $('progress').textContent=`0s / ${Math.floor(castleChart.duration)}s`;
    $('progressText').textContent=`音游 · 0%`;
    $('audioStatus').textContent=`天空之城 · ${castleChart.bpm} BPM · 点击开始`;
    ensureRhythmGame().stop();
    syncScoreState(false);
    return;
  }
  if(rhythmGame)rhythmGame.stop();
  mode='guide';appRoot.classList.remove('rhythm-mode');
  $('guideMode').classList.add('active');$('rhythmMode').classList.remove('active');
  $('modeText').textContent='跟练模式';
  document.querySelector('.kbd-help').textContent='整首乐谱连续显示 · 按对自动前进 · 无时间限制';
  $('audioStatus').textContent=audioReady?'真实钢琴采样已就绪':'点击琴键后加载钢琴音色';
  syncScoreState(false);
}
function resetProgressClasses(){document.querySelectorAll('#score [data-step]').forEach(el=>{const idx=+el.dataset.step;el.classList.toggle('done',idx<step);el.classList.toggle('current',mode==='guide'&&idx===step)})}
function jumpToSection(si){const target=sectionStarts.find(x=>x.sectionIndex===si);if(!target)return;step=target.start;resetProgressClasses();syncScoreState(true);const sec=$('score').querySelector(`[data-score-section="${si}"]`);if(sec)$('score').scrollTo({top:Math.max(0,sec.offsetTop-8),behavior:'smooth'})}
function pianoKey(key,down=true){const el=document.querySelector(`[data-key="${CSS.escape(key)}"]`);if(el)el.classList.toggle('active',down)}
function handleKey(key){
  key=key.toUpperCase();
  if(mode==='rhythm'){
    const lane=castleChart.keys.indexOf(key);
    if(lane>=0)ensureRhythmGame().inputLane(lane);
    return;
  }
  if(!keyToNote[key])return;playNote(keyToNote[key]);pianoKey(key,true);setTimeout(()=>pianoKey(key,false),160);
  if(mode!=='guide'||!songEntries.length)return;
  const expected=songEntries[step]?.key;
  if(key===expected){const prev=$('score').querySelector(`[data-step="${step}"]`);if(prev){prev.classList.remove('current');prev.classList.add('done')}step++;syncScoreState(false)}
  else{const cur=$('score').querySelector('.note-token.current');if(cur){cur.classList.add('wrong');setTimeout(()=>cur.classList.remove('wrong'),420)}}
}
function renderPiano(){const p=$('piano');p.innerHTML='';WHITE_KEYS.forEach((k,i)=>{const el=document.createElement('button');el.className='white';el.dataset.key=k;const lab=k.startsWith('⇧')?'Shift +\n'+k.slice(1):k;el.innerHTML=`<span class="note-label">${WHITE_NOTES[i]}</span><span class="key-label ${k.startsWith('⇧')?'shifted':''}">${lab}</span>`;el.onpointerdown=()=>handleKey(k);p.appendChild(el)});requestAnimationFrame(()=>{const w=p.clientWidth/WHITE_KEYS.length;BLACK_NOTES.forEach((n,i)=>{const sem=noteMidi(n),belowMidi=sem-1;let wi=WHITE_NOTES.findIndex(x=>noteMidi(x)===belowMidi);if(wi<0)wi=WHITE_NOTES.findIndex(x=>noteMidi(x)===sem-2);if(wi<0)return;const key=BLACK_KEYS[i],b=document.createElement('button');b.className='black';b.dataset.key=key;b.style.left=((wi+1)*w-13)+'px';const lab=key.startsWith('⇧')?'Shift +\n'+key.slice(1):key;b.innerHTML=`<span class="note-label">${n}</span><span class="key-label ${key.startsWith('⇧')?'shifted':''}">${escapeHtml(lab)}</span>`;b.onpointerdown=e=>{e.stopPropagation();handleKey(key)};p.appendChild(b)})});requestAnimationFrame(()=>syncScoreState(false))}
function demo(){
  stopDemo();if(!songEntries.length||mode==='rhythm')return;let i=0;
  const tick=()=>{if(i>=songEntries.length){demoTimer=null;return}const e=songEntries[i++];playNote(e.note,Math.max(.3,e.weight*.22));pianoKey(e.key,true);setTimeout(()=>pianoKey(e.key,false),140);demoTimer=setTimeout(tick,Math.max(170,Math.min(900,e.weight*230)))};tick()
}
window.addEventListener('keydown',e=>{
  if(e.target.matches('input,textarea,select')||e.repeat)return;
  const base=e.key.length===1?e.key.toUpperCase():'';
  if(mode==='rhythm'){
    if(castleChart.keys.includes(base)){e.preventDefault();handleKey(base)}
    return;
  }
  const shifted=e.shiftKey&&'ASDFGHJKL'.includes(base)?'⇧'+base:'';
  const k=shifted&&keyToNote[shifted]?shifted:base;
  if(keyToNote[k]){e.preventDefault();handleKey(k)}
});
$('search').oninput=e=>{query=e.target.value;renderSongList()};
$('sectionSelect').onchange=e=>{if(e.target.value!=='')jumpToSection(+e.target.value);e.target.value=''};
$('restartBtn').onclick=()=>{stopDemo();if(mode==='rhythm'){ensureRhythmGame().start();return}step=0;resetProgressClasses();syncScoreState(true)};
$('demoBtn').onclick=demo;$('guideMode').onclick=()=>setMode('guide');$('rhythmMode').onclick=()=>setMode('rhythm');
renderPiano();renderCats();renderSongList();renderSong();document.body.addEventListener('pointerdown',()=>initAudio(),{once:true});
