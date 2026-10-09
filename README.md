# Router de lucasramos.uy

Código del Worker Cloudflare `proxy`, separado del proyecto Normativa. Este repo es la fuente versionada del router del dominio: rutas explícitas, root Pages, fallback `p-<nombre>`, ingest de Normativa y reescritura de redirects.

## Desarrollo

Node 22, pnpm. Sin dependencias de runtime.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
```

## Despliegue manual actual

Mergear una PR **no cambia producción**. Tras aprobación y merge:

1. Leer `proxy.js` de main, revisar el diff y confirmar que es la versión aprobada.
2. En Cloudflare Dashboard, cuenta y zona `lucasramos.uy`, Workers & Pages → Worker `proxy` → Edit code.
3. Guardar una copia de la versión live antes de editar; comparar con el source esperado. Si difiere, detenerse y reconciliar, no sobreescribir cambios ajenos.
4. Reemplazar el código del Worker con `proxy.js`, revisar preview y publicar mediante Deploy. No cambiar rutas de la zona, secretos ni otros Workers.
5. Verificar dominio real: ruta nueva, assets/JSON, ruta sin barra, queries, 404 y regresión root/Normativa/Profe. Registrar versión de Cloudflare y commit aplicado.
6. Si falla, restaurar la versión anterior desde Versions/Rollback y verificar otra vez.

No hay token ni credenciales en este repo. La integración con Cloudflare permanece manual; no se promete auto-deploy. Un futuro auto-deploy requiere decisión y PR aparte.

## Migración

Origen: `lucasramosuy/normativa`, rama `www`, `worker/proxy.js`. La primera PR conserva el source tal cual leído. El despliegue live no cambia por mover el archivo. La antigua copia no se elimina hasta que esta migración se integre; su retirada o nota de redirección corresponde a una PR aparte en Normativa. Cambios futuros del router van aquí, no en las dos copias.

[SRS.md](./SRS.md) contiene alcance, restricciones y aceptación. Este router no aloja el frontend ni genera datos meteorológicos.
