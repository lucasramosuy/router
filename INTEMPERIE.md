# Ruta intemperie

`proxy.js` es el mirror del Worker `proxy` del dominio. Agrega `/intemperie/*` → `https://lucasramosuy.github.io/intemperie/*`, sin cambiar el root ni el fallback de Cloudflare `p-<nombre>`.

- `/intemperie` redirige a `/intemperie/`, conservando query.
- HTML, módulos, CSS y `weather.json` conservan el prefijo; las cookies no viajan a GitHub.
- Snapshot y hora vienen del deploy propio de intemperie, no se añade API ni cron en el router.
- 404 y redirects de upstream mantienen el comportamiento existente.
- Ejecutar `node --test intemperie.test.mjs` desde la raíz.

La ruta ya llegó a normativa/www en #55 y la migración #1 la conserva byte-identical. Esta PR agrega tests y registro de aceptación, no otra línea de código. **Mergear este archivo no despliega automáticamente el Worker**: aplicar la misma línea al Worker `proxy` de Cloudflare y verificar `/intemperie/` y `/intemperie/weather.json` en el dominio. No declarar dominio live solo por el merge.

Estado al 9/10/2026: Pages directo probado, snapshot real y router local con upstream real verificado. Cloudflare Worker activo 13dc333d aún no tiene la ruta: Quick Edit read-only y Deploy deshabilitado, no hubo publicación. Requiere aplicar el source aprobado y verificar dominio.
