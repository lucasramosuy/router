import test from 'node:test';import assert from 'node:assert/strict';import worker from './proxy.js';
const original=globalThis.fetch;let seen=[];
function mock(){seen=[];globalThis.fetch=async(r)=>{seen.push(new Request(r));return new Response('ok');};}
test('root sigue a Pages y no envía cookies',async()=>{mock();await worker.fetch(new Request('https://lucasramos.uy/',{headers:{cookie:'a=b'}}),{},{});assert.equal(seen[0].url,'https://www-7r1.pages.dev/');assert.equal(seen[0].headers.get('cookie'),null);});
test('rutas existentes conservadas',async()=>{for(const [p,u] of [['/normativa/','https://lucasramosuy.github.io/normativa/'],['/profe/','https://lucasramosuy.github.io/profe/'],['/rebote/','https://rebote-a9c.pages.dev/']]){mock();await worker.fetch(new Request('https://lucasramos.uy'+p),{},{});assert.equal(seen[0].url,u);}});
test('sin barra normaliza query',async()=>{mock();const r=await worker.fetch(new Request('https://lucasramos.uy/profe?q=1'),{},{});assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://lucasramos.uy/profe/?q=1');});
test.after(()=>{globalThis.fetch=original;});

test('public empty 404 fallback is bounded, scoped and preserves custom pages', async () => {
  const previous = globalThis.fetch;
  const checks = [
    ['/links/missing',404,'',null,'text/html','GET',true],
    ['/links/missing',404,' \n','text/html','text/html','GET',true],
    ['/profe/missing',404,'<h1>Profe 404</h1>','text/html','text/html','GET',false],
    ['/normativa/missing',404,'<h1>Normativa 404</h1>','text/html','text/html','GET',false],
    ['/links/missing',404,'','application/json','text/html','GET',false],
    ['/links/%61pi/missing',404,'',null,'text/html','GET',false],
    ['/links/data.json',404,'',null,'text/html','GET',false],
    ['/links/api/missing',404,'',null,'text/html','GET',false],
    ['/links/missing',404,'','application/json','application/json','GET',false],
    ['/rachas/missing',404,'',null,'text/html','GET',false],
    ['/panel/missing',404,'',null,'text/html','GET',false],
    ['/cocino/missing',404,'',null,'text/html','GET',false],
    ['/links/missing',403,'',null,'text/html','GET',false],
    ['/links/missing',404,'',null,'text/html','POST',false],
    ['/links/missing',404,'x'.repeat(5000),'text/html','text/html','GET',false],
  ];
  try {
    for(const [path,status,body,type,accept,method,expected] of checks){
      let count=0;
      globalThis.fetch=async req=>{
        const url=typeof req==='string'?req:req.url;
        if(url.endsWith('/404.html')){count++;assert.equal(req.headers.get('cookie'),null);return new Response('<h1>Acá no era.</h1>',{headers:{'Content-Type':'text/html'}});}
        const headers=type?{'Content-Type':type}:{};
        const r=new Response(body,{status,headers});if(!type)r.headers.delete('Content-Type');return r;
      };
      const response=await worker.fetch(new Request('https://lucasramos.uy'+path,{method,headers:{Accept:accept}}));
      const text=await response.text();
      assert.equal(count,expected?1:0,path);
      if(expected){assert.equal(response.status,404);assert.match(text,/Acá no era/);assert.equal(response.headers.get('Cache-Control'),'no-store');}
      else assert.equal(text,body,path);
    }
    // Upstream HEAD lacks a body but is not enough to replace an existing custom page.
    globalThis.fetch=async()=>new Response(null,{status:404,headers:{'Content-Type':'text/html','Content-Length':'800'}});
    const head=await worker.fetch(new Request('https://lucasramos.uy/profe/missing',{method:'HEAD',headers:{Accept:'text/html'}}));
    assert.equal(head.headers.get('Content-Length'),'800');
    let fallbackCalls=0;
    globalThis.fetch=async req=>{
      if(req.url.endsWith('/404.html')){fallbackCalls++;return new Response('global',{headers:{'Content-Type':'text/html'}});}
      return new Response(null,{status:404,headers:{'Content-Length':'0'}});
    };
    const emptyHead=await worker.fetch(new Request('https://lucasramos.uy/intemperie/nope',{method:'HEAD',headers:{Accept:'text/html'}}));
    assert.equal(emptyHead.status,404);assert.equal(await emptyHead.text(),'');assert.equal(fallbackCalls,1);
    const assetDest=await worker.fetch(new Request('https://lucasramos.uy/intemperie/nope',{headers:{Accept:'text/html','Sec-Fetch-Dest':'script'}}));
    assert.equal(fallbackCalls,1);assert.equal(await assetDest.text(),'');
    globalThis.fetch=async()=>new Response('should stay',{status:302,headers:{location:'/elsewhere'}});
    const redirect=await worker.fetch(new Request('https://lucasramos.uy/profe/nope',{headers:{Accept:'text/html'}}));assert.equal(redirect.status,302);
    // Slow/unending source fails closed; inspection does not hang.
    globalThis.fetch=async()=>new Response(new ReadableStream({start(){}}),{status:404,headers:{'Content-Type':'text/html'}});
    const started=Date.now();const stalled=await worker.fetch(new Request('https://lucasramos.uy/profe/nope',{headers:{Accept:'text/html'}}));assert.equal(stalled.status,404);assert(Date.now()-started<1500);
    // Failed fallback, JSON API response and redirects are never converted.
    globalThis.fetch=async req=>{if(req.url.endsWith('/404.html'))throw Error('offline');return new Response('',{status:404});};
    const failed=await worker.fetch(new Request('https://lucasramos.uy/links/missing',{headers:{Accept:'text/html'}}));assert.equal(await failed.text(),'');
  } finally {globalThis.fetch=previous;}
});
