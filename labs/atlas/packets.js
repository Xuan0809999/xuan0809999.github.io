"use strict";
const $=id=>document.getElementById(id),names=["A","B","C"],algNames={rr:"轮询分配",least:"最少在途请求"},colors={rr:"#bf7643",least:"#29786d"};
const fixedStep=1/30;
function scheduler(){return {lanes:Array.from({length:3},()=>({job:null,queue:[]})),cursor:0,completed:0,times:[],marks:[],history:[],tracked:null};}
let tick,time,seed,seq,rate,credit,slow,paused,view,machines,tracked,lastMetric,clockCarry=0,lastFrame=0;
function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
function count(lane){return lane.queue.length+Number(!!lane.job);}
function emit(trace=false){
 const id=++seq,work=.22+random()*.40;if(trace)tracked=id;
 for(const key of ["rr","least"]){
  const m=machines[key];let k=m.cursor;
  if(key==="least"){const min=Math.min(...m.lanes.map(count));for(let i=0;i<3;i++){const q=(m.cursor+i)%3;if(count(m.lanes[q])===min){k=q;break;}}}
  m.cursor=(k+1)%3;const job={id,born:time,work,remaining:work,lane:k,start:null,end:null};
  m.lanes[k].queue.push(job);m.marks.push(job);if(trace)m.tracked=job;
 }
}
function stat(m){const vals=m.times.map(t=>t.duration).sort((a,b)=>a-b);return {n:vals.length,p:vals.length?vals[Math.ceil(vals.length*.95)-1]:null,wait:m.lanes.reduce((s,l)=>s+l.queue.length,0)};}
function advance(){
 credit+=rate*fixedStep;while(credit>=1){credit-=1;emit();}tick++;time=tick*fixedStep;
 for(const m of Object.values(machines)){
  m.lanes.forEach((l,i)=>{let dt=fixedStep,offset=0;const speed=i===1&&slow?.25:1;
   while(dt>1e-9){if(!l.job){if(!l.queue.length)break;l.job=l.queue.shift();l.job.start=Math.max(l.job.born,time-fixedStep+offset);}
    const used=Math.min(dt,l.job.remaining/speed);l.job.remaining-=used*speed;dt-=used;offset+=used;
    if(l.job.remaining<1e-8){l.job.end=Math.max(l.job.start,time-fixedStep+offset);m.completed++;m.times.push({end:l.job.end,duration:l.job.end-l.job.born});l.job=null;}else break;
   }
  });
  m.times=m.times.filter(v=>v.end>=time-30);m.marks=m.marks.filter(v=>v.born>=time-1.35);
  if(tick%30===0){m.history.push({time,p:stat(m).p});m.history=m.history.filter(v=>v.time>time-30);}
 }
}
function reset(){
 time=0;tick=0;seed=72026;seq=0;rate=5;credit=0;slow=false;paused=false;view="rr";tracked=0;lastMetric=-1;clockCarry=0;
 machines={rr:scheduler(),least:scheduler()};for(let i=0;i<120;i++)advance();
 $("rate").value=5;$("viewMode").value="rr";$("controlState").textContent="三台服务器均以正常速度处理。";refresh(true);
}
function size(canvas){
 const w=canvas.clientWidth,h=canvas.clientHeight,ratio=Math.min(2,window.devicePixelRatio||1);
 if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
 const c=canvas.getContext("2d");c.setTransform(ratio,0,0,ratio,0,0);return {c,w,h};
}
function flowView(){
 const {c,w,h}=size($("scope"));if(!w||!h)return;
 const m=machines[view],sx=w*.11,split=w*.33,server=w*.75,ys=[.20,.50,.80].map(t=>t*h),mid=ys[1],small=w<420;
 const bg=c.createLinearGradient(0,0,w,h);bg.addColorStop(0,"#16373a");bg.addColorStop(.65,"#1a4140");bg.addColorStop(1,"#142e32");c.fillStyle=bg;c.fillRect(0,0,w,h);
 for(let i=0;i<w;i+=14)for(let j=4;j<h;j+=14){c.fillStyle="#94bbaa35";c.fillRect(i,j,1.1,1.1);}
 function label(str,x,y,color="#bbd8ca",align="left",font=small?10:12){c.fillStyle=color;c.textAlign=align;c.font="600 "+font+"px Consolas,'Microsoft YaHei',monospace";c.fillText(str,x,y);}
 function line(points,col,thick=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=col;c.lineWidth=thick;c.stroke();}
 const path=i=>[[sx,mid],[split,mid],[split+w*.10,mid],[split+w*.21,ys[i]],[server-7,ys[i]]];
 function dotOn(points,t,col){const lens=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),total=lens.reduce((a,b)=>a+b,0);let travel=Math.max(0,Math.min(1,t))*total;
  for(let i=0;i<lens.length;i++){if(travel<=lens[i]||i===lens.length-1){const u=lens[i]?travel/lens[i]:0;const x=points[i][0]+(points[i+1][0]-points[i][0])*u,y=points[i][1]+(points[i+1][1]-points[i][1])*u;c.beginPath();c.arc(x,y,col==="#ffcf70"?4.5:3.2,0,2*Math.PI);c.fillStyle=col;c.fill();break;}travel-=lens[i];}}
 for(let i=0;i<3;i++){const l=m.lanes[i],y=ys[i],color=i===1&&slow?"#f2aa69":"#8ed6b6";
  line(path(i),"#5c8e81",2);const sw=Math.min(107,w*.211),sh=32;c.fillStyle="#102e30";c.fillRect(server,y-sh/2,sw,sh);c.strokeStyle=color;c.strokeRect(server,y-sh/2,sw,sh);
  label("SRV "+names[i],server+6,y-1,color,"left",small?10:12);const frac=l.job?1-l.job.remaining/l.job.work:0;c.fillStyle="#365c55";c.fillRect(server+6,y+6,sw-12,4);c.fillStyle=color;c.fillRect(server+6,y+6,(sw-12)*Math.max(0,frac),4);
  label("队列 "+l.queue.length+(i===1&&slow?" · 慢速":""),server,y+31,i===1&&slow?"#efbf8a":"#aac7b9");
  for(let j=0;j<Math.min(9,l.queue.length);j++){c.fillStyle=l.queue[j].id===tracked?"#ffcf70":color;c.fillRect(server-12-j*4,y-5,2,10);}
 }
 for(const job of m.marks){const u=(time-job.born)/.75;if(u<=1)dotOn(path(job.lane),u,job.id===tracked?"#ffcf70":"#b6efd2");}
 c.fillStyle="#203f3d";c.strokeStyle="#c6d8b9";c.lineWidth=1.2;c.fillRect(sx-12,mid-9,24,18);c.strokeRect(sx-12,mid-9,24,18);line([[sx,mid+9],[sx,mid+13],[sx+7,mid+13]],"#c6d8b9");
 c.beginPath();for(let i=0;i<6;i++){const a=Math.PI*i/3,p=[split+17*Math.cos(a),mid+17*Math.sin(a)];i?c.lineTo(...p):c.moveTo(...p);}c.closePath();c.fillStyle="#e2ab74";c.fill();label("LB",split,mid+4,"#263a34","center",12);label("客户端",sx,mid+33,"#d0dfcd","center");label("调度器",split,mid+33,"#e3bd85","center");
}
function chart(){
 const {c,w,h}=size($("historyChart"));if(!w||!h)return;c.fillStyle="#eff1e6";c.fillRect(0,0,w,h);
 const max=Math.max(1,...Object.values(machines).flatMap(m=>m.history.map(e=>e.p||0))),limit=Math.ceil(max),x=t=>26+(w-44)*(1-(Math.floor(time)-t)/30),y=p=>h-18-(h-32)*p/limit;
 for(const p of [0,limit/2,limit]){c.strokeStyle="#ccd6c7";c.lineWidth=1;c.beginPath();c.moveTo(26,y(p));c.lineTo(w-8,y(p));c.stroke();c.fillStyle="#526c5a";c.font="9px monospace";c.fillText(p.toFixed(1),2,y(p)+3);}
 for(const key of ["rr","least"]){c.strokeStyle=colors[key];c.lineWidth=2.5;c.setLineDash(key==="rr"?[5,3]:[]);c.beginPath();let pen=false;for(const p of machines[key].history){if(p.p===null){pen=false;continue;}pen?c.lineTo(x(p.time),y(p.p)):c.moveTo(x(p.time),y(p.p));pen=true;}c.stroke();c.setLineDash([]);}
 c.fillStyle="#4d6758";c.font="10px Consolas,monospace";c.fillText("−30 s",27,h-3);c.fillText("现在",w-29,h-3);
}
function traceText(job){
 if(!job)return "";
 const route="服务器 "+names[job.lane]+" · ";
 if(job.end!==null)return route+"完成，用时 "+(job.end-job.born).toFixed(2)+" 秒（排队 "+(job.start-job.born).toFixed(2)+" 秒）";
 if(job.start!==null)return route+"正在处理，已排队 "+(job.start-job.born).toFixed(2)+" 秒";
 return route+"排队中，已等 "+Math.max(0,time-job.born).toFixed(1)+" 秒";
}
function refresh(force=false){
 flowView();if(!force&&Math.floor(time*4)===lastMetric)return;lastMetric=Math.floor(time*4);
 $("simClock").textContent="T + "+String(Math.floor(time/60)).padStart(2,"0")+":"+String(Math.floor(time)%60).padStart(2,"0");
 $("rateText").textContent=rate+" 个";$("scopeCaption").textContent=algNames[view]+(paused?" · 已暂停":" · 运行中");
 $("pause").textContent=paused?"继续模拟":"暂停模拟";$("slow").setAttribute("aria-pressed",String(slow));$("slow").textContent=slow?"恢复 B 服务器":"放慢 B 服务器";
 const m=machines[view],s=stat(m);$("waiting").textContent=s.wait;$("finished").textContent=m.completed;$("p95").textContent=s.p===null?"—":s.p.toFixed(2);
 $("compare").innerHTML=Object.entries(machines).map(([key,val])=>{const q=stat(val);return '<tr><td style="color:'+colors[key]+';font-weight:700">'+algNames[key]+'</td><td>'+q.wait+'</td><td>'+q.n+'</td><td>'+(q.p===null?"—":q.p.toFixed(2)+" 秒")+'</td></tr>';}).join("");
 if(tracked){$("traceRows").innerHTML=Object.entries(machines).map(([key,val])=>'<div class="trace"><b>'+algNames[key]+'</b>'+traceText(val.tracked)+'</div>').join("");}else{$("traceRows").replaceChildren();$("trackStatus").textContent="还没有追踪对象。";}
 chart();
}
$("restart").onclick=reset;$("viewMode").onchange=()=>{view=$("viewMode").value;refresh(true);};$("rate").oninput=()=>{rate=+$("rate").value;refresh(true);};
$("slow").onclick=()=>{slow=!slow;$("controlState").textContent=slow?"B 已降至 ¼ 速度。观察两种策略的排队数量。":"B 已恢复正常速度。";refresh(true);};
$("burst").onclick=()=>{for(let i=0;i<12;i++)emit();$("controlState").textContent="同一批 12 个请求已交给两种策略。";refresh(true);};
$("pause").onclick=()=>{paused=!paused;clockCarry=0;refresh(true);};$("step").onclick=()=>{paused=true;clockCarry=0;for(let i=0;i<30;i++)advance();refresh(true);};
$("track").onclick=()=>{emit(true);$("trackStatus").textContent="正在追踪请求 #"+tracked+" · 两组的任务工作量相同";refresh(true);};
function frame(ms){const dt=lastFrame?Math.min((ms-lastFrame)/1000,.16):0;lastFrame=ms;if(!document.hidden&&!paused){clockCarry+=dt;while(clockCarry>=fixedStep){advance();clockCarry-=fixedStep;}refresh();}requestAnimationFrame(frame);}
reset();window.addEventListener("resize",()=>refresh(true));requestAnimationFrame(frame);