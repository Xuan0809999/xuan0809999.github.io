"use strict";
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("zh-CN"),pad=n=>String(n).padStart(2,"0"),isLate=r=>r[3]>=15;
const pct=a=>a.length?100*a.filter(isLate).length/a.length:null;
const asPct=v=>v===null?"—":v.toFixed(1)+"%";
const state={data:null,matching:[],base:[],page:0,guess:"",verdict:""};
const pageSize=6;
function selectedRows(r){
 const m=+$("month").value,d=$("distance").value;
 return (!m||r[0]===m)&&(d==="all"||(d==="short"&&r[4]<500)||(d==="mid"&&r[4]>=500&&r[4]<1000)||(d==="long"&&r[4]>=1000));
}
function reportGuess(){
 const guess=state.guess;
 document.querySelectorAll("[data-guess]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.guess===guess)));
 if(!guess){state.verdict="选一个时段，揭开两组航班的结果。";$("verdict").textContent=state.verdict;return;}
 const morning=state.base.filter(r=>r[2]>=360&&r[2]<720),evening=state.base.filter(r=>r[2]>=1080),a=pct(morning),b=pct(evening);
 const decision=a===null||b===null?"样本不足，暂时无法比较。":a===b?"两组晚点率相同。":(guess==="morning") === (a>b)?"这次猜中了。":"这一次，数据给出了另一个答案。";
 state.verdict=decision+" 早班 "+asPct(a)+"（"+fmt(morning.length)+" 班），晚班 "+asPct(b)+"（"+fmt(evening.length)+" 班）。";
 $("verdict").textContent=state.verdict+" 比较采用当前月份和航程，包含两个完整时段。";
}
function renderTable(){
 const list=state.matching,n=list.length,start=state.page*pageSize;
 $("pageN").textContent=n?(start+1)+"–"+Math.min(n,start+pageSize)+" / "+fmt(n):"0 条";
 $("prev").disabled=state.page<=0;$("next").disabled=start+pageSize>=n;
 $("rows").replaceChildren(...list.slice(start,start+pageSize).map(r=>{
  const row=document.createElement("tr");
  [pad(r[0])+"/"+pad(r[1]),pad(Math.floor(r[2]/60))+":"+pad(r[2]%60),r[5]+" → "+r[6],fmt(r[4]),(r[3]>0?"+":"")+r[3]+" 分"].forEach((v,i)=>{
   const td=document.createElement("td");td.textContent=v;if(i===4&&isLate(r))td.className="late";row.append(td);
  });return row;
 }));
 if(!n){const td=document.createElement("td");td.colSpan=5;td.textContent="这个筛选组合没有航班。";const tr=document.createElement("tr");tr.append(td);$("rows").append(tr);}
}
// Albers equal-area projection, standard parallels 29.5° and 45.5° N.
const rad=Math.PI/180,cone=(Math.sin(29.5*rad)+Math.sin(45.5*rad))/2,constant=Math.cos(29.5*rad)**2+2*cone*Math.sin(29.5*rad);
function albers(p){const rho=Math.sqrt(constant-2*cone*Math.sin(p[1]*rad))/cone,theta=(p[0]+96)*rad*cone;return [rho*Math.sin(theta),rho*Math.cos(theta)];}
let baseMap=null;
function drawMap(){
 if(!state.data)return;
 const el=$("routeMap"),w=el.clientWidth,h=el.clientHeight;if(w<5||h<5)return;
 const scale=Math.min(2,window.devicePixelRatio||1);el.width=Math.round(w*scale);el.height=Math.round(h*scale);
 const c=el.getContext("2d");c.scale(scale,scale);
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#21434a");bg.addColorStop(.6,"#173a3b");bg.addColorStop(1,"#102d32");c.fillStyle=bg;c.fillRect(0,0,w,h);
 if(!baseMap){const polys=state.data.states.map(r=>r.map(albers));const all=polys.flat();baseMap={polys,minX:Math.min(...all.map(a=>a[0])),maxX:Math.max(...all.map(a=>a[0])),minY:Math.min(...all.map(a=>a[1])),maxY:Math.max(...all.map(a=>a[1]))};}
 const box=baseMap,k=Math.min((w-26)/(box.maxX-box.minX),(h-21)/(box.maxY-box.minY)),ox=(w-(box.maxX-box.minX)*k)/2,oy=(h-(box.maxY-box.minY)*k)/2;
 function screen(p){return [ox+(p[0]-box.minX)*k,oy+(p[1]-box.minY)*k];}
 c.lineWidth=.6;c.strokeStyle="#8faf9b24";for(let x=0;x<w;x+=26){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=26){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
 for(const poly of box.polys){c.beginPath();poly.forEach((p,i)=>{const [x,y]=screen(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.fillStyle="#31554f";c.fill();c.strokeStyle="#9eb8a18c";c.lineWidth=.7;c.stroke();}
 const within=p=>p&&p[0]>=-125&&p[0]<=-66&&p[1]>=24&&p[1]<=50,air=state.data.airports,counts=new Map();
 for(const r of state.matching)if(within(air[r[5]])&&within(air[r[6]])){const key=r[5]+":"+r[6];counts.set(key,(counts.get(key)||0)+1);}
 const top=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,32),cities=new Map();
 for(const [route,n] of [...top].reverse()){
  const [a,b]=route.split(":"),p=screen(albers(air[a])),q=screen(albers(air[b]));
  const dx=q[0]-p[0],dy=q[1]-p[1];
  c.beginPath();c.moveTo(...p);c.quadraticCurveTo((q[0]+p[0])/2+dy*.16,(q[1]+p[1])/2-dx*.16,...q);c.strokeStyle=n>=top[0][1]*.65?"#ffc989d9":"#93cdb3a3";c.lineWidth=.7+1.8*n/top[0][1];c.stroke();
  for(const id of [a,b])cities.set(id,(cities.get(id)||0)+n);
 }
 const labels=[];for(const [id] of [...cities].sort((a,b)=>b[1]-a[1])){const [x,y]=screen(albers(air[id]));c.beginPath();c.arc(x,y,2.4,0,Math.PI*2);c.fillStyle="#ffe6a8";c.fill();if(labels.length>=7||labels.some(p=>Math.abs(p[0]-x)<40&&Math.abs(p[1]-y)<18))continue;labels.push([x,y]);c.font="bold 10px Consolas,monospace";c.fillStyle="#f2f6df";c.strokeStyle="#1c3837";c.lineWidth=3;c.strokeText(id,x+4,y-3);c.fillText(id,x+4,y-3);}
 $("mapNote").textContent=top.length?"当前显示 "+top.length+" 条高频航线":"当前条件下无可绘制的本土航线";
}
function update(changed){
 const low=$("from"),high=$("to");if(+low.value>+high.value){if(changed==="from")high.value=low.value;else low.value=high.value;}
 const from=+low.value,to=+high.value;$("fromVal").textContent=pad(from)+":00";$("toVal").textContent=pad(to)+":59";
 state.base=state.data.flights.filter(selectedRows);state.matching=state.base.filter(r=>r[2]>=from*60&&r[2]<(to+1)*60);state.page=0;
 const n=state.matching.length,s=state.matching.map(r=>r[3]).sort((a,b)=>a-b);
 $("sampleN").textContent=fmt(n);$("lateRate").textContent=asPct(pct(state.matching));$("median").textContent=n?String((s[(n-1)>>1]+s[n>>1])/2):"—";
 const groups=Array.from({length:24},()=>[]);for(const r of state.base)groups[Math.floor(r[2]/60)].push(r);
 for(let i=0;i<24;i++){const b=$("hourBars").children[i],rate=pct(groups[i]),desc=pad(i)+" 时 · "+asPct(rate)+" 晚点 · "+fmt(groups[i].length)+" 班";
  b.title=desc;b.setAttribute("aria-label",desc);b.setAttribute("aria-pressed",String(from===i&&to===i));b.classList.toggle("miss",i<from||i>to);b.firstChild.style.height=(rate||0)+"%";}
 $("hourNote").textContent="柱高按当前月份与航程计算。点一根柱子，可只看该小时的记录。";$("saved").textContent="";
 renderTable();reportGuess();drawMap();
}
function downloadCard(){
 const c=document.createElement("canvas");c.width=1000;c.height=580;const g=c.getContext("2d");
 g.fillStyle="#f5efdd";g.fillRect(0,0,1000,580);g.fillStyle="#234840";g.fillRect(0,0,1000,128);g.fillStyle="#ffe8be";g.font='bold 45px "Microsoft YaHei",sans-serif';g.fillText("航班延误调查卡",46,82);
 const lines=["美国民航样本 · 2001 年第一季度","筛选："+$("month").selectedOptions[0].text+" / "+$("distance").selectedOptions[0].text+" / "+$("fromVal").textContent+"–"+$("toVal").textContent,"符合条件 "+$("sampleN").textContent+" 班　｜　到达晚点率 "+$("lateRate").textContent,"到达延误中位数 "+$("median").textContent+" 分钟"];
 if(state.guess){lines.push("我的猜想："+(state.guess==="morning"?"早班":"晚班")+"更易晚点",state.verdict);}
 g.fillStyle="#23483d";g.font='26px "Microsoft YaHei",sans-serif';lines.forEach((l,i)=>g.fillText(l,44,182+i*49,910));
 g.font='20px "Microsoft YaHei",sans-serif';g.fillText("Mingxuan  /  数据：U.S. BTS · Vega Datasets  /  晚点阈值：15 分钟",44,540,916);
 c.toBlob(blob=>{if(!blob){$("saved").textContent="当前浏览器未能生成图片。";return;}const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="航班延误调查卡.png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200);$("saved").textContent=" 已生成调查卡";},"image/png");
}
async function startFlight(){
 try{const res=await fetch("atlas/flights-data.json");if(!res.ok)throw Error("data");state.data=await res.json();if(!state.data.flights.length)throw Error("empty");}catch{$("dataStatus").textContent="航班记录暂未载入。请刷新页面重试。";return;}
 for(let i=0;i<24;i++){const b=document.createElement("button");b.className="hourbar";b.append(document.createElement("span"));b.onclick=()=>{$("from").value=i;$("to").value=i;update("hour");};b.onfocus=b.onmouseenter=()=>{$("hourNote").textContent=b.title;};$("hourBars").append(b);}
 ["month","distance","from","to"].forEach(id=>$(id).addEventListener(id==="month"||id==="distance"?"change":"input",()=>update(id)));
 $("reset").onclick=()=>{$("month").value="0";$("distance").value="all";$("from").value=0;$("to").value=23;state.guess="";update("reset");};
 document.querySelectorAll("[data-guess]").forEach(b=>b.onclick=()=>{state.guess=b.dataset.guess;reportGuess();});
 $("prev").onclick=()=>{if(state.page>0)state.page--;renderTable();};$("next").onclick=()=>{if((state.page+1)*pageSize<state.matching.length)state.page++;renderTable();};$("export").onclick=downloadCard;
 $("app").hidden=false;$("dataStatus").hidden=true;update("init");if(window.ResizeObserver)new ResizeObserver(drawMap).observe($("routeMap"));else window.addEventListener("resize",drawMap);
}
startFlight();