'use strict';
const names=['石头','布','剪刀'],short=['石','布','剪'];let history=[],forecast,wins=0,losses=0,hits=0;
function predict(){
 for(const n of [2,1,0]){const counts=[0,0,0],len=history.length;for(let i=n;i<len;i++){let same=true;for(let k=0;k<n;k++)if(history[i-n+k]!==history[len-n+k])same=false;if(same)counts[history[i]]++}
  const samples=counts.reduce((a,b)=>a+b,0);if(samples<(n?2:1))continue;const high=Math.max(...counts);const guess=pick([0,1,2].filter(i=>counts[i]===high));return {guess,counter:(guess+1)%3,why:n?'按近期的 '+n+' 手组合':'按此前的总频率'}}
 const guess=pick([0,1,2]);return {guess,counter:(guess+1)%3,why:'首轮随机预测'}
}
function score(){const n=history.length;setStats([['你赢',wins+' 局'],['电脑赢',losses+' 局'],['平局',(n-wins-losses)+' 局'],['电脑猜中',hits+' / '+n]])}
function play(choice){if(history.length>=12)return;const f=forecast,result=(choice-f.counter+3)%3,match=choice===f.guess;
 if(result===1)wins++;if(result===2)losses++;if(match)hits++;history.push(choice);
 $('turn').textContent='第 '+history.length+' / 12 手';$('verdict').textContent=['平局','你赢了这一手','电脑赢了这一手'][result];
 $('detail').textContent='你出'+names[choice]+'，电脑出'+names[f.counter]+'。它'+f.why+'，提前猜你会出'+names[f.guess]+'。';
 const chip=el('span',history.length+' · '+short[choice]+' / '+short[f.counter]);chip.title='你 / 电脑';$('history').append(chip);score();
 if(history.length===12){document.querySelectorAll('[data-move]').forEach(b=>b.disabled=true);note('挑战结束。电脑猜中了 '+hits+' 手（'+Math.round(hits/12*100)+'%）。'+(wins>losses?'本场你胜。':wins<losses?'本场电脑胜。':'本场平局。'))}
 else{forecast=predict();note('第 '+(history.length+1)+' 手的电脑出招已锁定。')}
}
function reset(){history=[];wins=losses=hits=0;forecast=predict();$('history').replaceChildren();$('turn').textContent='第 1 / 12 手';$('verdict').textContent='这一手你选什么？';$('detail').textContent='十二手之后揭晓预测命中率。';document.querySelectorAll('[data-move]').forEach(b=>b.disabled=false);score();note('电脑已锁定第一手。')}
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>play(Number(b.dataset.move)));$('restart').onclick=reset;reset();
