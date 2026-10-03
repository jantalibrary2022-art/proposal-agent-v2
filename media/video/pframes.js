const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{const b=await chromium.launch();
for (const [fmt,w,h,hash] of [['v',540,960,'#v'],['s',540,540,'']]) {
 const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
 await p.goto('file://'+__dirname+'/promo.html'+hash); await p.evaluate(()=>document.fonts.ready);
 const fps=30,n=57*fps; fs.mkdirSync('pf-'+fmt,{recursive:true});
 for (let i=0;i<n;i++){ await p.evaluate(t=>render(t),i/fps); await p.screenshot({path:`pf-${fmt}/f${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92}); }
 await p.close(); console.log(fmt,'done'); }
await b.close();})();
