'use strict';
const passages={zh:['湖面的风停了一会儿，岸边的芦苇还在轻轻摇晃。','骑车经过码头时，我看见一只鹈鹕停在木桩上。','在最后一班地铁到站前，她把路线又核对了一遍。'],en:['Across the quiet lake, a lantern glows beside the pier.','A pelican pedals past the reeds and coasts around the bend.','The last train crosses the bridge before the evening rain.']};
const pad=$('pad'),ctx=drawSurface($('beat'),640,132);
let text='',start=null,last=null,gaps=[],done=false,composing=false,lastKey=-Infinity,lastValue='';
function paintText(){const letters=Array.from(pad.value),base=Array.from(text);$('sample').replaceChildren(...base.map((c,i)=>el('span',c,i>=letters.length?'':(letters[i]===c?'ok':'err'))))}
function record(now){if(done)return;if(start===null)start=now;if(last!==null)gaps.push(now-last);last=now}
function update(now=performance.now()){
 const input=Array.from(pad.value),base=Array.from(text),matched=input.filter((c,i)=>c===base[i]).length;
 const elapsed=start===null?0:Math.max(.001,(now-start)/1000),sorted=gaps.slice().sort((a,b)=>a-b);
 const m=sorted.length,median=m?(sorted[(m-1)>>1]+sorted[m>>1])/2:0;
 setStats([['用时',elapsed.toFixed(1)+' 秒'],['输入速度',elapsed>=.5?Math.round(input.length*60/elapsed)+' 字符/分':'—'],['当前准确率',input.length?Math.round(100*matched/input.length)+'%':'—'],['典型间隔',m?Math.round(median)+' ms':'—']]);
 ctx.fillStyle='#203b32';ctx.fillRect(0,0,640,132);
 const recent=gaps.slice(-32),highest=Math.max(1500,...recent);
 strokePath(ctx,[[12,111],[628,111]],'#6d8271',1);
 if(!recent.length){writing(ctx,'等待输入节拍',320,65,'#b5c9ae',19,'center');return}
 recent.forEach((v,i)=>{const x=18+i*19,h=Math.max(3,v/highest*84);ctx.fillStyle=v>1000?'#efb879':'#a8ceb0';ctx.fillRect(x,110-h,10,h)});
 writing(ctx,'最近 '+recent.length+' 次间隔',14,16,'#cfdabf',13);
}
function stop(){if(done||start===null)return;done=true;pad.readOnly=true;$('finish').disabled=true;update();const pauses=gaps.filter(x=>x>1000).length;note((pad.value===text?'整段完成。':'本次练习已结束。')+(gaps.length?'超过一秒的停顿有 '+pauses+' 次，最长间隔 '+(Math.max(...gaps)/1000).toFixed(2)+' 秒。':'再多输入几个字，就能看出节拍变化。'))}
function reset(){const options=passages[$('language').value];text=pick(options.filter(s=>s!==text));start=last=null;gaps=[];done=composing=false;lastKey=-Infinity;lastValue='';pad.readOnly=false;pad.value='';$('finish').disabled=true;paintText();update();note('输入第一个字开始。');}
pad.addEventListener('keydown',e=>{if(done||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;if(e.key.length===1||['Backspace','Delete','Process','Unidentified'].includes(e.key)){lastKey=performance.now();record(lastKey);update(lastKey)}});
function changed(){if(done||composing||pad.value===lastValue)return;lastValue=pad.value;const now=performance.now();if(start===null||now-lastKey>220)record(now);paintText();update(now);$('finish').disabled=start===null;if(pad.value===text)stop();else note('正在记录，可随时结束并查看结果。')}
pad.addEventListener('compositionstart',()=>{composing=true});pad.addEventListener('compositionend',()=>{composing=false;changed()});pad.addEventListener('input',e=>{if(!e.isComposing)changed()});
for(const name of ['paste','drop'])pad.addEventListener(name,e=>{e.preventDefault();note('请手动输入这段文字，才能记录节拍。')});
$('finish').onclick=stop;$('again').onclick=()=>{reset();pad.focus()};$('language').onchange=reset;setInterval(()=>{if(!done&&start!==null&&!document.hidden)update()},500);reset();
