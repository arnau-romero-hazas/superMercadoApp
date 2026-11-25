# TraeLeche

Despensa y lista de la compra compartidas para un hogar, con catálogo real de Mercadona.

## Stack

- **apps/web**: PWA con React 19, TypeScript, Tailwind 4, Vite y TanStack Query
- **apps/api**: NestJS 12 (ESM), Mongoose, JWT (jose) y argon2
- **packages/shared**: esquemas Zod de peticiones y vistas, compartidos por el front y el back
- **tools**: scripts `tsx` para probar flujos del backend

## Arrancar en local

```bash
yarn install
yarn db:up                 # MongoDB 7 en Docker, puerto 27018
cp apps/api/.env.example apps/api/.env
yarn build:shared
yarn dev:api               # http://localhost:3000/api
yarn dev:web               # http://localhost:5173 (con proxy a /api)
```

Para probarlo en el móvil desde la misma wifi, abre `http://<ip-del-pc>:5173`.

## Comprobaciones

```bash
yarn typecheck                         # shared + api + web
yarn test                              # tests del frontend (vitest)
yarn build                             # build de producción
yarn workspace @super/tools flujo      # flujo completo contra el API en marcha
```

## Arquitectura

Tres capas en ambos lados. Los datos solo fluyen hacia abajo.

```
api/src/interfaz      controladores, guards, tarea del cron, proyección a vistas
api/src/logica        reglas de negocio (devuelven Result, nunca lanzan)
api/src/repositorios  modelos Mongoose y acceso a datos
api/src/servicios     externos: Mercadona, JWT, contraseñas

web/src/paginas, componentes   interfaz
web/src/logica                 hooks de React Query y funciones puras
web/src/servicios              cliente HTTP, sesión, fotos
```

### Dominio

- **Hogar**: lo comparten sus miembros. Se une gente con un código de invitación de 6 caracteres.
- **Producto del hogar**: estado `hay` | `queda_poco` | `falta`, más `enCarro`. Tiene
  `equivalencias` por supermercado (`{ supermercado, idExterno }`), así que la despensa es una
  sola aunque más adelante haya varios súper.
- **Producto propio**: un producto que aún no está en el catálogo (por ejemplo, uno nuevo en la tienda).
  Se registra con foto, nombre, descripción, precio, supermercado y categoría. Su precio cuenta en el
  total de la lista y de la compra. La foto, la descripción y el precio solo se pueden editar en los
  productos propios.
- **Lista**: los productos con estado `falta` o `queda_poco` (este último en la sección "Si os acordáis").
- **Terminar compra**: lo que está en el carro pasa a `hay` y se guarda en `compras` con los precios estimados.
  Las últimas 50 se ven en "Compras anteriores", desde la lista.
- **Catálogo**: se cachea en `catalogo_productos` por supermercado y zona. La zona sale del
  código postal del hogar. Se sincroniza al crear el hogar o cambiar el CP, y cada día de madrugada
  (`GET /api/tareas/sincronizar-catalogo`, que llama el cron de Vercel con `Authorization: Bearer $CRON_SECRET`).
  Para añadir un súper nuevo hay que implementar `ProveedorCatalogo` en `servicios/` y registrarlo
  en `catalogoProveedores`.

### Fotos

El navegador comprime la foto antes de subirla (WebP, máximo 1000 px; JPEG si no hay WebP).

- `POST /api/fotos`: requiere sesión. El cuerpo es la imagen en binario, con `Content-Type`
  `image/webp`, `image/jpeg` o `image/png` y 2 MB como máximo. El tipo se comprueba también con los
  primeros bytes del archivo. Devuelve `{ id }`, que se envía como `fotoId` al crear o editar el
  producto. La foto tiene que ser del mismo hogar que el producto.
- `GET /api/fotos/:clave`: no requiere sesión (la clave es aleatoria, de 32 caracteres hex) y se cachea un año.

Se guardan en la colección `fotos`. Al reemplazar la foto o borrar el producto, se borra la foto anterior.

### Sincronización entre móviles

Por polling: mientras la app está abierta y visible, pide la despensa cada 5 s, y también al volver a ella.
Un cambio tarda como mucho unos 5 s en verse en el otro móvil. No se usan WebSockets porque en el plan
gratuito de Vercel una conexión abierta consume memoria todo el rato y agotaría el cupo mensual.

## Desplegar en Vercel

Un solo proyecto con [Vercel Services](https://vercel.com/docs/services) (`vercel.json` en la raíz):
la web y el API comparten dominio, `/api/*` va a NestJS y el resto a la web. Producción:
https://supermercadoapp-zeta.vercel.app

El API arranca desde `apps/api/server.js`, que importa `dist/main.js`: Vercel exige que el punto de
entrada exista antes de compilar, y compilar `src/main.ts` directamente no resuelve los alias `@/`.
`build:vercel` añade `dist/package.json` con `"type": "module"` porque Vercel coloca `dist/` en la
raíz de la función.

1. MongoDB Atlas: crea un clúster M0 en AWS Frankfurt (el API corre en `fra1`). En *Network Access*
   permite `0.0.0.0/0`, porque Vercel no tiene IPs fijas en el plan gratuito.
2. Vercel: importa el repositorio dejando el *Root Directory* en la raíz y añade estas variables:
   `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CRON_SECRET` (cada secreto de 16 caracteres o más)
   `CORS_ORIGIN` con el dominio de producción y `ENABLE_EXPERIMENTAL_COREPACK=1`, para que Vercel use
   Yarn 4 (el de `packageManager`) en lugar de Yarn 1.
3. Tras desplegar, crea el hogar y comprueba en los logs del API que la sincronización termina.

Límites del plan gratuito que afectan a la app: las funciones duran como mucho 5 minutos (la
sincronización tarda alrededor de 1 minuto por zona) y el cron se ejecuta una vez al día, en algún
momento entre las 3:00 y las 3:59 UTC.

## Notas

- La API de Mercadona no es pública. Si cambia su formato, la sincronización falla y se registra
  en el log, pero la app sigue funcionando con la caché y con los productos propios.

## Licencia

[PolyForm Noncommercial 1.0.0](LICENSE). Puedes usar, modificar y compartir el código y contribuir con pull requests, siempre que no sea con fines comerciales. Para cualquier uso comercial, contacta con el autor.
