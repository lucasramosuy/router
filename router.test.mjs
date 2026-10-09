import test from 'node:test';import assert from 'node:assert/strict';import worker from './proxy.js';
const original=globalThis.fetch;let seen=[];
function mock(){seen=[];globalThis.fetch=async(r)=>{seen.push(new Request(r));return new Response('ok');};}
test('root sigue a Pages y no envía cookies',async()=>{mock();await worker.fetch(new Request('https://lucasramos.uy/',{headers:{cookie:'a=b'}}),{},{});assert.equal(seen[0].url,'https://www-7r1.pages.dev/');assert.equal(seen[0].headers.get('cookie'),null);});
test('rutas existentes conservadas',async()=>{for(const [p,u] of [['/normativa/','https://lucasramosuy.github.io/normativa/'],['/profe/','https://lucasramosuy.github.io/profe/'],['/rebote/','https://rebote-a9c.pages.dev/']]){mock();await worker.fetch(new Request('https://lucasramos.uy'+p),{},{});assert.equal(seen[0].url,u);}});
test('sin barra normaliza query',async()=>{mock();const r=await worker.fetch(new Request('https://lucasramos.uy/profe?q=1'),{},{});assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://lucasramos.uy/profe/?q=1');});
test.after(()=>{globalThis.fetch=original;});
