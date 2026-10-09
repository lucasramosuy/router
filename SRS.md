# SRS: router de lucasramos.uy

## Alcance

Separar la fuente del Worker `proxy` del repo Normativa a un repo independiente. Migración inicial sin cambios funcionales: source idéntico al archivo actual `normativa/www/worker/proxy.js`. Mantener rutas explícitas, root `www-7r1.pages.dev`, fallback `p-<nombre>`, tunnel Sentry, ingest PostHog, cookies y redirects existentes. No desplegar Cloudflare ni eliminar la copia original como efecto de crear el repo.

## Requisitos

- PRs y revisión antes de merge. Node 22 + pnpm; sin dependencias de runtime. Wrangler 4.149.0 fijado como herramienta de desarrollo; token solo como secret de GitHub.
- `proxy.js` es el ES module del Worker; tests aislados sin acceso al dashboard ni modificación live.
- Conservar el path upstream y query; normalizar rutas sin barra mediante redirects existentes.
- No modificar Profe/Normativa/root ni interceptar prefijos similares a una ruta.
- Ingest Sentry conserva allowlist de host/proyectos; PostHog mantiene su upstream y comportamiento.
- Snapshot de intemperie proviene de su Pages, no de API meteorológica ni cron del router.
- Auto-deploy solo desde main, validación de PR sin token, readback y rollback documentados.

## Despliegue y estado

GitHub Actions publica merges/push a main con Wrangler 4.149.0, sin bundle y sin módulos adicionales: dry-run debe producir un proxy.js byte-identical al source. Concurrencia serial sin cancelar despliegues en curso. No hay `workflow_dispatch` ni deploy desde ramas o PRs.

La lectura live confirma tres rutas propias, dentro de 30 rutas de zona: `lucasramos.uy/*`, `lucasramos.uy/normativa*`, `lucasramos.uy/profe*`. Wrangler reemplaza rutas del script desplegado; las otras 27 no se declaran como propias. El guard verifica el contrato antes de publicar y compara todas las asignaciones antes/después. Cambios paralelos requieren reconciliación, nunca reemplazo ciego.

Live: sin bindings/cron/flags, fecha 2026-09-23, logpush false, observabilidad activa (logs persistidos y muestreo 1, issues activos, traces desactivadas), workers.dev activo y previews desactivados. Placement vacío equivale a off. usage_model standard no se declara: Cloudflare documenta que esa opción ya no tiene efecto. keep_vars conserva variables del dashboard; no conserva bindings de otros tipos. Si el token carece de lectura de rutas/settings, el guard falla cerrado antes de deploy. No se promete éxito de los permisos sin ejecución real tras merge.

Rollback y verificación manual en README. Ningún cambio de source del proxy en esta PR de automatización. El source migrado incluye intemperie, ausente en la versión live 13dc333d; ese es el único cambio funcional del primer deploy.

Fuentes: https://developers.cloudflare.com/workers/wrangler/configuration/ (source of truth y rutas); https://developers.cloudflare.com/workers/wrangler/migration/deprecations/ (usage_model); https://developers.cloudflare.com/workers/wrangler/ci-cd/external-cicd/github-actions/ . Config verificado contra schema y dry-run de Wrangler 4.149.0.

## Aceptación

Byte-identical del source migrado, tests Node verdes y chequeo de sintaxis. Readback de archivos del nuevo repo. PR separada para cambios funcionales posteriores. Playtest de cada ruta contra upstream real y visual cuando afecta UI; no afirmar dominio live hasta verificar Worker desplegado. El fallback 404 global se coordina aparte, no se mezcla con esta migración.

## Privacidad

Repo público porque el source original es público. No subir credenciales, tokens, cookies ni exportaciones del dashboard. Mantener permisos y límites del Worker existentes. La migración no amplía audiencia de información privada.
