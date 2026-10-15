import test from 'node:test';import assert from 'node:assert/strict';import worker from './proxy.js';
test('tinta: canonical path, Pages upstream, noindex and no cookies',async()=>{
const redirect=await worker.fetch(new Request('https://lucasramos.uy/tinta?q=1'));assert.equal(redirect.headers.get('location'),'https://lucasramos.uy/tinta/?q=1');
const real=globalThis.fetch;let target;globalThis.fetch=async req=>{target=req;return new Response('<canvas></canvas>',{headers:{'content-type':'text/html','x-robots-tag':'noindex, nofollow'}})};
try{const res=await worker.fetch(new Request('https://lucasramos.uy/tinta/',{headers:{cookie:'private=1'}}));assert.equal(target.url,'https://tinta-69x.pages.dev/');assert.equal(target.headers.has('cookie'),false);assert.equal(res.headers.get('x-robots-tag'),'noindex, nofollow');}finally{globalThis.fetch=real;}
});
