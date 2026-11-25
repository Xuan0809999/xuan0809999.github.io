const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const origin = 'http://127.0.0.1:8181';
(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    for(const [name,width,height] of [['desktop',1440,910],['phone',375,812],['landscape',844,390]]){
      const page=await browser.newPage({viewport:{width,height},reducedMotion:name==='phone'?'reduce':'no-preference'});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(r.status()+' '+r.url())});
      async function open(path){
        await page.goto(origin+path);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow on '+path+' at '+width);
      }
      await open('/');
      assert.equal(await page.locator('.specimen').count(),9);
      const pics=await page.locator('.work-card img,.specimen img').evaluateAll(async imgs=>Promise.all(imgs.map(async im=>{im.loading='eager';await im.decode();return im.naturalWidth})));
      assert.ok(pics.every(x=>x>300));
      await page.screenshot({path:'/tmp/lake-review-'+name+'.jpg',type:'jpeg'});
      await page.locator('#secondPad').click();
      assert.equal(await page.locator('#secondPad').getAttribute('aria-pressed'),'true');
      await page.locator('#secondPad').click();
      assert.equal(await page.locator('#secondPad').getAttribute('aria-pressed'),'false');
      await page.locator('#playPatrol').click();
      assert.equal(await page.locator('#gameSlot iframe').count(),1);
      await page.frameLocator('#gameSlot iframe').locator('canvas').first().waitFor({state:'attached'});
      await page.locator('#closePatrol').click();
      const links=await page.locator('.specimen,.work-card').evaluateAll(a=>a.map(el=>el.getAttribute('href')).filter(h=>h.startsWith('labs/')));
      for(const url of links){
        await open('/'+url);
        await page.locator('h1').waitFor();
        if(url.includes('flight-atlas')){
          await page.locator('#month').selectOption('2');
          await page.locator('#distance').selectOption('long');
          await page.locator('#app').waitFor({state:'visible'});
        }
        if(url.includes('packet-lab')){
          await page.locator('#slow').click();assert.equal(await page.locator('#slow').getAttribute('aria-pressed'),'true');
          await page.locator('#burst').click();
        }
      }
      await open('/network-notes.html');
      await open('/drive/');
      await page.waitForFunction(()=>Boolean(document.querySelector('#world').dataset.renderer),{timeout:20000});
      await page.waitForFunction(()=>clock>0.1);
      await page.screenshot({path:'/tmp/lake-review-drive-'+name+'.jpg',type:'jpeg'});
      await page.locator('#camera').click();await page.locator('#help').click();
      await page.locator('#motor-sound').click();assert.equal(await page.locator('#motor-sound').getAttribute('aria-pressed'),'true');
      await page.locator('#motor-sound').click();await page.locator('#closeHelp').click();
      await page.locator('#nav').selectOption('1');
      const check=await page.evaluate(()=>{let peak=0,difference=0;for(let i=0;i<2400&&route;i++){advance(1/60);peak=Math.max(peak,...wheelLift);difference=Math.max(difference,Math.max(...wheelLift)-Math.min(...wheelLift))}
        return {peak,difference,dist:Math.hypot(car.x-stops3[1].x,car.z-stops3[1].z),engine:document.querySelector('#world').dataset.renderer};});
      assert.ok(check.peak>.25&&check.difference>.09&&check.dist<.05,JSON.stringify(check));
      assert.deepEqual(errors,[]);console.log(name,width,height,check);
      await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
