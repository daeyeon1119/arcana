const {createRequire} = require('node:module');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = createRequire(process.env.ARCANA_NODE_MODULES + '/_resolve.cjs')('playwright'); }
module.exports = async () => {
  const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
  const root=path.resolve(__dirname,'..');
  const server=http.createServer((req,res)=>{
    const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const file=target===root?path.join(root,'index.html'):target;
    try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.jpg')?'image/jpeg':'application/octet-stream');res.end(fs.readFileSync(file));}
    catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const options = {headless:true,timeout:45000};
  if (process.env.ARCANA_BROWSER) options.executablePath = process.env.ARCANA_BROWSER;
  const browser=await playwright.chromium.launch(options).catch(e=>{server.close();throw e});
  browser.appURL='http://127.0.0.1:'+server.address().port;
  const close=browser.close.bind(browser);
  browser.close=async()=>{await close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));};
  return browser;
};
