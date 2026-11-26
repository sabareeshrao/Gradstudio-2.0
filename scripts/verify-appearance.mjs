import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const contentRoot=path.join(repoRoot,"content/simulations");
const {chromium}=createRequire(path.resolve(process.env.PLAYWRIGHT_PACKAGE_JSON || ""))("playwright");
const lessons=(await fs.readdir(contentRoot,{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort();
const published=[];
for(const id of lessons){
  const manifest=JSON.parse(await fs.readFile(path.join(contentRoot,id,"simulation.json"),"utf8"));
  if(manifest.status==="published")published.push({id,entry:manifest.entrypoint});
}
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".webp":"image/webp",".woff2":"font/woff2"};
const listen=server=>new Promise(resolve=>server.listen(0,"127.0.0.1",()=>resolve("http://127.0.0.1:"+server.address().port)));
let contentOrigin="";
const parent=http.createServer((req,res)=>{
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.end('<!doctype html><html style="color-scheme:light"><body style="margin:0"><iframe title="Lesson" sandbox="allow-scripts allow-forms" style="width:100%;height:95vh;border:0;color-scheme:inherit" src="'+contentOrigin+req.url+'"></iframe></body></html>');
});
const parentOrigin=await listen(parent);
const content=http.createServer(async(req,res)=>{
  try{
    const rel=decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/^\/+/, "");
    const file=path.resolve(contentRoot,rel);
    if(!file.startsWith(contentRoot+path.sep))throw Error("bad path");
    const bytes=await fs.readFile(file);
    const mime=types[path.extname(file)]||"application/octet-stream";
    res.setHeader("Content-Type",mime);
    if(mime.startsWith("text/html"))res.setHeader("Content-Security-Policy","sandbox allow-scripts allow-forms; default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors "+parentOrigin);
    res.end(bytes);
  }catch{res.writeHead(404);res.end();}
});
contentOrigin=await listen(content);
const browser=await chromium.launch({channel:"chrome",headless:true});
const failures=[], evidence=[];
const sample=new Set(["sim-gpu-detailed","sim-gpu-interactive","sim-aws-vpc","sim-ec2","sim-rag","sim-rag-project-initialization","sim-java-scanner","sim-cnn"]);
await fs.mkdir(path.join(repoRoot,"appearance-evidence"),{recursive:true});
try{
  for(const size of [{name:"desktop",width:1440,height:900},{name:"mobile",width:412,height:840}]){
    let cursor=0;
    await Promise.all(Array.from({length:4},async()=>{
      const context=await browser.newContext({viewport:{width:size.width,height:size.height}});
      const page=await context.newPage();
      await page.emulateMedia({colorScheme:null});
      await page.route("**/*",route=>{const u=new URL(route.request().url());return [parentOrigin,contentOrigin].includes(u.origin)?route.continue():route.abort()});
      while(cursor<published.length){
        const lesson=published[cursor++];
        const label=lesson.id+" "+size.name;
        try{
          await page.goto(parentOrigin+"/"+lesson.id+"/"+lesson.entry,{waitUntil:"load",timeout:15000});
          const iframe=await page.locator("iframe").elementHandle(), child=await iframe.contentFrame();
          await child.locator("main").waitFor({state:"visible",timeout:5000});
          await child.evaluate(()=>{window.__appearanceProof=73});
          for(const scheme of ["light","dark","light"]){
            await page.evaluate(s=>document.documentElement.style.colorScheme=s,scheme);
            await child.waitForFunction(s=>matchMedia("(prefers-color-scheme: "+s+")").matches,scheme,{timeout:5000});
            const result=await child.evaluate(()=>{
              const bg=getComputedStyle(document.body).backgroundColor;
              const rootBg=getComputedStyle(document.documentElement).backgroundColor;
              const main=document.querySelector("main");
              const heading=main.querySelector("h1,h2");
              return {bg,rootBg,heading:heading?.textContent?.trim().slice(0,80),marker:window.__appearanceProof};
            });
            const expected=scheme==="dark"?"rgb(0, 0, 0)":"rgb(255, 255, 255)";
            const actual=result.bg==="rgba(0, 0, 0, 0)"?result.rootBg:result.bg;
            assert.equal(actual,expected,label+" "+scheme+" background");
            assert.equal(result.marker,73,label+" "+scheme+" frame state");
            assert.ok(result.heading,label+" heading");
            if(size.name==="desktop"&&sample.has(lesson.id)&&scheme==="dark")await page.screenshot({path:path.join(repoRoot,"appearance-evidence",lesson.id+"-dark.png")});
            if(size.name==="desktop"&&sample.has(lesson.id)&&scheme==="light")await page.screenshot({path:path.join(repoRoot,"appearance-evidence",lesson.id+"-light.png")});
          }
          evidence.push(label);
          console.log("PASS "+label);
        }catch(error){failures.push(label+": "+String(error.message));console.error("FAIL "+label+": "+String(error.message));}
      }
      await context.close();
    }));
  }
}finally{await browser.close();parent.close();content.close();}
console.log("Appearance checks: "+evidence.length+"/"+(published.length*2)+" lesson/viewports");
if(failures.length){console.error(failures.join("\n"));process.exitCode=1;}
