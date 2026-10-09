# SRS: router de lucasramos.uy

## Alcance

Separar la fuente del Worker `proxy` del repo Normativa a un repo independiente. Migración inicial sin cambios funcionales: source idéntico al archivo actual `normativa/www/worker/proxy.js`. Mantener rutas explícitas, root `www-7r1.pages.dev`, fallback `p-<nombre>`, tunnel Sentry, ingest PostHog, cookies y redirects existentes. No desplegar Cloudflare ni eliminar la copia original como efecto de crear el repo.

## Requisitos

- PRs y revisión antes de merge. Node 22 + pnpm; costo cero, sin dependencias ni secretos.
- `proxy.js` es el ES module del Worker; tests aislados sin acceso al dashboard ni modificación live.
- Conservar el path upstream y query; normalizar rutas sin barra mediante redirects existentes.
- No modificar Profe/Normativa/root ni interceptar prefijos similares a una ruta.
- Ingest Sentry conserva allowlist de host/proyectos; PostHog mantiene su upstream y comportamiento.
- Snapshot de intemperie proviene de su Pages, no de API meteorológica ni cron del router.
- Documentación exacta de despliegue manual, readback y rollback. El merge no es deploy.

## Despliegue y estado

Hoy manual en Cloudflare Dashboard → Worker `proxy` → Edit code → Deploy. Antes de publicar, leer versión live, conservar copia y comparar contra source aprobado. Cambios paralelos requieren reconciliación, no reemplazo ciego. Después: verificar ruta/domain real, assets, JSON, redirects, 404 y rutas anteriores; registrar versión/commit. Rollback a versión anterior si falla. No tocar bindings, secretos ni routes por esta migración.

## Aceptación

Byte-identical del source migrado, tests Node verdes y chequeo de sintaxis. Readback de archivos del nuevo repo. PR separada para cambios funcionales posteriores. Playtest de cada ruta contra upstream real y visual cuando afecta UI; no afirmar dominio live hasta verificar Worker desplegado. El fallback 404 global se coordina aparte, no se mezcla con esta migración.

## Privacidad

Repo público porque el source original es público. No subir credenciales, tokens, cookies ni exportaciones del dashboard. Mantener permisos y límites del Worker existentes. La migración no amplía audiencia de información privada.
