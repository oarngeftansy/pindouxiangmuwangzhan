export function createRhythmGame({root, chart, playNote, onProgress=()=>{}, onModeMessage=()=>{}}){
  let activeChart=chart;
  const PERFECT=.085, GOOD=.18, MISS=.22, APPROACH=1.45, PREROLL=2.4;
  const stage=root.querySelector('#rhythmStage');
  const field=root.querySelector('#rhythmField');
  const scoreEl=root.querySelector('#rhythmScore');
  const comboEl=root.querySelector('#rhythmCombo');
  const accEl=root.querySelector('#rhythmAcc');
  const judgeEl=root.querySelector('#rhythmJudgement');
  const countdownEl=root.querySelector('#rhythmCountdown');
  const startBtn=root.querySelector('#rhythmStart');
  const pauseBtn=root.querySelector('#rhythmPause');
  const speedSelect=root.querySelector('#rhythmSpeed');
  const progressBar=root.querySelector('#rhythmProgressBar');
  const resultEl=root.querySelector('#rhythmResult');
  const laneEls=[...root.querySelectorAll('.rhythm-lane')];
  const padEls=[...root.querySelectorAll('.rhythm-pad')];
  let notes=[], raf=0, startAt=0, pauseAt=0, pausedTotal=0, running=false, paused=false, speed=1.15;
  let score=0,combo=0,maxCombo=0,perfect=0,good=0,miss=0,judged=0;

  function keys(){return activeChart?.keys||['A','S','D','J','K','L']}
  function resetStats(){score=0;combo=0;maxCombo=0;perfect=0;good=0;miss=0;judged=0;syncHud();}
  function syncHud(){
    scoreEl.textContent=String(Math.round(score)).padStart(6,'0');
    comboEl.textContent=combo;
    const quality=perfect+good*.7;
    accEl.textContent=(judged?quality/judged*100:100).toFixed(1)+'%';
  }
  function flashJudge(text,cls){
    judgeEl.textContent=text;judgeEl.className='rhythm-judgement '+cls;
    judgeEl.animate(
      [{opacity:1,transform:'translate(-50%,-50%) scale(1.08)'},{opacity:0,transform:'translate(-50%,-62%) scale(.96)'}],
      {duration:500,easing:'ease-out'}
    );
  }
  function currentTime(now=performance.now()){
    if(!startAt)return -PREROLL;
    const base=(paused?pauseAt:now)-startAt-pausedTotal;
    return base/1000*speed;
  }
  function buildNotes(){
    clearNotes();
    if(!activeChart?.events?.length)return;
    activeChart.events.forEach((e,i)=>{
      const lane=laneEls[e.l];
      if(!lane)return;
      const el=document.createElement('div');
      el.className='fall-note'+(e.d>=.9?' long':'');
      el.dataset.index=i;
      const head=document.createElement('div');
      head.className='fall-note-head';
      head.textContent=keys()[e.l]||'';
      el.appendChild(head);
      if(e.d>=.9){
        const tail=document.createElement('div');
        tail.className='fall-note-tail';
        el.appendChild(tail);
      }
      lane.appendChild(el);
      notes.push({...e,i,el,state:'wait'});
    });
  }
  function clearNotes(){
    notes.forEach(n=>n.el?.remove());
    notes=[];
  }
  function setPads(lane,on){
    const p=padEls[lane];
    if(p)p.classList.toggle('pressed',on);
  }
  function judge(note,kind){
    if(note.state!=='wait')return;
    note.state=kind.toLowerCase();
    note.el.classList.add(note.state);
    judged++;
    if(kind==='Perfect'){
      perfect++;combo++;score+=1000+Math.min(combo,100)*8;flashJudge('PERFECT','perfect');
    }else if(kind==='Good'){
      good++;combo++;score+=650+Math.min(combo,100)*4;flashJudge('GOOD','good');
    }else{
      miss++;combo=0;flashJudge('MISS','miss');
    }
    maxCombo=Math.max(maxCombo,combo);
    syncHud();
    if(kind!=='Miss')playNote(note.n,Math.max(.28,Math.min(1.9,note.d)));
    setTimeout(()=>note.el.remove(),kind==='Miss'?210:110);
  }
  function inputLane(lane){
    if(!running||paused)return;
    const t=currentTime();
    setPads(lane,true);setTimeout(()=>setPads(lane,false),85);
    const candidates=notes
      .filter(n=>n.l===lane&&n.state==='wait'&&Math.abs(n.t-t)<=GOOD)
      .sort((a,b)=>Math.abs(a.t-t)-Math.abs(b.t-t));
    if(!candidates.length)return;
    const n=candidates[0],d=Math.abs(n.t-t);
    judge(n,d<=PERFECT?'Perfect':'Good');
  }
  function frame(now){
    if(!running)return;
    const t=currentTime(now);
    countdownEl.textContent=t<0?(t<-1.6?'3':t<-.8?'2':t<0?'1':''):'';
    countdownEl.classList.toggle('show',t<0);
    if(t>=0&&t<.28){countdownEl.textContent='GO';countdownEl.classList.add('show');}
    else if(t>=.28)countdownEl.classList.remove('show');

    const rect=stage.getBoundingClientRect();
    const NOTE_H=24,HIT_BOTTOM=72;
    const hitY=rect.height-HIT_BOTTOM;
    const hitTop=hitY-NOTE_H;
    const spawnY=-NOTE_H-10;
    const travel=hitTop-spawnY;
    for(const n of notes){
      if(n.state!=='wait')continue;
      const dt=n.t-t;
      if(dt < -MISS){judge(n,'Miss');continue;}
      const y=hitTop-(dt/APPROACH)*travel;
      if(y>spawnY-120&&y<hitTop+NOTE_H+80){
        n.el.style.display='block';
        n.el.style.transform=`translate3d(0,${y}px,0)`;
        const tail=n.el.querySelector('.fall-note-tail');
        if(tail)tail.style.height=Math.max(22,Math.min(170,n.d/APPROACH*travel))+'px';
      }else n.el.style.display='none';
    }

    const duration=activeChart?.duration||1;
    const pct=Math.max(0,Math.min(1,t/duration));
    progressBar.style.width=(pct*100)+'%';
    onProgress(pct,t,activeChart,speed);
    if(t>duration+1.0){finish();return;}
    raf=requestAnimationFrame(frame);
  }
  function start(){
    if(!activeChart?.events?.length){
      onModeMessage('当前曲目没有可用的音游谱面');
      return;
    }
    stop(false);
    speed=Number(speedSelect?.value)||1.15;
    buildNotes();resetStats();
    resultEl.classList.remove('show');resultEl.innerHTML='';
    startAt=performance.now()+PREROLL*1000;
    pausedTotal=0;paused=false;running=true;
    startBtn.textContent='重新开始';pauseBtn.textContent='暂停';
    const effective=Math.round((activeChart.bpm||0)*speed);
    onModeMessage(`${activeChart.title||'当前曲目'} · ${effective} BPM · ${activeChart.events.length} 音符 · ${speed.toFixed(2)}×`);
    raf=requestAnimationFrame(frame);
  }
  function pause(){
    if(!running)return;
    if(!paused){
      paused=true;pauseAt=performance.now();pauseBtn.textContent='继续';cancelAnimationFrame(raf);
    }else{
      paused=false;pausedTotal+=performance.now()-pauseAt;pauseBtn.textContent='暂停';
      raf=requestAnimationFrame(frame);
    }
  }
  function finish(){
    if(!running)return;
    running=false;cancelAnimationFrame(raf);
    const acc=judged?(perfect+good*.7)/judged*100:0;
    resultEl.innerHTML=`<div class="result-card"><small>演奏完成</small><strong>${Math.round(score).toLocaleString()}</strong><div><span>Perfect <b>${perfect}</b></span><span>Good <b>${good}</b></span><span>Miss <b>${miss}</b></span><span>Max Combo <b>${maxCombo}</b></span><span>Accuracy <b>${acc.toFixed(1)}%</b></span></div><button id="rhythmAgain">再来一次</button></div>`;
    resultEl.classList.add('show');
    resultEl.querySelector('#rhythmAgain').onclick=start;
    onProgress(1,activeChart?.duration||0,activeChart,speed);
  }
  function stop(clear=true){
    running=false;paused=false;cancelAnimationFrame(raf);raf=0;startAt=0;pausedTotal=0;
    countdownEl.classList.remove('show');progressBar.style.width='0%';
    if(clear){clearNotes();resultEl.classList.remove('show');}
  }
  function setChart(nextChart){
    stop();
    activeChart=nextChart;
    resetStats();
    onProgress(0,0,activeChart,speed);
  }

  startBtn.onclick=start;
  pauseBtn.onclick=pause;
  speedSelect?.addEventListener('change',()=>{speed=Number(speedSelect.value)||1.15;});
  padEls.forEach((p,i)=>{p.onpointerdown=e=>{e.preventDefault();inputLane(i);}});
  return {start,stop,pause,inputLane,setChart,getChart:()=>activeChart,isRunning:()=>running,isPaused:()=>paused};
}
