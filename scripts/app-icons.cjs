/* Render the code-native app mark; never modifies original RWS card artwork. */
const fs=require('node:fs');
(async()=>{const browser=await require('./browser.cjs')();try{
 const page=await browser.newPage();
 for(const [size,name]of [[192,'icon-192'],[512,'icon-512'],[180,'apple-touch-icon']]){
  await page.setViewportSize({width:size,height:size});
  await page.setContent('<style>html,body{margin:0}svg{display:block;width:100vw;height:100vh}</style>'+fs.readFileSync('assets/app/icon.svg','utf8'));
  await page.screenshot({path:'assets/app/'+name+'.png'});
 }
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
