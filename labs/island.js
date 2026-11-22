'use strict';
(() => {
  const canvas=document.getElementById('postcard'), ctx=canvas.getContext('2d',{willReadFrequently:true});
  const field=document.getElementById('islandName'), status=document.getElementById('saveStatus'), save=document.getElementById('saveCard');
  const tau=Math.PI*2, mapBox={x:23,y:22,w:914,h:470};
  const palettes=[
    {name:'松湾',water:['#20565b','#29696b','#367d79','#569c8e'],land:['#f1d69b','#c8cb8b','#99aa70','#778e5b','#69805b','#a6a481','#d5c9aa'],tree:'#305e4e'},
    {name:'青岬',water:['#284e65','#306878','#408794','#5b9a9d'],land:['#efd9a8','#b8c992','#91ae83','#69977c','#587e71','#93a79b','#d3cdb8'],tree:'#26594f'},
    {name:'金屿',water:['#295a60','#346c6e','#4a8882','#74a597'],land:['#f4daa0','#d3c483','#b8b376','#97a06c','#7f8c63','#a79f78','#d7cba9'],tree:'#4c6342'},
    {name:'苍湾',water:['#304c61','#3e697a','#548494','#79a3a5'],land:['#eddbb0','#c6c697','#a5ac80','#869478','#75866e','#a3a38b','#d1c8ae'],tree:'#435d50'}
  ];
  let activeName='',objectURL='',version=0;
  function hash(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0}
  function prng(seed){return ()=>{seed=(seed+0x6d2b79f5)>>>0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}}
  function noise(r){const n=48,table=Array.from({length:n*n},r);return (x,y)=>{let i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;a*=a*(3-2*a);b*=b*(3-2*b);const at=(u,v)=>table[((j+v+n)%n)*n+(i+u+n)%n];return (at(0,0)*(1-a)+at(1,0)*a)*(1-b)+(at(0,1)*(1-a)+at(1,1)*a)*b}}
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  function line(points,color,size=1){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
  function poly(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
  function text(s,x,y,font,color='#293c34',align='left',width){ctx.fillStyle=color;ctx.font=font;ctx.textAlign=align;ctx.textBaseline='alphabetic';if(width)ctx.fillText(s,x,y,width);else ctx.fillText(s,x,y)}
  function makeTerrain(seed,pal){
    const r=prng(seed),n=noise(r),w=740,h=380,z=new Float32Array(w*h);
    const radius=new Float32Array(2048),phase=Array.from({length:6},()=>r()*tau),asym=.11+r()*.18;
    for(let k=0;k<radius.length;k++){const a=k*tau/radius.length;radius[k]=.91+asym*Math.cos(2*a+phase[0])+.15*Math.cos(3*a+phase[1])+.085*Math.cos(5*a+phase[2])+.037*Math.sin(9*a+phase[3])}
    const rot=(r()-.5)*1.25,cr=Math.cos(rot),sr=Math.sin(rot),wide=.28+r()*.045,high=.31+r()*.04;
    const reef=Array.from({length:2+Math.floor(r()*3)},()=>{const a=r()*tau;return [.50+Math.cos(a)*(.31+r()*.07),.5+Math.sin(a)*(.31+r()*.055),.023+r()*.034,.035+r()*.04]});
    const p=pal.water.concat(pal.land).map(rgb),thresholds=[-.53,-.26,-.10,0,.074,.18,.34,.52,.69,.82];
    function band(v){let j=0;while(j<thresholds.length&&v>=thresholds[j])j++;return j}
    const surface=document.createElement('canvas');surface.width=w;surface.height=h;const paint=surface.getContext('2d');const image=paint.createImageData(w,h);
    for(let y=0;y<h;y++){const v=y/(h-1);for(let x=0;x<w;x++){const u=x/(w-1),a=(u-.5)/wide,b=(v-.5)/high,ex=cr*a+sr*b*.69,ey=-sr*a/.69+cr*b;
      const idx=Math.floor((Math.atan2(ey,ex)/tau+1)*2048)&2047;
      const coarse=(n(u*7+2,v*6+3)-.5)*.26,fine=(n(u*25+1,v*18+2)-.5)*.10;
      let e=(1-Math.hypot(ex,ey)/radius[idx])*.83+coarse+fine+(n(u*5+9,v*4+7)-.45)*.20;
      for(const [cx,cy,rx,ry] of reef){const dx=(u-cx)/rx,dy=(v-cy)/ry;if(Math.abs(dx)<2.8&&Math.abs(dy)<2.8)e=Math.max(e,.27*(1-Math.hypot(dx,dy))+fine*.65)}
      z[y*w+x]=e;
    }}
    for(let y=0;y<h;y++){for(let x=0;x<w;x++){const i=y*w+x,e=z[i],k=band(e),near=z[x?i-1:i],above=z[y?i-w:i],c=p[k];
      let shade=(r()-.5)*9+(e>0?Math.max(-9,Math.min(9,(e-above)*225)):0);
      if((near<0)!==(e<0)||(above<0)!==(e<0))shade=e>=0?-27:11;
      else if(near!==e&&e>.13&&Math.floor(e*13)!==Math.floor(near*13))shade-=26;
      else if(k!==band(above)&&e<0)shade+=9;
      const o=i*4;for(let j=0;j<3;j++)image.data[o+j]=Math.max(0,Math.min(255,c[j]+shade));image.data[o+3]=255;
    }}
    paint.putImageData(image,0,0);
    return {surface,height:(u,v)=>z[Math.max(0,Math.min(h-1,Math.round(v*(h-1))))*w+Math.max(0,Math.min(w-1,Math.round(u*(w-1))))],forestNoise:n}
  }
  function tree(x,y,s,color){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line([[0,0],[0,-8]],'#526049',.8);poly([[-4,-2],[0,-10],[4,-2]],color);poly([[-3.1,-5],[0,-12],[3.1,-5]],color);line([[-2,-4],[-.5,-6]],'#b6c894',.6);ctx.restore()}
  function lighthouse(x,y){ctx.save();ctx.translate(x,y);ctx.scale(.94,.94);ctx.fillStyle='#536c52';ctx.beginPath();ctx.ellipse(3,2,15,4,.12,0,tau);ctx.fill();poly([[-7,1],[-4,-28],[4,-28],[7,1]],'#f7eacb');poly([[1,1],[2,-28],[4,-28],[7,1]],'#b1aa86');poly([[-5.5,-8],[-5,-15],[5,-15],[6,-8]],'#b85432');ctx.fillStyle='#364d43';ctx.fillRect(-5,-31,10,5);ctx.fillStyle='#edbc6c';ctx.fillRect(-2,-30,4,3);poly([[-7,-31],[0,-37],[7,-31]],'#ac4a31');line([[-7,-25],[7,-25]],'#445646',1.5);ctx.fillStyle='#455344';ctx.fillRect(-1,-5,3,6);ctx.restore()}
  function compass(x,y){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#d2d5b5';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,16,0,tau);ctx.stroke();poly([[0,-22],[4,1],[0,0],[-4,1]],'#f5db9b');poly([[0,20],[-3,-1],[0,0],[3,-1]],'#95ae9f');line([[-20,0],[20,0]],'#b5c4aa',.7);text('N',0,-27,'bold 11px Georgia','#eedcac','center');ctx.restore()}
  function drawStamp(x,y,pal){ctx.save();ctx.translate(x,y);ctx.fillStyle='#e5ddc0';ctx.fillRect(0,0,58,65);ctx.strokeStyle='#7b8874';ctx.lineWidth=1.3;ctx.setLineDash([2,2]);ctx.strokeRect(2,2,54,61);ctx.setLineDash([]);ctx.fillStyle=pal.water[1];ctx.fillRect(7,7,44,49);ctx.fillStyle='#edd294';ctx.beginPath();ctx.arc(36,22,7,0,tau);ctx.fill();poly([[7,46],[21,28],[31,41],[39,34],[51,47],[51,56],[7,56]],'#aec69b');for(let j=0;j<3;j++){const path=[];for(let k=0;k<49;k++)path.push([-34+k,41+j*4+Math.sin(k/6)*2]);line(path,'#46554894',.85)}ctx.restore()}
  function paint(name){
    const seed=hash(name),r=prng(seed^0xc291f273),pal=palettes[Math.floor(r()*palettes.length)],terrain=makeTerrain(seed,pal);
    // A fixed print resolution keeps the island independent of screen size.
    canvas.width=1440;ctx.setTransform(1.5,0,0,1.5,0,0);ctx.fillStyle='#f4ecd6';ctx.fillRect(0,0,960,640);
    const box=mapBox;ctx.save();ctx.translate(box.x,box.y);ctx.drawImage(terrain.surface,0,0,box.w,box.h);
    const pos=(u,v)=>[u*box.w,v*box.h];
    for(let i=0;i<1450;i++){const u=r(),v=r();if(terrain.height(u,v)>-.09)continue;const [x,y]=pos(u,v),len=2+r()*9;
      line([[x,y],[Math.min(box.w,x+len*.4),y-.7],[Math.min(box.w,x+len),y+.25]],i%3?'#c6d2ab42':'#0b424b48',.55+r()*.5)}
    let tower=null,best=-Infinity;const target=r()*tau,tx=.5+Math.cos(target)*.29,ty=.5+Math.sin(target)*.30;
    for(let i=0;i<5500;i++){const u=.09+.82*r(),v=.10+.82*r(),e=terrain.height(u,v);if(e<.075||e>.22)continue;
      const score=-2.8*Math.hypot(u-tx,v-ty)-Math.abs(e-.13);if(score>best){best=score;tower=[u,v]}}
    if(!tower)tower=[.50,.50];
    const trees=[];for(let i=0;i<1900;i++){const u=r(),v=r(),e=terrain.height(u,v);if(e<.18||e>.69||terrain.forestNoise(u*13+5,v*12+5)<.38||Math.hypot((u-tower[0])*2,v-tower[1])<.064)continue;
      const [x,y]=pos(u,v);trees.push([x,y,.42+r()*.52])}
    trees.sort((a,b)=>a[1]-b[1]);trees.forEach(([x,y,s])=>tree(x,y,s,pal.tree));
    for(let i=0;i<1700;i++){const u=r(),v=r(),e=terrain.height(u,v);if(e<.54)continue;const [x,y]=pos(u,v);line([[x,y],[x+1.6,y-2.2]],'#455c4d69',.6)}
    lighthouse(...pos(...tower));compass(box.w-46,60);ctx.restore();
    ctx.lineWidth=1.5;ctx.strokeStyle='#486653';ctx.strokeRect(box.x,box.y,box.w,box.h);
    const code=seed.toString(16).toUpperCase().padStart(8,'0');
    for(let i=0;i<960;i++){const x=r()*960,y=496+r()*144;ctx.fillStyle='#8e765419';ctx.fillRect(x,y,.9,.7)}
    text('海 岛 明 信 片',26,524,'bold 16px sans-serif','#62644c');
    text(name+' 岛',24,577,'bold 43px Georgia,"Microsoft YaHei",sans-serif','#233e33','left',776);
    line([[25,592],[935,592]],'#a5a68b',.85);
    text('MINGXUAN  /  ISLAND ATLAS',26,619,'bold 13px monospace','#4a6451');
    text('MX–'+code,934,619,'bold 14px monospace','#4a6451','right');drawStamp(877,515,pal);
    canvas.setAttribute('aria-label',name+' 岛的明信片，'+pal.name+'色系，图号 MX-'+code);
    document.getElementById('islandTitle').textContent=name+' 岛';
    document.getElementById('islandFacts').textContent=pal.name+'色系 · 图号 MX-'+code;
  }
  function release(){if(objectURL){URL.revokeObjectURL(objectURL);objectURL=''}}

  function generate(){
    const name=field.value.normalize('NFC').trim().replace(/\s+/gu,' ');
    if(!name){field.setCustomValidity('先输入一个名字。');field.reportValidity();return}
    field.setCustomValidity('');field.value=name;
    const ticket=++version;
    release();save.removeAttribute('href');save.setAttribute('aria-disabled','true');
    activeName=name;paint(name);status.textContent='正在准备明信片图片。';
    canvas.toBlob(blob=>{
      if(ticket!==version)return;
      if(!blob){status.textContent='图片未生成，请再点一次「生成我的岛」。';return}
      objectURL=URL.createObjectURL(blob);save.href=objectURL;
      save.download='island-'+name.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_')+'.png';
      save.removeAttribute('aria-disabled');status.textContent='明信片已生成，可保存为 1440 × 960 的 PNG。'
    },'image/png')
  }
  document.getElementById('nameForm').onsubmit=e=>{e.preventDefault();generate()};
  field.oninput=()=>{field.setCustomValidity('');status.textContent='点击「生成我的岛」应用新名字。'};
  save.onclick=e=>{
    if(!objectURL){e.preventDefault();return}
    status.textContent='已准备好 '+activeName+' 岛的明信片。';
    const open=document.createElement('a');open.href=objectURL;open.target='_blank';open.rel='noopener';open.textContent='打开 PNG 图片';status.append(open)
  };
  window.addEventListener('pagehide',e=>{if(!e.persisted)release()});generate()
})();