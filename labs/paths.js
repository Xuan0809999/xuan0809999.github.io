'use strict';
const coords=[[48,162],[163,58],[168,255],[300,144],[375,46],[418,265],[529,150],[613,75]];
const labels=['码头','A','B','C','D','E','F','灯塔'],pairs=[[0,1],[0,2],[0,3],[1,3],[1,4],[2,3],[2,5],[3,4],[3,5],[3,6],[4,6],[4,7],[5,6],[6,7]];
const canvas=$('graph'),ctx=drawSurface(canvas,660,316);let edges,route,solution=null;
const metric=()=>$('metric').value,unit=()=>metric()==='dist'?' m':' 分';
function newMap(){edges=pairs.map(([a,b])=>{const l=Math.hypot(coords[a][0]-coords[b][0],coords[a][1]-coords[b][1]);return {a,b,dist:Math.round((l*.6+Math.random()*110)/5)*5,time:1+Math.floor(Math.random()*8)}});reset()}
function neighbors(id){return edges.filter(e=>e.a===id||e.b===id).map(e=>[e.a===id?e.b:e.a,e[metric()]])}
function cost(ids){let n=0;for(let i=1;i<ids.length;i++)n+=neighbors(ids[i-1]).find(p=>p[0]===ids[i])[1];return n}
function solve(){const dist=coords.map(()=>Infinity),previous=coords.map(()=>-1),seen=new Set();dist[0]=0;while(seen.size<coords.length){let u=-1;for(let i=0;i<dist.length;i++)if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u===7)break;seen.add(u);for(const [v,w] of neighbors(u)){if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;previous[v]=u}}}const path=[];for(let k=7;k>=0;k=previous[k])path.unshift(k);return path}
function draw(){ctx.fillStyle='#233e38';ctx.fillRect(0,0,660,316);for(let y=10;y<316;y+=22)for(let x=12;x<660;x+=22){ctx.fillStyle='#3c5b4e';ctx.fillRect(x,y,1,1)}
 edges.forEach(e=>strokePath(ctx,[coords[e.a],coords[e.b]],'#6f8d7a',3));strokePath(ctx,route.map(i=>coords[i]),'#f2bc71',6);if(solution)strokePath(ctx,solution.map(i=>coords[i]),'#97dfce',3,[6,6]);
 edges.forEach(e=>{const a=coords[e.a],b=coords[e.b],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;const value=String(e[metric()]);ctx.fillStyle='#233e38';ctx.fillRect(x-16,y-10,32,20);writing(ctx,value,x,y,'#efe8cc',14,'center')});
 coords.forEach(([x,y],i)=>{disk(ctx,x,y,i===0||i===7?22:15,route.includes(i)?'#f7d49c':'#d5e0c2','#29463b');writing(ctx,labels[i],x,y,'#243e35',i===0||i===7?13:16,'center')});}
function reset(){route=[0];solution=null;render()}
function choose(id){if(solution||route.includes(id)||!neighbors(route[route.length-1]).some(([i])=>i===id))return;route.push(id);if(id===7)solution=solve();render()}
function render(){draw();const last=route[route.length-1],available=neighbors(last).filter(([i])=>!route.includes(i));$('trail').textContent=route.map(i=>labels[i]).join(' → ');$('back').disabled=route.length===1;$('next').replaceChildren();if(!solution)available.forEach(([i,w])=>{const b=el('button',labels[i]+' · '+w+unit(),'chip');b.onclick=()=>choose(i);$('next').append(b)});else $('next').textContent='已到达灯塔。';
 const mine=cost(route),best=solution?cost(solution):null;setStats([['我的累计代价',mine+unit()],['最优代价',best===null?'抵达后揭晓':best+unit()]]);$('answer').textContent=solution?'Dijkstra 算出的路线：'+solution.map(i=>labels[i]).join(' → '):'';
 note(solution?(mine===best?'你找到了最优路线。':'已抵达。比最优路线多 '+(mine-best)+unit()+'。'):available.length?'选择与当前位置相连的路口。':'这条路走到尽头了，撤回一步再试。')}
canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*660/r.width,y=(e.clientY-r.top)*316/r.height;coords.forEach(([cx,cy],i)=>{if(Math.hypot(cx-x,cy-y)<24)choose(i)})};
$('back').onclick=()=>{if(route.length>1)route.pop();solution=null;render()};$('retry').onclick=reset;$('fresh').onclick=newMap;$('metric').onchange=reset;newMap();
