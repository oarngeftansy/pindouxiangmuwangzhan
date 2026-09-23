export const RHYTHM_KEYS=['A','S','D','J','K','L'];

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const midi=n=>{
  const m=String(n||'').match(/^([A-G])(#?)(\d)$/);
  if(!m)return 60;
  const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]?1:0);
  return 12*(Number(m[3])+1)+pc;
};

function sectionFingerprint(entries){
  return entries.map(e=>`${e.note||''}:${Math.round((e.weight||1)*4)/4}`).join('|');
}

export function removeAccidentalDuplicateSections(entries=[]){
  const groups=[];
  for(const e of entries){
    const key=Number.isFinite(e.sectionIndex)?e.sectionIndex:0;
    let g=groups[groups.length-1];
    if(!g||g.sectionIndex!==key){
      g={sectionIndex:key,entries:[]};
      groups.push(g);
    }
    g.entries.push(e);
  }
  const kept=[];
  let prev='';
  for(const g of groups){
    const fp=sectionFingerprint(g.entries);
    // Only remove a whole adjacent section when it is byte-for-byte equivalent
    // in pitch/rhythm shape. Repeated motifs inside a section are preserved.
    if(fp&&fp===prev&&g.entries.length>=8)continue;
    kept.push(...g.entries);
    prev=fp;
  }
  return kept;
}

export function buildRhythmChart(song,rawEntries=[]){
  const entries=removeAccidentalDuplicateSections(rawEntries).filter(e=>e&&e.note);
  const bpm=Number(song?.rhythmBpm)||({1:108,2:116,3:124}[song?.difficulty]||116);
  const beat=60/bpm;
  const midis=entries.map(e=>midi(e.note));
  const lo=Math.min(...midis,48),hi=Math.max(...midis,72);
  let t=1.15,lastLane=-1,run=0,lastSection=entries[0]?.sectionIndex,lastMeasure=entries[0]?.measureIndex;
  const events=[];

  entries.forEach((e,i)=>{
    if(i&&e.sectionIndex!==lastSection)t+=beat*.7;
    else if(i&&e.measureIndex!==lastMeasure)t+=beat*.12;

    const m=midi(e.note);
    let lane=hi===lo?3:Math.round((m-lo)/(hi-lo)*(RHYTHM_KEYS.length-1));
    lane=clamp(lane,0,RHYTHM_KEYS.length-1);
    if(lane===lastLane)run++; else run=1;
    if(run>=3){
      const dir=((i+e.sectionIndex)%2===0)?1:-1;
      lane=clamp(lane+dir,0,RHYTHM_KEYS.length-1);
      if(lane===lastLane)lane=clamp(lane-dir*2,0,RHYTHM_KEYS.length-1);
      run=1;
    }

    const w=clamp(Number(e.weight)||1,.5,4);
    const duration=clamp(w*beat*.66,.18,1.45);
    events.push({t:Number(t.toFixed(3)),d:Number(duration.toFixed(3)),l:lane,n:e.note});
    // Denser than the guide score: default 1-weight notes are about half a beat apart.
    t+=beat*clamp(w*.55,.45,1.15);
    lastLane=lane;lastSection=e.sectionIndex;lastMeasure=e.measureIndex;
  });

  return {
    id:song?.id||'generated',
    title:song?.title||'Rhythm Level',
    bpm,
    keys:RHYTHM_KEYS,
    duration:Number((t+1.25).toFixed(3)),
    events,
    generated:true
  };
}

export const juebieSong={
  id:'juebie-shu',
  title:'诀别书',
  composer:'邓垚',
  category:'现代钢琴',
  difficulty:2,
  description:'120 BPM 六键节奏试玩关卡。正式版目标为 CC0 MIDI；当前占位谱只用于测试玩法，不冒充原曲完整钢琴谱。',
  source:'音游试玩 · 120 BPM · 六键 · 等待 CC0 MIDI',
  sections:[],
  rhythmOnly:true,
  rhythmBpm:120
};

function makeJuebiePracticeChart(){
  const bpm=120,beat=60/bpm;
  const notes=['F4','A4','C5','D5','F5','A5'];
  const phrases=[
    [0,1,2,3,2,4,3,1],
    [1,2,4,5,4,3,2,0],
    [0,2,3,4,2,1,3,5],
    [2,1,0,3,4,5,3,2],
    [0,3,1,4,2,5,4,1],
    [2,4,3,5,1,3,0,2]
  ];
  const events=[];
  let t=1.0;
  phrases.forEach((p,pi)=>{
    p.forEach((lane,i)=>{
      const long=(i===3||i===7)&&(pi%2===1);
      events.push({
        t:Number(t.toFixed(3)),
        d:long?Number((beat*1.15).toFixed(3)):Number((beat*.42).toFixed(3)),
        l:lane,
        n:notes[lane]
      });
      t+=beat*(long?1.15:(i%3===0?.75:.5));
    });
    t+=beat*.45;
  });
  return {
    id:'juebie-shu',
    title:'诀别书',
    bpm,
    keys:RHYTHM_KEYS,
    duration:Number((t+1.4).toFixed(3)),
    events,
    preview:true
  };
}

export const juebiePreviewChart=makeJuebiePracticeChart();
