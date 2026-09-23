const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteName=m=>NOTE_NAMES[((m%12)+12)%12]+(Math.floor(m/12)-1);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

function readVlq(data,state){
  let v=0,b=0,count=0;
  do{
    if(state.i>=data.length)throw new Error('Unexpected end of MIDI');
    b=data[state.i++];v=(v<<7)|(b&0x7f);count++;
  }while((b&0x80)&&count<5);
  return v;
}
function u16(d,i){return (d[i]<<8)|d[i+1]}
function u32(d,i){return ((d[i]<<24)>>>0)+(d[i+1]<<16)+(d[i+2]<<8)+d[i+3]}
function text(d,a,b){return new TextDecoder('latin1').decode(d.slice(a,b))}

function parseTrack(data,start,end,index){
  const st={i:start},notes=[],tempos=[],active=new Map();
  let tick=0,running=0,name='';
  const pushActive=(ch,n,velocity)=>{
    const k=ch+':'+n;
    const arr=active.get(k)||[];
    arr.push({tick,velocity});
    active.set(k,arr);
  };
  const popActive=(ch,n)=>{
    const k=ch+':'+n,arr=active.get(k);
    if(!arr?.length)return;
    const on=arr.shift();
    if(!arr.length)active.delete(k);
    notes.push({midi:n,startTick:on.tick,endTick:Math.max(on.tick+1,tick),velocity:on.velocity,channel:ch});
  };
  while(st.i<end){
    tick+=readVlq(data,st);
    let status=data[st.i++];
    if(status<0x80){st.i--;status=running}else running=status;
    if(status===0xff){
      const type=data[st.i++],len=readVlq(data,st),a=st.i,b=Math.min(end,st.i+len);
      if(type===0x51&&len===3){
        tempos.push({tick,mpqn:(data[a]<<16)|(data[a+1]<<8)|data[a+2]});
      }else if(type===0x03){
        name=text(data,a,b);
      }
      st.i=b;running=0;continue;
    }
    if(status===0xf0||status===0xf7){const len=readVlq(data,st);st.i+=len;running=0;continue}
    const type=status&0xf0,ch=status&0x0f;
    if(type===0xc0||type===0xd0){st.i+=1;continue}
    const a=data[st.i++],b=data[st.i++];
    if(type===0x90){
      if(b===0)popActive(ch,a);else pushActive(ch,a,b);
    }else if(type===0x80)popActive(ch,a);
  }
  for(const [k,arr] of active){
    const [ch,n]=k.split(':').map(Number);
    for(const on of arr)notes.push({midi:n,startTick:on.tick,endTick:Math.max(on.tick+1,tick),velocity:on.velocity,channel:ch});
  }
  return {index,name,notes,tempos,endTick:tick};
}

export function parseMidi(arrayBuffer){
  const d=new Uint8Array(arrayBuffer);
  if(text(d,0,4)!=='MThd')throw new Error('不是标准 MIDI 文件');
  const headerLen=u32(d,4),format=u16(d,8),trackCount=u16(d,10),division=u16(d,12);
  if(division&0x8000)throw new Error('暂不支持 SMPTE 时间格式 MIDI');
  let p=8+headerLen;
  const tracks=[],tempos=[];
  for(let ti=0;ti<trackCount&&p+8<=d.length;ti++){
    if(text(d,p,p+4)!=='MTrk')throw new Error('MIDI track chunk 损坏');
    const len=u32(d,p+4),start=p+8,end=Math.min(d.length,start+len);
    const tr=parseTrack(d,start,end,ti);tracks.push(tr);tempos.push(...tr.tempos);p=end;
  }
  tempos.sort((a,b)=>a.tick-b.tick);
  if(!tempos.length||tempos[0].tick!==0)tempos.unshift({tick:0,mpqn:500000});
  const merged=[];
  for(const t of tempos){
    if(merged.length&&merged[merged.length-1].tick===t.tick)merged[merged.length-1]=t;
    else merged.push(t);
  }
  let sec=0,lastTick=0,lastMpqn=merged[0].mpqn;
  for(let i=0;i<merged.length;i++){
    const t=merged[i];
    sec+=(t.tick-lastTick)*lastMpqn/division/1e6;
    t.sec=sec;lastTick=t.tick;lastMpqn=t.mpqn;
  }
  const tickToSec=tick=>{
    let lo=0,hi=merged.length-1;
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(merged[mid].tick<=tick)lo=mid;else hi=mid-1}
    const x=merged[lo];
    return x.sec+(tick-x.tick)*x.mpqn/division/1e6;
  };
  tracks.forEach(tr=>tr.notes.forEach(n=>{
    n.t=tickToSec(n.startTick);n.d=Math.max(.04,tickToSec(n.endTick)-n.t);n.name=noteName(n.midi);
  }));
  return {format,division,tracks,tempos:merged,tickToSec};
}

function chooseMelodyTrack(parsed){
  const candidates=parsed.tracks.filter(t=>t.notes.length>=16);
  if(!candidates.length)throw new Error('MIDI 中没有足够的音符');
  return candidates
    .map(t=>{
      const mids=t.notes.map(n=>n.midi).sort((a,b)=>a-b);
      const avg=mids.reduce((a,b)=>a+b,0)/mids.length;
      const p75=mids[Math.floor((mids.length-1)*.75)];
      return {t,score:avg*.7+p75*.3+Math.log2(t.notes.length)*.5};
    })
    .sort((a,b)=>b.score-a.score)[0].t;
}

function monophonicTopLine(track){
  const src=[...track.notes].sort((a,b)=>a.t-b.t||b.midi-a.midi);
  const groups=[];
  for(const n of src){
    let g=groups[groups.length-1];
    if(!g||Math.abs(n.t-g.t)>.035){g={t:n.t,notes:[]};groups.push(g)}
    g.notes.push(n);
  }
  return groups.map(g=>g.notes.sort((a,b)=>b.midi-a.midi||b.velocity-a.velocity)[0]);
}

export function rhythmChartFromMidi(arrayBuffer,{id='midi-level',title='MIDI Level',laneKeys=['A','S','D','J','K','L']}={}){
  const parsed=parseMidi(arrayBuffer);
  const melodyTrack=chooseMelodyTrack(parsed);
  const melody=monophonicTopLine(melodyTrack);
  if(!melody.length)throw new Error('未识别到主旋律');
  const mids=melody.map(n=>n.midi),lo=Math.min(...mids),hi=Math.max(...mids);
  const events=melody.map((n,i)=>{
    const lane=hi===lo?Math.floor(laneKeys.length/2):clamp(Math.round((n.midi-lo)/(hi-lo)*(laneKeys.length-1)),0,laneKeys.length-1);
    return {t:Number(n.t.toFixed(3)),d:Number(clamp(n.d,.08,2.8).toFixed(3)),l:lane,n:n.name,m:n.midi,i};
  });
  const firstTempo=parsed.tempos[0]?.mpqn||500000;
  const bpm=Math.round(60000000/firstTempo);
  const duration=Number((Math.max(...events.map(e=>e.t+e.d))+1).toFixed(3));
  return {
    id,title,bpm,keys:laneKeys,duration,events,
    sourceTrack:{index:melodyTrack.index,name:melodyTrack.name||'',notes:melodyTrack.notes.length},
    midiTracks:parsed.tracks.map(t=>({index:t.index,name:t.name||'',notes:t.notes.length}))
  };
}
