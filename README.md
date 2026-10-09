# Router de lucasramos.uy

Código del Worker Cloudflare `proxy`, separado del proyecto Normativa. Este repo es la fuente versionada del router del dominio: rutas explícitas, root Pages, fallback `p-<nombre>`, ingest de Normativa y reescritura de redirects.

## Desarrollo

Node 22, pnpm. Sin dependencias de runtime.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

## Auto-deploy

Cada push a `main` (incluidos merges) corre chequeo de sintaxis, 10 tests y dry-run de Wrangler. Una PR solo valida: no usa el token ni publica. El deploy usa `CLOUDFLARE_API_TOKEN` guardado como secret de GitHub, nunca en archivos.

`wrangler.toml` conserva la configuración live leída el 9 de octubre de 2026: Worker `proxy`, fecha `2026-09-23`, sin flags, bindings ni cron, observabilidad, workers.dev activo y previews desactivados. Declara únicamente las tres rutas de este Worker, no las 30 de toda la zona. `keep_vars` conserva variables agregadas en el dashboard, pero no protege otros tipos de binding: si se agrega alguno hay que reconciliar el config antes del deploy.

El guard lee settings/rutas antes y después. Si el estado remoto no coincide con el contrato, falla antes de publicar. Compara todas las rutas de zona para detectar cambios de otros Workers durante el deploy. Requiere permisos de lectura de Workers y rutas de la zona además de los permisos de deploy; si el token no los tiene, se detiene sin deploy. No hay fallback que saltee el guard.

La primera publicación agrega `/intemperie/` al source live anterior. Después del deploy comprobar `/`, `/normativa/`, `/profe/`, `/intemperie/`, sus assets y `weather.json`. Un Action verde no reemplaza esa comprobación visual.

### Rollback

1. Pausar el workflow antes de revertir en Cloudflare para que otro push no deshaga el rollback.
2. Dashboard → `proxy` → Deployments: restaurar la versión anterior. Antes de cada deploy, registrar el ID de la versión activa. La versión anterior a esta migración empieza con `13dc333d`.
3. Verificar rutas y sitios. El rollback del código no repara cambios de rutas: el guard detecta discrepancias para inspeccionarlas, nunca reasigna rutas de otros Workers.
4. Revertir la PR que falló en GitHub o reconciliar config, revisar el diff y recién entonces reactivar el workflow. No repetir un deploy fallido con un config adivinado.

## Migración

Origen: `lucasramosuy/normativa`, rama `www`, `worker/proxy.js`. La primera PR conserva el source tal cual leído. El despliegue live no cambia por mover el archivo. La antigua copia no se elimina hasta que esta migración se integre; su retirada o nota de redirección corresponde a una PR aparte en Normativa. Cambios futuros del router van aquí, no en las dos copias.

[SRS.md](./SRS.md) contiene alcance, restricciones y aceptación. Este router no aloja el frontend ni genera datos meteorológicos.
