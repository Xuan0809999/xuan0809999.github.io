'use strict';
const board=$('ride'),ctx=drawSurface(board,720,420),horizon=128,finishLine=600;
let state='ready',meters=0,lane=1,visualLane=1,jump=0,life=3,fish=0,objects=[],next=0,clock=0,last=0;
function act(which){if(state!=='ride')return;if(which==='jump'){if(jump<=0)jump=.9}else lane=Math.max(0,Math.min(2,lane+(which==='left'?-1:1)))}
let previousSummary='';
function summary(){const key=[Math.floor(meters),fish,life,lane].join('/');if(key===previousSummary)return;previousSummary=key;setStats([['里程',Math.floor(meters)+' / 600 m'],['小鱼',fish+' 条'],['体力',life+' / 3'],['车道',['左','中','右'][lane]]]);}
function end(won){state='end';$('start').textContent='再骑一趟';$('pause').disabled=true;note(won?'抵达灯塔！本趟收集了 '+fish+' 条鱼。':'体力用尽。本趟骑了 '+Math.floor(meters)+' 米。');stopCamera()}
function restart(){meters=clock=0;lane=visualLane=1;jump=fish=0;life=3;objects=[];next=27;state='ride';$('pause').disabled=false;$('pause').textContent='暂停';$('start').textContent='重新出发';note('前方有木箱和小鱼。');summary();board.focus({preventScroll:true})}
function pause(){if(state==='ride'){state='pause';$('pause').textContent='继续';note('已暂停。')}else if(state==='pause'){state='ride';$('pause').textContent='暂停';note('继续骑行。')}}
function step(dt){if(state!=='ride')return;clock+=dt;meters=Math.min(finishLine,meters+dt*(12+meters/175));jump=Math.max(0,jump-dt);visualLane+=(lane-visualLane)*(1-Math.exp(-13*dt));
 while(next<meters+90){const lanes=shuffle([0,1,2]);objects.push({m:next,l:lanes[0],kind:'box',hit:false},{m:next,l:lanes[1],kind:'fish',hit:false});next+=19+Math.random()*6}
 for(const o of objects){if(o.hit||o.m>meters)continue;o.hit=true;if(o.l!==lane)continue;if(o.kind==='fish'){fish++;note('捡到小鱼！')}else if(jump<.12||jump>.8){life--;note('撞到木箱，体力减一。');if(!life){end(false);break}}}
 objects=objects.filter(o=>o.m>meters-8);if(state==='ride'&&meters>=finishLine)end(true);summary()}
