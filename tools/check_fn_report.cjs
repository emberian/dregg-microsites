const puppeteer = require('puppeteer-core');
const fs = require('node:fs');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const qa=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'fn-report-ui-'));
const crypto=require('node:crypto');
const slug='a-promise-that-survives';
const base='file://'+root+'/'+slug+'/';
(async()=>{
 const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const results={browser:await browser.version(),node:process.version,puppeteer:require('puppeteer-core/package.json').version,checks:[]};
 function check(name,ok,details){results.checks.push({name,ok,details});if(!ok)throw Error(name+': '+JSON.stringify(details));}
 try {
  await page.setViewport({width:1440,height:1000,deviceScaleFactor:1});
  await page.goto(base+'index.html',{waitUntil:'networkidle0'});
  await page.screenshot({path:path.join(qa,'desktop.png')});
  check('desktop has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const hrefs=await page.$$eval('a[href]',els=>els.map(e=>e.getAttribute('href')));
  for(const href of hrefs){
   if(/^https?:/.test(href))continue;
   const url=new URL(href,base+'index.html');let filename=decodeURIComponent(url.pathname);if(fs.statSync(filename).isDirectory())filename=path.join(filename,'index.html');
   check('local link '+href,fs.existsSync(filename));
   if(url.hash){const doc=fs.readFileSync(filename,'utf8');check('anchor '+href,doc.includes('id="'+url.hash.slice(1)+'"'));}
  }
  for(const [key,expected] of [['staged','No acceptance acknowledgment'],['uncertain','Uncertain'],['durable','Uncertain'],['received','Accepted']]){
   await page.click('[data-cut="'+key+'"]');
   check('cut '+key,await page.$eval('#sender-state',el=>el.textContent)===expected);
   check('one pressed button '+key,await page.$$eval('[data-cut][aria-pressed=true]',es=>es.length)===1);
  }
  await page.click('[data-cut="durable"]');
  await page.$eval('#promise',el=>el.scrollIntoView());
  await page.screenshot({path:path.join(qa,'lab.png')});
  await page.$eval('#findings',el=>el.scrollIntoView());
  await page.screenshot({path:path.join(qa,'findings.png')});
  await page.focus('.findings details:nth-child(2) summary');await page.keyboard.press('Enter');
  check('details keyboard activation',await page.$eval('.findings details:nth-child(2)',e=>e.open));
  await page.goto(base+'sources.html#statement-toy',{waitUntil:'load'});
  check('source deep link opens excerpt',await page.$eval('#statement-toy',e=>e.open));
  await page.screenshot({path:path.join(qa,'source.png')});
  check('notebook no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const width of [390,320,768]){
   await page.setViewport({width,height:844,deviceScaleFactor:1});await page.goto(base+'index.html',{waitUntil:'load'});
   check('no overflow at '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===390){await page.screenshot({path:path.join(qa,'mobile.png')});await page.$eval('.cut-lab',e=>e.scrollIntoView());await page.screenshot({path:path.join(qa,'mobile-lab.png')});}
  }
  await page.setJavaScriptEnabled(false);await page.goto(base+'index.html',{waitUntil:'load'});
  check('no-JS default contract readable',await page.$eval('#store-state',e=>e.textContent.includes('Retain')));
  check('no-JS report sections readable',await page.$$eval('main section',es=>es.length>=8));
  check('no browser errors',errors.length===0,errors);
 }finally{
  results.command='node tools/check_fn_report.cjs';
  results.scope='Headless browser: interaction, local links, desktop/tablet/mobile overflow, keyboard and no-JS reading. This checks the report UI, not fn behavior.';
  results.checked_at=new Date().toISOString();
  results.inputs=Object.fromEntries(['index.html','sources.html','report.md','style.css','report.js'].map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,slug,name))).digest('hex')]));
  results.script_sha256=crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
  fs.writeFileSync(path.join(root,slug,'ui-check.json'),JSON.stringify(results,null,2)+'\n');await browser.close();
 }
 console.log('Report UI checks passed. Screenshots: '+qa);
})().catch(e=>{console.error(e);process.exitCode=1});
