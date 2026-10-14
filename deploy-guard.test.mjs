import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSettings,normalizeRoutes,expectedRoutes,baselineRoutes,run} from './deploy-guard.mjs';
const settings={compatibility_date:'2026-09-23',compatibility_flags:[],bindings:[],logpush:false,tail_consumers:[],placement:{},observability:{enabled:true,head_sampling_rate:1,redact_query_string:false,issues:{enabled:true},logs:{enabled:true,head_sampling_rate:1,invocation_logs:true,persist:true},traces:{enabled:false,head_sampling_rate:1,persist:true}}};
test('live baseline accepted; all action-driving settings checked',()=>{
 assert.doesNotThrow(()=>assertSettings(settings,{enabled:true,previews_enabled:false},{schedules:[]}));
 for(const patch of [{bindings:[{type:'kv_namespace',name:'OTHER'}]},{compatibility_date:'2026-10-09'},{compatibility_flags:['nodejs_compat']},{placement:{mode:'smart'}}]) assert.throws(()=>assertSettings({...settings,...patch},{enabled:true,previews_enabled:false},{schedules:[]}));
 assert.throws(()=>assertSettings(settings,{enabled:true,previews_enabled:true},{schedules:[]}));
 assert.throws(()=>assertSettings(settings,{enabled:true,previews_enabled:false},{schedules:[{}]}));
});
test('route normalization retains other Workers and detects changed assignments',()=>{
 const a=[{pattern:'lucasramos.uy/profe*',script:'proxy'},{pattern:'lucasramos.uy/qr*',script:'qr-studio'}];
 assert.deepEqual(normalizeRoutes(a),normalizeRoutes([...a].reverse()));
 assert.notDeepEqual(normalizeRoutes(a),normalizeRoutes([a[0],{...a[1],script:'proxy'}]));
 assert.equal(expectedRoutes.length,11);
 assert.ok(expectedRoutes.includes('lucasramos.uy/tinta*'));
 assert.equal(baselineRoutes.length,10);
});

async function withCloudflare(proxyPatterns, others, fn){
 const real=globalThis.fetch;
 const routes=[...proxyPatterns.map(pattern=>({pattern,script:'proxy'})),...others];
 globalThis.fetch=async u=>({ok:true,json:async()=>({success:true,result:u.endsWith('/settings')?settings:u.endsWith('/subdomain')?{enabled:true,previews_enabled:false}:u.endsWith('/schedules')?{schedules:[]}:routes})});
 process.env.CLOUDFLARE_API_TOKEN='x';
 try { await fn(); } finally { globalThis.fetch=real; }
}
test('pre acepta el estado anterior y el final; post exige /tinta*',async()=>{
 const others=[{pattern:'lucasramos.uy/links',script:'links'}];
 await withCloudflare(baselineRoutes,others,()=>run('pre'));
 await withCloudflare(expectedRoutes,others,()=>run('pre'));
 await withCloudflare(expectedRoutes,others,()=>run('post'));
 await assert.rejects(withCloudflare(baselineRoutes,others,()=>run('post')),/Proxy routes changed/);
});
test('rutas desconocidas o /tinta* de otro Worker detienen el deploy',async()=>{
 await assert.rejects(withCloudflare([...baselineRoutes,'lucasramos.uy/*'],[],()=>run('pre')),/Proxy routes changed/);
 await assert.rejects(withCloudflare(baselineRoutes,[{pattern:'lucasramos.uy/tinta*',script:'otro'}],()=>run('pre')),/another Worker/);
});