function polygon(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill()}
function oval(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function road(i,t){return [360+(i-1)*(18+181*t),horizon+(355-horizon)*t]}
function rider(x,y,air){ctx.save();ctx.translate(x,y-air);const c=clock*10;
 for(const wx of [-20,22]){disk(ctx,wx,0,13,'#283f3c');disk(ctx,wx,0,9,'#b2c6ad');for(let i=0;i<4;i++)strokePath(ctx,[[wx+Math.cos(c+i*Math.PI/2)*9,Math.sin(c+i*Math.PI/2)*9],[wx,0]],'#637f73',1)}
 strokePath(ctx,[[-20,0],[-11,-17],[1,0],[-20,0],[8,-16],[22,0],[13,-23],[21,-25]],'#df814a',3);strokePath(ctx,[[0,-1],[8*Math.sin(c),6*Math.cos(c)]],'#344d44',2);
 oval(-7,-29,19,10,'#f6f1ce');polygon([[-5,-29],[-25,-40],[-19,-26],[-27,-20],[0,-24]],'#a7b8a8');strokePath(ctx,[[2,-30],[9,-38],[7,-50],[14,-57]],'#f8f0d6',9);oval(14,-56,8,6,'#f9f0d1');polygon([[17,-58],[47,-54],[27,-49],[17,-51]],'#d7894c');disk(ctx,16,-58,1.8,'#263c35');strokePath(ctx,[[-5,-21],[-7,-14],[8*Math.sin(c),-4+5*Math.cos(c)]],'#bf7944',3);ctx.restore()}
function draw(){
 ctx.fillStyle='#e4bf9a';ctx.fillRect(0,0,720,420);disk(ctx,555,56,28,'#f7dfa7');
 [[75,55],[235,39],[525,78]].forEach(([x,y])=>{ctx.fillStyle='#efd2b6';ctx.fillRect(x,y,68,5);ctx.fillRect(x+19,y-4,34,4)});
 polygon([[0,99],[55,77],[103,94],[186,72],[246,94],[317,76],[397,108],[480,79],[558,97],[623,70],[720,89],[720,133],[0,133]],'#8ca498');
 ctx.fillStyle='#85aba3';ctx.fillRect(0,112,720,308);
 for(let i=0;i<16;i++){const x=(i*113+clock*6)%750-15,y=135+(i*47)%260;strokePath(ctx,[[x,y],[x+20+(i%4)*12,y]],'#aec1ac',2)}
 ctx.fillStyle='#efe4c5';ctx.fillRect(464,84,10,32);ctx.fillStyle='#aa6149';ctx.fillRect(463,90,12,6);polygon([[460,84],[469,76],[478,84]],'#3d5b50');
 polygon([[335,horizon],[385,horizon],[720,418],[720,420],[0,420]],'#b5aa85');polygon([[341,horizon],[379,horizon],[696,420],[24,420]],'#708779');
 for(let i=0;i<15;i++){const t=((i/15+meters*.009)%1)**1.7;for(const side of [.5,1.5]){const p=road(side,t),q=road(side,t+.035*t+.006);strokePath(ctx,[p,q],'#d9c89e',1+2*t)}}
 const sorted=objects.filter(o=>!o.hit).sort((a,b)=>b.m-a.m);for(const o of sorted){const t=Math.max(0,1-(o.m-meters)/91)**1.55;if(t<=0)continue;const [x,y]=road(o.l,t),s=.18+.82*t;ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(o.kind==='box'){ctx.fillStyle='#9d633d';ctx.fillRect(-16,-23,32,24);ctx.strokeStyle='#e0ac6e';ctx.lineWidth=3;ctx.strokeRect(-15,-22,30,22);strokePath(ctx,[[-14,-21],[14,-1]],'#d9a36b',3)}else{oval(0,-13,12,6,'#f7ca72');polygon([[-10,-13],[-19,-20],[-19,-6]],'#dfa257');disk(ctx,6,-14,1.6,'#37493c')}ctx.restore()}
 const [x,y]=road(visualLane,1);oval(x,y+10,30,5,'#536c5e');rider(x,y,Math.sin(jump/.9*Math.PI)*68);
 if(state==='ready'||state==='pause'||state==='end'){const label=state==='ready'?'海堤起点':state==='pause'?'暂停':life?'抵达灯塔':'本趟结束';ctx.fillStyle='#203b32d9';ctx.fillRect(238,160,244,49);writing(ctx,label,360,184,'#fff1ce',24,'center')}}
let paintedState='';
function frame(now){const dt=last?Math.min(.08,(now-last)/1000):0;last=now;step(dt);if(state==='ride'||state!==paintedState){draw();paintedState=state}requestAnimationFrame(frame)}
$('start').onclick=restart;$('pause').onclick=pause;document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(b.dataset.act));
board.onkeydown=e=>{const k={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',' ':'jump'}[e.key];if(k){e.preventDefault();if(!e.repeat)act(k)}};
let origin=null;board.onpointerdown=e=>{origin=[e.clientX,e.clientY];board.setPointerCapture(e.pointerId)};board.onpointercancel=()=>origin=null;board.onpointerup=e=>{if(!origin)return;const dx=e.clientX-origin[0],dy=e.clientY-origin[1];origin=null;if(Math.max(Math.abs(dx),Math.abs(dy))<16)return;if(-dy>Math.abs(dx))act('jump');else if(Math.abs(dx)>Math.abs(dy))act(dx<0?'left':'right')};
let stream=null,sequence=0,previous=null,camTimer=0,armed=true,quiet=0;const sensor=document.createElement('canvas');sensor.width=64;sensor.height=48;const eye=sensor.getContext('2d',{willReadFrequently:true});
function stopCamera(){sequence++;clearInterval(camTimer);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;previous=null;$('preview').srcObject=null;$('preview').hidden=true;$('camera').textContent='开启摄像头';$('camera').disabled=false;$('cameraMsg').textContent='镜头已关闭，可使用划动或按钮。'}
function vision(){if($('preview').readyState<2)return;eye.drawImage($('preview'),0,0,64,48);const d=eye.getImageData(0,0,64,48).data;const current=new Uint8Array(3072);const count=[0,0,0];for(let i=0;i<current.length;i++){current[i]=(d[i*4]+2*d[i*4+1]+d[i*4+2])>>2;if(previous&&Math.abs(current[i]-previous[i])>30){const x=63-i%64,y=Math.floor(i/64);if(x<21)count[0]++;else if(x>42)count[2]++;else if(y<22)count[1]++}}
 const was=previous;previous=current;if(!was)return;const values=[count[0]/1008,count[1]/484,count[2]/1008],max=Math.max(...values),idx=values.indexOf(max);if(max<.055){if(++quiet>=2)armed=true;return}quiet=0;if(armed&&max>.16){armed=false;act(['left','jump','right'][idx]);$('cameraMsg').textContent='检测到'+['左移','跳跃','右移'][idx]+'手势。'}}
$('camera').onclick=async()=>{if(stream){stopCamera();return}const ticket=++sequence;$('camera').disabled=true;try{if(!navigator.mediaDevices?.getUserMedia)throw Error();const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:320}},audio:false});if(ticket!==sequence){acquired.getTracks().forEach(t=>t.stop());return}stream=acquired;$('preview').srcObject=stream;$('preview').hidden=false;await $('preview').play();if(ticket!==sequence)return;armed=true;quiet=0;camTimer=setInterval(vision,100);$('camera').textContent='关闭摄像头';$('cameraMsg').textContent='镜头已启用，左右两侧和上方中央可以触发动作。'}catch(e){if(ticket!==sequence)return;stopCamera();$('cameraMsg').textContent='暂时无法使用镜头，可以直接在画面内划动。'}finally{if(ticket===sequence)$('camera').disabled=false}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='ride')pause();stopCamera()}});window.addEventListener('pagehide',stopCamera);
summary();note('点击出发，从海堤起点开始。');requestAnimationFrame(frame);
