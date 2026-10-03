import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const frontend=fileURLToPath(new URL('..',import.meta.url));
const require=createRequire(join(frontend,'package.json'));
const {createServer: createViteServer,loadConfigFromFile}=await import(require.resolve('vite'));
const temp=await mkdtemp(join(tmpdir(),'p12-routing-'));
const pdf=Buffer.from('%PDF-1.7\nDisposable routing bytes\n%%EOF\n');
const requests=[];
const previousWindow=globalThis.window;
const previousStorage=globalThis.localStorage;
const fixture=createServer((req,res)=>{
 requests.push({url:req.url,authorization:req.headers.authorization});
 if(req.url==='/api/health'){res.setHeader('Content-Type','application/json');res.end('{"fixture":true}');}
 else if(req.url==='/api/unavailable'){res.writeHead(502,{'Content-Type':'text/html'});res.end('<html>Disposable upstream failure</html>');}
 else if(req.url==='/uploads/artworks/original.pdf'){res.setHeader('Content-Type','application/pdf');res.end(pdf);}
 else {res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"Disposable original missing"}');}
});
let vite;
try{
 await writeFile(join(temp,'index.html'),'<html><body>Disposable SPA</body></html>');
 await new Promise(resolve=>fixture.listen(0,'127.0.0.1',resolve));
 const target=`http://127.0.0.1:${fixture.address().port}`;
 const loaded=await loadConfigFromFile({command:'serve',mode:'test'},join(frontend,'vite.config.ts'));
 const proxy=Object.fromEntries(Object.entries(loaded.config.server.proxy).map(([key,value])=>[key,{...value,target}]));
 vite=await createViteServer({root:temp,configFile:false,envDir:temp,cacheDir:join(temp,'cache'),server:{host:'127.0.0.1',port:0,strictPort:false,proxy}});
 await vite.listen();
 const origin=`http://127.0.0.1:${vite.httpServer.address().port}`;
 assert.equal((await fetch(origin+'/api/health')).status,200);
 const original=await fetch(origin+'/uploads/artworks/original.pdf',{headers:{Authorization:'Bearer disposable-routing-token'}});
 console.log('ARTWORK RESPONSE',original.status,original.headers.get('content-type'));
 assert.equal(original.headers.get('content-type'),'application/pdf','Artwork must reach backend, not SPA fallback');
 assert.deepEqual(Buffer.from(await original.arrayBuffer()),pdf);
 assert.equal(requests.find(r=>r.url==='/uploads/artworks/original.pdf').authorization,'Bearer disposable-routing-token');
 globalThis.window={location:{origin}};
 globalThis.localStorage={getItem:()=>null};
 const client=await vite.ssrLoadModule(join(frontend,'src/api/client.ts'));
 assert.equal(client.BACKEND_HOST,'','Fixture must exercise unset VITE_API_URL');
 assert.equal(client.resolveBackendUrl('/uploads/artworks/original.pdf'),origin+'/uploads/artworks/original.pdf');
 const binary=await client.fetchAuthenticatedBlob('/uploads/artworks/original.pdf','disposable-routing-token');
 assert.deepEqual(Buffer.from(await binary.blob.arrayBuffer()),pdf);URL.revokeObjectURL(binary.blobUrl);
 await assert.rejects(client.fetchAuthenticatedBlob('/wrong-artwork-path.pdf','disposable-routing-token'),/HTML document/);
 await assert.rejects(client.fetchAuthenticatedBlob('/api/unavailable','disposable-routing-token'),/502/);
 await assert.rejects(client.fetchAuthenticatedBlob('/uploads/artworks/missing.pdf','disposable-routing-token'),/404/);
 const missing=await fetch(origin+'/uploads/artworks/missing.pdf');assert.equal(missing.status,404);assert.match(missing.headers.get('content-type'),/json/);
 const unavailable=await fetch(origin+'/api/unavailable');assert.equal(unavailable.status,502);
 // A wrong frontend path produces SPA HTML; a missing original behind the proxy stays 404.
 const wrong=await fetch(origin+'/wrong-artwork-path.pdf');assert.equal(wrong.status,200);assert.match(wrong.headers.get('content-type'),/html/);
 await new Promise(resolve=>fixture.close(resolve));
 const offline=await fetch(origin+'/api/health');assert.ok(offline.status>=500);
 console.log('UNAVAILABLE DISPOSABLE BACKEND STATUS',offline.status);
 console.log('PASS: API proxy, exact original bytes/auth, missing-original 404, upstream 502 retained; no browser/business service accessed');
}finally{globalThis.window=previousWindow;globalThis.localStorage=previousStorage;if(vite)await vite.close();if(fixture.listening)await new Promise(resolve=>fixture.close(resolve));await rm(temp,{recursive:true,force:true});}
