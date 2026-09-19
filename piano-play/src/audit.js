import { builtinSongs } from './catalog.js';
const tok=x=>typeof x==='string'?x:(x?.n||x?.k||'');
const seq=sec=>(sec?.measures||[]).flat().map(tok).filter(x=>x&&x!=='·');
const similarity=(a,b)=>{const n=Math.max(a.length,b.length);if(!n)return 1;let same=0;for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]===b[i])same++;return same/n};
const result=builtinSongs.map(song=>{
 const ss=(song.sections||[]).map(seq), exact=[], near=[];
 for(let i=0;i<ss.length;i++)for(let j=i+1;j<ss.length;j++){const sim=similarity(ss[i],ss[j]);if(ss[i].length&&ss[i].length===ss[j].length&&sim===1)exact.push([i+1,j+1]);else if(sim>=.8)near.push([i+1,j+1,Number(sim.toFixed(3))]);}
 return {id:song.id,title:song.title,fullLength:!!song.fullLength,source:song.source||'',sectionCount:ss.length,tokenCounts:ss.map(x=>x.length),exactDuplicatePairs:exact,nearDuplicatePairs:near};
});
document.getElementById('out').textContent=JSON.stringify(result,null,2);