'use strict';
const stops=['海堤','鱼市','旧城','书院','灯塔'],points=[[61,204],[177,204],[296,137],[427,137],[542,85]],ctx=drawSurface($('rail'),604,277);
const colors=['#fcaa7d','#99dad1'],trainNames=['珊瑚号','海青号'];let minute,delivered,queues,trains,rng;
function random(){rng=(Math.imul(1664525,rng)+1013904223)>>>0;return rng/4294967296}
function arrivals(count){for(let i=0;i<count;i++){const station=Math.floor(random()*5),others=[0,1,2,3,4].filter(j=>j!==station);queues[station].push(others[Math.floor(random()*4)])}}
function reset(){minute=delivered=0;rng=921;queues=stops.map(()=>[]);trains=[{at:0,people:[],dir:1},{at:4,people:[],dir:-1}];arrivals(13);$('tick').disabled=false;note('早班开始。按站台去向分配车次，列车到站会自动下客。');render()}
function counts(i){return [queues[i].filter(n=>n<i).length,queues[i].filter(n=>n>i).length]}
function opts(n){const t=trains[n],select=$(n?'trainB':'trainA');select.replaceChildren();for(const d of [-1,0,1]){if(t.at+d<0||t.at+d>4)continue;const label=d?'开往'+stops[t.at+d]:'本分钟停站';const e=el('option',label);e.value=d;select.append(e)}
 if(t.at+t.dir<0||t.at+t.dir>4)t.dir=-t.dir;select.value=String(t.dir);select.disabled=minute>=14;select.setAttribute('aria-label',trainNames[n]+' 在'+stops[t.at]+'站，选择方向')}
function render(){ctx.fillStyle='#213d37';ctx.fillRect(0,0,604,277);for(let y=16;y<277;y+=20)for(let x=14;x<604;x+=20){ctx.fillStyle='#365249';ctx.fillRect(x,y,1.5,1.5)}strokePath(ctx,points,'#688876',12);strokePath(ctx,points,'#efe0af',4);points.forEach(([x,y],i)=>{disk(ctx,x,y,9,'#f5e2b8','#263e34');writing(ctx,stops[i],x,y+24,'#f2eed4',14,'center');const n=queues[i].length;writing(ctx,n+' 人',x,y+44,'#bdd5bb',13,'center')});
 trains.forEach((t,i)=>{const [x,y]=points[t.at],ty=y-27-(i===1&&trains[0].at===t.at?26:0);ctx.fillStyle=colors[i];ctx.fillRect(x-29,ty-10,58,20);writing(ctx,(i?'B':'A')+' '+t.people.length+'/6',x,ty,'#213a33',13,'center');opts(i)});
 $('platforms').replaceChildren(...stops.map((s,i)=>{const tr=el('tr');[s,...counts(i)].forEach(v=>tr.append(el('td',String(v))));return tr}));setStats([['值班进度',minute+' / 14 分'],['已送达',delivered+' / 18 人'],['珊瑚号乘客',trains[0].people.length+' / 6'],['海青号乘客',trains[1].people.length+' / 6']])}
function advance(){if(minute>=14)return;const dir=[Number($('trainA').value),Number($('trainB').value)];
 const edge=trains.map((t,i)=>dir[i]?[t.at,t.at+dir[i]].sort().join('-'):'');
 if(edge[0]&&edge[0]===edge[1]){note('两列车申请了同一个区间。让其中一列停站，或改变方向后再发车。');return}
 let boarded=0,off=0;trains.forEach((t,i)=>{const d=dir[i];if(!d)return;t.dir=d;const left=[];for(const dest of queues[t.at]){if(t.people.length<6&&Math.sign(dest-t.at)===d){t.people.push(dest);boarded++}else left.push(dest)}queues[t.at]=left;t.at+=d;off+=t.people.filter(p=>p===t.at).length;t.people=t.people.filter(p=>p!==t.at)});
 delivered+=off;minute++;if(minute<14)arrivals(2+(minute%3===0?1:0));render();
 if(minute===14){$('tick').disabled=true;note('值班结束，共送达 '+delivered+' 人。'+(delivered>=18?'已达到十八人的目标！':'再试试优先前往候车人数多的站。'))}else note('第 '+minute+' 分钟，'+boarded+' 人上车，'+off+' 人到达目的地。')}
$('new').onclick=reset;$('tick').onclick=advance;reset();
