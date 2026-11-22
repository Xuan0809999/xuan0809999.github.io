'use strict';
const $ = id => document.getElementById(id);
const el = (tag, text, cls) => { const node=document.createElement(tag); if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node; };
function setStats(items){const box=$('stats');box.replaceChildren();for(const [name,value] of items){const pair=el('div');pair.append(el('dt',name),el('dd',value));box.append(pair)}}
function note(message){$('status').textContent=message}
function drawSurface(canvas, width, height){
  const ratio=Math.min(2,Math.max(1,window.devicePixelRatio||1));
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
  canvas.style.aspectRatio=width+'/'+height;
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);return ctx;
}
function strokePath(ctx,points,color,weight=2,dash=[]){if(!points.length)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.restore()}
function disk(ctx,x,y,r,fill,edge){ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=2;ctx.stroke()}}
function writing(ctx,str,x,y,color='#eef2df',size=15,align='left'){ctx.save();ctx.fillStyle=color;ctx.font='600 '+size+'px system-ui,sans-serif';ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(str,x,y);ctx.restore()}
function pick(items){return items[Math.floor(Math.random()*items.length)]}
function shuffle(items){const copy=items.slice();for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
