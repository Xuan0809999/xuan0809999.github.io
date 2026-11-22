'use strict';
// These are Patrol's eight chart coordinates, in the original 448-unit map grid.
const marks=[['母港',267,149],['北岸',329,147],['窄峡',380,162],['东岬',397,223],['南湾',367,278],['松岭',313,284],['西崖',277,239],['金湾',267,191]];
const ctx=drawSurface($('map'),640,380),px=i=>[150+(marks[i][1]-267)*2.2,52+(marks[i][2]-147)*2.08];
const distance=(a,b)=>Math.hypot(marks[a][1]-marks[b][1],marks[a][2]-marks[b][2])*8192/448;
function length(ids){return ids.slice(1).reduce((n,id,i)=>n+distance(ids[i],id),0)}
let route=[0],shortest=null,best=Infinity;
function enumerate(path,rest,total){if(total>=best)return;if(!rest.length){const loop=total+distance(path[path.length-1],0);if(loop<best){best=loop;shortest=path.slice()}return}rest.forEach(i=>enumerate([...path,i],rest.filter(j=>i!==j),total+distance(path[path.length-1],i)))}
enumerate([0],[1,2,3,4,5,6,7],0);
function draw(){ctx.fillStyle='#263e35';ctx.fillRect(0,0,640,380);
 const coast=[[140,40],[215,58],[286,42],[362,51],[405,91],[447,135],[454,199],[423,251],[424,302],[384,331],[325,332],[270,354],[231,317],[203,296],[190,258],[146,239],[166,179],[135,143],[155,98]];
 ctx.save();ctx.translate(295,195);[1.26,1.16,1.08,1].forEach((k,i)=>{ctx.save();ctx.scale(k,k);ctx.beginPath();coast.forEach(([x,y],j)=>j?ctx.lineTo(x-295,y-195):ctx.moveTo(x-295,y-195));ctx.closePath();if(i===3){ctx.fillStyle='#426b65';ctx.fill()}ctx.strokeStyle=i===3?'#99b4a2':'#455e4c';ctx.lineWidth=2;ctx.stroke();ctx.restore()});ctx.restore();
 writing(ctx,'N',608,25,'#cbd8b6',14,'center');strokePath(ctx,[[608,53],[608,35],[604,42]],'#cad6ba',2);writing(ctx,'琥 珀 湖',295,188,'#abc7b5',23,'center');
 strokePath(ctx,route.map(px),'#ffd090',4);if(route.length===8)strokePath(ctx,[px(route[7]),px(0)],'#ffd090',3,[6,7]);
 marks.forEach((m,i)=>{const [x,y]=px(i),seq=route.indexOf(i);disk(ctx,x,y,12,seq<0?'#334b40':'#ffe0a5','#cfddbf');writing(ctx,String(i+1),x,y,seq<0?'#fff2db':'#263d33',14,'center');const left=i===0||i===6||i===7;writing(ctx,m[0],x+(left?-18:18),y,'#fff5db',14,left?'right':'left')});}
function render(){draw();const full=route.length===8,ids=full?[...route,0]:route,metres=length(ids);
 $('order').textContent=ids.map(i=>marks[i][0]).join(' → ');setStats([['已选航标',route.length+' / 8'],[full?'全程直线距离':'已规划距离',(metres/1000).toFixed(2)+' km']]);
 $('undo').disabled=route.length===1;$('fly').hidden=!full;if(full)$('fly').href='../?route='+route.join('')+'#patrol';
 [...$('marks').children].forEach((b,i)=>{b.disabled=route.includes(i);b.setAttribute('aria-pressed',String(route.includes(i)))});note(full?'环线闭合。与最短环线相差 '+Math.max(0,metres-best).toFixed(0)+' 米。':'从图上或按钮选一个还没经过的航标。')}
function add(i){if(!route.includes(i)){route.push(i);render()}}
marks.forEach((m,i)=>{const b=el('button',(i+1)+' '+m[0],'chip');b.onclick=()=>add(i);$('marks').append(b)});
$('map').onclick=e=>{const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)*640/r.width,y=(e.clientY-r.top)*380/r.height;marks.forEach((_,i)=>{const p=px(i);if(Math.hypot(p[0]-x,p[1]-y)<20)add(i)})};
$('undo').onclick=()=>{if(route.length>1)route.pop();render()};$('clear').onclick=()=>{route=[0];render()};$('standard').onclick=()=>{route=marks.map((_,i)=>i);render()};$('optimal').onclick=()=>{route=shortest.slice();render()};render();
