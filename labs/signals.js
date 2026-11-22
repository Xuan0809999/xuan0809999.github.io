'use strict';
(() => {
  // Each series is an authored, simulated day. One sample per whole hour.
  const cases = [
    {answer:'食堂进餐客流', alternatives:['太阳能板输出','宿舍用电'], values:[0,0,0,0,0,2,9,48,66,15,8,45,100,55,13,7,19,60,87,37,10,3,1,0,0], clues:[[12,'午餐时达到全天最高点。'],[18,'晚餐时出现第二个大峰，两餐之间迅速回落。']], why:'这一天有早、中、晚三段短促的高峰，形状最符合设定里的食堂。'},
    {answer:'宿舍楼用电', alternatives:['食堂进餐客流','校园巴士上车人数'], values:[55,39,28,23,20,20,22,35,46,32,29,31,36,33,29,28,31,39,50,65,79,94,100,81,58], clues:[[4,'凌晨仍有持续的基础用电。'],[22,'晚间不断攀升，到 22 时才见顶。']], why:'模拟中的宿舍在同学们回楼后逐步变忙，峰值明显晚于晚餐。'},
    {answer:'校园巴士上车人数', alternatives:['图书馆在馆人数','宿舍楼用电'], values:[0,0,0,0,0,1,11,63,100,33,17,18,24,20,19,25,47,91,74,26,12,4,1,0,0], clues:[[8,'早班通勤造成尖锐的上车高峰。'],[17,'下午再出现一轮集中乘车，中午则平缓。']], why:'这里设定的是一条通勤线，早上进校、傍晚离校带来两个高峰。'},
    {answer:'太阳能板输出', alternatives:['校园巴士上车人数','自习室预约量'], values:[0,0,0,0,0,0,2,11,29,50,72,91,100,96,81,62,38,17,3,0,0,0,0,0,0], clues:[[6,'清晨才开始有输出。'],[12,'正午附近是宽阔的单峰，入夜后回到零。']], why:'这是模拟晴天的光伏曲线，变化随日照连续上升、再下降。'},
    {answer:'图书馆在馆人数', alternatives:['食堂进餐客流','屋顶光伏输出'], values:[0,0,0,0,0,0,0,0,4,29,54,66,58,64,81,92,96,89,74,78,81,64,8,0,0], clues:[[16,'下午处于持续数小时的高位。'],[22,'闭馆前后人数快速降到接近零。']], why:'这里数的是馆里现有的人，座位逐渐坐满，所以高位持续得比进餐队列更久。'},
    {answer:'定时灌溉用水', alternatives:['宿舍楼用电','图书馆在馆人数'], values:[0,0,0,0,0,83,83,0,0,0,0,0,0,0,0,0,0,0,0,83,83,0,0,0,0], clues:[[5,'清晨突然开始，并保持恒定流量。'],[19,'傍晚以几乎一模一样的高度和时长再运行一次。']], why:'两段整齐的平台来自定时开关阀门，其余时段没有灌溉用水。'}
  ];
  const byId = id => document.getElementById(id);
  const canvas = byId('signalPlot');
  const ctx = canvas.getContext('2d');
  let deck, round, choice, records, inspected, geometry;
  const current = () => deck[round];
  const stamp = h => String(h).padStart(2,'0')+':00';
  function draw(){
    const rect=canvas.getBoundingClientRect(), w=rect.width, h=rect.height;
    if(!w||!h)return;
    const scale=Math.min(2,window.devicePixelRatio||1);
    if(canvas.width!==Math.round(w*scale)||canvas.height!==Math.round(h*scale)){canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale)}
    ctx.setTransform(scale,0,0,scale,0,0);
    const left=37,right=w-17,top=27,bottom=h-30,vals=current().values;
    geometry={left,right};
    const X=i=>left+(right-left)*i/24, Y=v=>bottom-(bottom-top)*v/100;
    ctx.fillStyle='#f7f0dc';ctx.fillRect(0,0,w,h);
    ctx.lineWidth=1;ctx.font='12px system-ui,sans-serif';ctx.textBaseline='middle';
    for(const level of [0,25,50,75,100]){ctx.strokeStyle='#d6ccaf';ctx.setLineDash(level?[2,4]:[]);ctx.beginPath();ctx.moveTo(left,Y(level));ctx.lineTo(right,Y(level));ctx.stroke();ctx.fillStyle='#50594a';ctx.textAlign='right';ctx.fillText(String(level),left-6,Y(level))}
    ctx.setLineDash([]);ctx.textAlign='center';
    for(const t of [0,6,12,18,24]){ctx.fillText(stamp(t),X(t),bottom+15)}
    ctx.fillStyle='#6a624b';ctx.textAlign='left';ctx.fillText('相对强度',left,11);
    ctx.beginPath();ctx.moveTo(X(0),bottom);vals.forEach((v,i)=>ctx.lineTo(X(i),Y(v)));ctx.lineTo(right,bottom);ctx.closePath();ctx.fillStyle='#e9a56d58';ctx.fill();
    ctx.beginPath();vals.forEach((v,i)=>i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)));ctx.strokeStyle='#ad492c';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
    const ix=X(inspected),iy=Y(vals[inspected]);ctx.beginPath();ctx.moveTo(ix,top);ctx.lineTo(ix,bottom);ctx.strokeStyle='#4e695c';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#294c40';ctx.beginPath();ctx.arc(ix,iy,4,0,2*Math.PI);ctx.fill();
    if(choice!==null){current().clues.forEach(([i],k)=>{const x=X(i),y=Y(vals[i]);ctx.fillStyle='#284e40';ctx.beginPath();ctx.arc(x,y,10,0,2*Math.PI);ctx.fill();ctx.fillStyle='#fff9df';ctx.font='bold 12px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(String(k+1),x,y)})}
  }
  function read(hour){inspected=hour;byId('hour').value=hour;const value=stamp(hour)+' · '+current().values[hour];byId('reading').textContent=value;byId('hour').setAttribute('aria-valuetext',value);draw()}
  function showQuestion(){
    const c=current();choice=null;byId('recap').hidden=true;byId('round').textContent='第 '+(round+1)+' / '+deck.length+' 题';score();
    byId('resultTitle').textContent='读图提示';byId('resultText').textContent='先找峰值和低谷，再观察它们持续了多久。';byId('clues').replaceChildren();byId('nextRound').hidden=true;
    byId('options').replaceChildren(...shuffle([c.answer,...c.alternatives]).map(label=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=label;b.onclick=()=>guess(label);return b}));read(12)
  }
  function score(){byId('score').textContent='答对 '+records.filter(r=>r.correct).length+' / 已答 '+records.length}
  function guess(answer){
    if(choice!==null)return;
    choice=answer;const c=current(),correct=answer===c.answer;records.push({answer:c.answer,chosen:answer,correct});score();
    for(const b of byId('options').children){const label=b.textContent;b.disabled=true;if(label===c.answer||label===answer){b.dataset.result=label===c.answer?'correct':'wrong';b.append(el('small',label===c.answer?'正确答案':'你的选择'))}}
    byId('resultTitle').textContent=correct?'猜对了 · '+c.answer:'答案是'+c.answer;byId('resultText').textContent=c.why;
    byId('clues').replaceChildren(...c.clues.map(([i,detail])=>el('li',stamp(i)+'，强度 '+c.values[i]+'。'+detail)));
    const next=byId('nextRound');next.hidden=false;next.textContent=round===deck.length-1?'查看总成绩':'下一题';draw()
  }
  function finish(){
    byId('resultTitle').textContent='本轮答对 '+records.filter(r=>r.correct).length+' / '+deck.length+' 题';byId('resultText').textContent='换一轮可以重新观察这些曲线。';byId('clues').replaceChildren();
    byId('recap').hidden=false;byId('recapList').replaceChildren(...records.map(r=>el('li',r.correct?r.answer+' · 猜对':r.answer+' · 你选了'+r.chosen)));byId('nextRound').textContent='再来一轮'
  }
  function restart(){deck=shuffle(cases);round=0;records=[];showQuestion()}
  byId('nextRound').onclick=()=>{if(!byId('recap').hidden){restart();byId('options').firstElementChild.focus()}else if(round+1===deck.length)finish();else{round++;showQuestion();byId('options').firstElementChild.focus()}};
  byId('hour').oninput=e=>read(Number(e.target.value));
  function seek(e){if(!geometry)return;const x=e.clientX-canvas.getBoundingClientRect().left;read(Math.max(0,Math.min(24,Math.round(24*(x-geometry.left)/(geometry.right-geometry.left)))))}
  canvas.onpointerdown=seek;canvas.onpointermove=e=>{if(e.pointerType==='mouse'||e.buttons===1)seek(e)};
  restart();if('ResizeObserver' in window)new ResizeObserver(draw).observe(canvas);else window.addEventListener('resize',draw)
})();