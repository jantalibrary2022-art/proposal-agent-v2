const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});
await p.goto('file://'+__dirname+'/demo.html'); await p.evaluate(()=>document.fonts.ready);
const fps=30, n=Math.round(32*fps);
require('fs').mkdirSync('frames',{recursive:true});
for (let i=0;i<n;i++){ await p.evaluate(t=>render(t), i/fps); await p.screenshot({path:`frames/f${String(i).padStart(4,'0')}.jpg`, type:'jpeg', quality:92}); }
await b.close(); console.log('frames',n);})();
