import test from 'node:test';
import assert from 'node:assert/strict';
import {assertSettings,normalizeRoutes,expectedRoutes} from './deploy-guard.mjs';
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
 assert.equal(expectedRoutes.length,3);
});
