export function createRhythmGame({root, chart, playNote, onProgress=()=>{}, onModeMessage=()=>{}}){
  const keys=chart.keys;
  const PERFECT=.085, GOOD=.18, MISS=.22, APPROACH=1.85, PREROLL=3.0;
  const stage=root.querySelector('#rhythmStage');
  const field=root.querySelector('#rhythmField');
  const scoreEl=root.querySelector('#rhythmScore');
  const comboEl=root.querySelector('#rhythmCombo');
  const accEl=root.querySelector('#rhythmAcc');
  const judgeEl=root.querySelector('#rhythmJudgement');
  const countdownEl=root.querySelector('#rhythmCountdown');
  const startBtn=root.querySelector('#rhythmStart');
  const pauseBtn=root.querySelector('#rhythmPause');
  const progressBar=root.querySelector('#rhythmProgressBar');
  const resultEl=root.querySelector('#rhythmResult');
  const laneEls=[...root.querySelectorAll('.rhythm-lane')];
  const padEls=[...root.querySelectorAll('.rhythm-pad')];
  let notes=[], raf=0, startAt=0, pauseAt=0, pausedTotal=0, running=false, paused=false;
  let score=0,combo=0,maxCombo=0,perfect=0,good=0,miss=0,judged=0;

  function resetStats(){score=0;combo=0;maxCombo=0;perfect=0;good=0;miss=0;judged=0;syncHud();}
  function syncHud(){
    scoreEl.textContent=String(Math.round(score)).padStart(6,'0');
    comboEl.textContent=combo;
    const quality=perfect+good*.7;
    accEl.textContent=(judged?quality/judged*100:100).toFixed(1)+'%';
  }
  function flashJudge(text,cls){judgeEl.textContent=text;judgeEl.className='rhythm-judgement '+cls;judgeEl.animate([{opacity:1,transform:'translate(-50%,-50%) scale(1.08)'},{opacity:0,transform:'translate(-50%,-62%) scale(.96)'}],{duration:520,easing:'ease-out'});}
  function currentTime(now=performance.now()){
    if(!startAt)return -PREROLL;
    const base=(paused?pauseAt:now)-startAt-pausedTotal;
    return base/1000;
  }
  function buildNotes(){
    field.innerHTML='';
    laneEls.forEach(l=>field.appendChild(l));
    notes=chart.events.map((e,i)=>{
      const el=document.createElement('div');
      el.className='fall-note'+(e.d>=.9?' long':'');
      el.dataset.index=i;
      const head=document.createElement('div'); head.className='fall-note-head'; head.textContent=keys[e.l]; el.appendChild(head);
      if(e.d>=.9){const tail=document.createElement('div');tail.className='fall-note-tail';el.appendChild(tail)}
      laneEls[e.l].appendChild(el);
      return {...e,i,el,state:'wait'};
    });
  }
  function clearNotes(){notes.forEach(n=>n.el.remove());notes=[];}
  function setPads(lane,on){const p=padEls[lane];if(p)p.classList.toggle('pressed',on);}
  function judge(note,kind){
    if(note.state!=='wait')return;
    note.state=kind.toLowerCase(); note.el.classList.add(note.state);
    judged++;
    if(kind==='Perfect'){perfect++;combo++;score+=1000+Math.min(combo,100)*8;flashJudge('PERFECT','perfect')}
    else if(kind==='Good'){good++;combo++;score+=650+Math.min(combo,100)*4;flashJudge('GOOD','good')}
    else {miss++;combo=0;flashJudge('MISS','miss')}
    maxCombo=Math.max(maxCombo,combo); syncHud();
    if(kind!=='Miss') playNote(note.n,Math.max(.32,Math.min(2.2,note.d)));
    setTimeout(()=>note.el.remove(),kind==='Miss'?220:120);
  }
  function inputLane(lane){
    if(!running||paused)return;
    const t=currentTime();
    setPads(lane,true);setTimeout(()=>setPads(lane,false),95);
    const laneNotes=notes.filter(n=>n.l===lane&&n.state==='wait').sort((a,b)=>Math.abs(a.t-t)-Math.abs(b.t-t));
    const n=laneNotes[0];
    if(!n)return;
    const signed=n.t-t,d=Math.abs(signed);
    if(d<=GOOD){judge(n,d<=PERFECT?'Perfect':'Good');return}
    if(d<=.36)flashJudge(signed>0?'EARLY':'LATE',signed>0?'early':'late');
  }
  function frame(now){
    if(!running)return;
    const t=currentTime(now);
    countdownEl.textContent=t<0?(t<-2?'3':t<-1?'2':t<0?'1':''):'';
    countdownEl.classList.toggle('show',t<0);
    if(t>=0&&t<.35){countdownEl.textContent='GO';countdownEl.classList.add('show')}
    else if(t>=.35)countdownEl.classList.remove('show');
    const rect=stage.getBoundingClientRect();
    // Visual hit geometry: note bottom reaches the hit line exactly at note.t.
    // The lane keycaps sit below this line, so timing and key identity share one axis.
    const NOTE_H=24, HIT_BOTTOM=72;
    const hitY=rect.height-HIT_BOTTOM;
    const hitTop=hitY-NOTE_H;
    const spawnY=-NOTE_H-10;
    const travel=hitTop-spawnY;
    const armed=new Set();
    for(const n of notes){
      if(n.state!=='wait')continue;
      const dt=n.t-t;
      if(dt>=0&&dt<=.46)armed.add(n.l);
      if(dt < -MISS){judge(n,'Miss');continue;}
      const y=hitTop-(dt/APPROACH)*travel;
      if(y>spawnY-120 && y<hitTop+NOTE_H+80){
        n.el.style.display='block';
        n.el.style.transform=`translate3d(0,${y}px,0)`;
        const tail=n.el.querySelector('.fall-note-tail');
        if(tail)tail.style.height=Math.max(22,Math.min(170,n.d/APPROACH*travel))+'px';
      }else n.el.style.display='none';
    }
    laneEls.forEach((el,i)=>el.classList.toggle('armed',armed.has(i)));
    padEls.forEach((el,i)=>el.classList.toggle('armed',armed.has(i)));
    const pct=Math.max(0,Math.min(1,t/chart.duration));progressBar.style.width=(pct*100)+'%';onProgress(pct,t);
    if(t>chart.duration+1.2){finish();return;}
    raf=requestAnimationFrame(frame);
  }
  function start(){
    stop(false);buildNotes();resetStats();resultEl.classList.remove('show');resultEl.innerHTML='';
    startAt=performance.now()+PREROLL*1000;pausedTotal=0;paused=false;running=true;startBtn.textContent='重新开始';pauseBtn.textContent='暂停';
    onModeMessage(`天空之城 · ${chart.bpm} BPM · ${chart.events.length} 个节奏音符`);
    raf=requestAnimationFrame(frame);
  }
  function pause(){
    if(!running)return;
    if(!paused){paused=true;pauseAt=performance.now();pauseBtn.textContent='继续';}
    else{paused=false;pausedTotal+=performance.now()-pauseAt;pauseBtn.textContent='暂停';raf=requestAnimationFrame(frame)}
    if(paused)cancelAnimationFrame(raf);
  }
  function finish(){
    if(!running)return;running=false;cancelAnimationFrame(raf);
    const acc=judged?(perfect+good*.7)/judged*100:0;
    resultEl.innerHTML=`<div class="result-card"><small>演奏完成</small><strong>${Math.round(score).toLocaleString()}</strong><div><span>Perfect <b>${perfect}</b></span><span>Good <b>${good}</b></span><span>Miss <b>${miss}</b></span><span>Max Combo <b>${maxCombo}</b></span><span>Accuracy <b>${acc.toFixed(1)}%</b></span></div><button id="rhythmAgain">再来一次</button></div>`;
    resultEl.classList.add('show');resultEl.querySelector('#rhythmAgain').onclick=start;
    onProgress(1,chart.duration);
  }
  function stop(clear=true){
    running=false;paused=false;cancelAnimationFrame(raf);raf=0;startAt=0;pausedTotal=0;
    countdownEl.classList.remove('show');progressBar.style.width='0%';
    laneEls.forEach(el=>el.classList.remove('armed'));padEls.forEach(el=>el.classList.remove('armed'));
    if(clear){clearNotes();resultEl.classList.remove('show');}
  }
  startBtn.onclick=start; pauseBtn.onclick=pause;
  padEls.forEach((p,i)=>{p.onpointerdown=e=>{e.preventDefault();inputLane(i)}});
  return {start,stop,pause,inputLane,isRunning:()=>running,isPaused:()=>paused};
}
