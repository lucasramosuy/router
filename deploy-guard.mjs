// Read-only safety checks. Dashboard exports stay in the runner, not the repo.
import {readFile, writeFile} from 'node:fs/promises';
const account = 'f66373a49d42210eded48739ed762afa';
const zone = '1b45195369f2fa2fd6993ff365431d3c';
const base = `https://api.cloudflare.com/client/v4`;
export const expectedRoutes = ['lucasramos.uy/*', 'lucasramos.uy/normativa*', 'lucasramos.uy/profe*'];
export function normalizeRoutes(routes) {
  return routes.map(({pattern, script, request_limit_fail_open}) => ({pattern, script:script ?? null, request_limit_fail_open:request_limit_fail_open ?? false})).sort((a,b)=>a.pattern.localeCompare(b.pattern));
}
export function assertSettings(s, sub, schedules) {
  const expected = {compatibility_date:'2026-09-23', compatibility_flags:[], bindings:[], logpush:false, tail_consumers:[]};
  for (const [key,value] of Object.entries(expected)) if (JSON.stringify(s[key] ?? []) !== JSON.stringify(value)) throw new Error(`Remote ${key} changed. Reconcile configuration before deploying.`);
  if (!sub.enabled || sub.previews_enabled) throw new Error('Remote workers.dev settings changed.');
  if (schedules.schedules.length) throw new Error('Remote cron triggers changed.');
  if (s.placement?.mode && s.placement.mode !== 'off') throw new Error('Remote placement changed.');
  const o=s.observability;
  if (!o?.enabled || o.head_sampling_rate !== 1 || o.redact_query_string !== false || !o.issues?.enabled || !o.logs?.enabled || o.logs.head_sampling_rate !== 1 || !o.logs.invocation_logs || !o.logs.persist || o.traces?.enabled !== false || o.traces.head_sampling_rate !== 1 || !o.traces.persist) throw new Error('Remote observability changed.');
}
async function get(path) {
  const r=await fetch(`${base}${path}`, {headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`}});
  const body=await r.json();
  if (!r.ok || !body.success) throw new Error(`Cloudflare read failed (${r.status}) for ${path}. Check read permissions; no deploy attempted by this check.`);
  return body.result;
}
export async function run(mode) {
  if (!['pre','post'].includes(mode)) throw new Error('Expected pre or post.');
  if (!process.env.CLOUDFLARE_API_TOKEN) throw new Error('Missing CLOUDFLARE_API_TOKEN.');
  const worker=`/accounts/${account}/workers/scripts/proxy`;
  const [settings,sub,schedules,routes]=await Promise.all([get(`${worker}/settings`),get(`${worker}/subdomain`),get(`${worker}/schedules`),get(`/zones/${zone}/workers/routes`)]);
  assertSettings(settings,sub,schedules);
  const own=routes.filter(r=>r.script==='proxy').map(r=>r.pattern).sort();
  if(JSON.stringify(own)!==JSON.stringify([...expectedRoutes].sort())) throw new Error('Proxy routes changed. Stop and reconcile; do not overwrite dashboard changes.');
  const normalized=normalizeRoutes(routes);
  const file=`${process.env.RUNNER_TEMP ?? '/tmp'}/router-route-baseline.json`;
  if(mode==='pre') await writeFile(file,JSON.stringify(normalized));
  else if(JSON.stringify(normalized)!==await readFile(file,'utf8')) throw new Error('Zone routes changed during deployment. Inspect and restore only this deployment if needed.');
  console.log(`${mode}: proxy configuration verified; ${routes.length} zone routes intact. No bindings or cron triggers.`);
}
if(import.meta.url===`file://${process.argv[1]}`) await run(process.argv[2]);
