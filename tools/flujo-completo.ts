import {
  compraVistaSchema,
  estadoCatalogoVistaSchema,
  hogarVistaSchema,
  productoCatalogoVistaSchema,
  productoHogarVistaSchema,
  sesionAuthVistaSchema,
  yoVistaSchema,
} from '@super/shared';
import { z } from 'zod';

const API = process.env['API_URL'] ?? 'http://localhost:3000/api';
const CODIGO_POSTAL = process.env['CODIGO_POSTAL'] ?? '46001';

const pedir = async <T>(metodo: string, ruta: string, schema: z.ZodType<T>, token: string | null, cuerpo?: unknown): Promise<T> => {
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token !== null) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  if (!respuesta.ok) {
    throw new Error(`${metodo} ${ruta} → ${respuesta.status}: ${texto}`);
  }
  return schema.parse(texto.length === 0 ? null : JSON.parse(texto));
};

const paso = (mensaje: string): void => console.log(`\n▶ ${mensaje}`);
const esperar = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const sufijo = Date.now().toString(36);

paso('Registrar a dos miembros');
const ana = await pedir('POST', '/auth/registro', sesionAuthVistaSchema, null, {
  email: `ana-${sufijo}@prueba.local`,
  nombre: 'Ana',
  password: 'Contrasena-segura1',
});
const luis = await pedir('POST', '/auth/registro', sesionAuthVistaSchema, null, {
  email: `luis-${sufijo}@prueba.local`,
  nombre: 'Luis',
  password: 'Contrasena-segura1',
});
console.log(ana.usuario, luis.usuario);

paso('Login y refresh');
const login = await pedir('POST', '/auth/login', sesionAuthVistaSchema, null, {
  email: ana.usuario.email,
  password: 'Contrasena-segura1',
});
await pedir('POST', '/auth/refresh', sesionAuthVistaSchema, null, { refreshToken: login.refreshToken });
console.log('ok');

paso(`Ana crea el hogar (CP ${CODIGO_POSTAL})`);
const hogar = await pedir('POST', '/hogares', hogarVistaSchema, ana.accessToken, { nombre: 'Casa', codigoPostal: CODIGO_POSTAL });
console.log(hogar);

paso('Luis se une con el código de invitación');
const hogarLuis = await pedir('POST', '/hogares/unirse', hogarVistaSchema, luis.accessToken, {
  codigoInvitacion: hogar.codigoInvitacion.toLowerCase(),
});
console.log(hogarLuis.miembros);
const yo = await pedir('GET', '/auth/yo', yoVistaSchema, luis.accessToken);
console.log('Luis en hogar:', yo.hogar?.nombre);

paso('Esperar a que el catálogo esté sincronizado');
for (;;) {
  const estado = await pedir('GET', '/catalogo/estado', estadoCatalogoVistaSchema, ana.accessToken);
  console.log(estado);
  if (estado.sincronizadoEn !== null) {
    break;
  }
  await esperar(5000);
}

paso('Buscar "leche semi" en el catálogo');
const resultados = await pedir('GET', '/catalogo/buscar?q=leche%20semi', z.array(productoCatalogoVistaSchema), ana.accessToken);
console.log(resultados.slice(0, 3));
const leche = resultados[0];
if (leche === undefined) {
  throw new Error('No se encontró leche en el catálogo');
}

paso('Subir una foto y añadir la leche (falta) y un producto propio con foto (falta)');
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const subida = await fetch(`${API}/fotos`, {
  method: 'POST',
  headers: { 'Content-Type': 'image/png', Authorization: `Bearer ${luis.accessToken}` },
  body: PNG_1X1,
});
if (!subida.ok) {
  throw new Error(`Subida de foto → ${subida.status}: ${await subida.text()}`);
}
const foto = z.object({ id: z.string() }).parse(await subida.json());
const falsa = await fetch(`${API}/fotos`, {
  method: 'POST',
  headers: { 'Content-Type': 'image/png', Authorization: `Bearer ${luis.accessToken}` },
  body: Buffer.from('no soy una imagen'),
});
console.log('foto subida', foto.id, '| imagen falsa →', falsa.status);

const productoLeche = await pedir('POST', '/despensa', productoHogarVistaSchema, ana.accessToken, {
  origen: 'catalogo',
  catalogoProductoId: leche.id,
  estado: 'falta',
});
const categorias = await pedir('GET', '/catalogo/categorias', z.array(z.object({ nombre: z.string(), orden: z.number() })), luis.accessToken);
const productoNuevo = await pedir('POST', '/despensa', productoHogarVistaSchema, luis.accessToken, {
  origen: 'propio',
  nombre: 'Hummus de pistacho Hacendado',
  categoria: categorias[0],
  estado: 'falta',
  supermercado: 'mercadona',
  descripcion: 'Nuevo, en la nevera de los hummus',
  precio: 2.1,
  fotoId: foto.id,
});
console.log(productoLeche.nombre, productoLeche.catalogo?.precio, '|', productoNuevo.nombre, productoNuevo.propio);

const fotoUrl = productoNuevo.propio?.fotoUrl ?? null;
if (fotoUrl === null) {
  throw new Error('El producto propio debería tener foto');
}
const descarga = await fetch(`${API.replace(/\/api$/, '')}${fotoUrl}`);
const bytes = Buffer.from(await descarga.arrayBuffer());
console.log('foto descargada', descarga.status, descarga.headers.get('content-type'));
if (!bytes.equals(PNG_1X1)) {
  throw new Error('La foto descargada no coincide con la subida');
}
if (falsa.status !== 400) {
  throw new Error('Se aceptó un archivo que no es una imagen');
}

paso('Corregir el precio del producto propio');
const corregido = await pedir('PATCH', `/despensa/${productoNuevo.id}`, productoHogarVistaSchema, ana.accessToken, { precio: 2.25 });
console.log(corregido.propio?.precio);

paso('Cambiar el precio de un producto del catálogo debe fallar');
try {
  await pedir('PATCH', `/despensa/${productoLeche.id}`, productoHogarVistaSchema, ana.accessToken, { precio: 1 });
  throw new Error('Se permitió modificar un producto del catálogo');
} catch (error) {
  console.log(error instanceof Error ? error.message : error);
}

paso('Añadir la leche otra vez debe fallar');
try {
  await pedir('POST', '/despensa', productoHogarVistaSchema, ana.accessToken, {
    origen: 'catalogo',
    catalogoProductoId: leche.id,
    estado: 'falta',
  });
  throw new Error('Se permitió un duplicado');
} catch (error) {
  console.log(error instanceof Error ? error.message : error);
}

paso('Luis pone la leche y el producto nuevo en el carro');
const enCarro = await pedir('PATCH', `/despensa/${productoLeche.id}`, productoHogarVistaSchema, luis.accessToken, { enCarro: true });
await pedir('PATCH', `/despensa/${productoNuevo.id}`, productoHogarVistaSchema, luis.accessToken, { enCarro: true });
console.log(enCarro.enCarro, enCarro.actualizadoPor);

paso('Terminar la compra');
const compra = await pedir('POST', '/compras/finalizar', compraVistaSchema, luis.accessToken);
console.log(compra);

paso('Estado final de la despensa');
const despensa = await pedir('GET', '/despensa', z.array(productoHogarVistaSchema), ana.accessToken);
console.log(despensa.map((producto) => `${producto.nombre}: ${producto.estado} (carro: ${producto.enCarro})`));

if (compra.totalEstimado !== Math.round((leche.precio + 2.25) * 100) / 100) {
  throw new Error(`El total debería incluir el precio del producto propio: ${compra.totalEstimado}`);
}

paso('Eliminar el producto propio borra su foto');
await pedir('DELETE', `/despensa/${productoNuevo.id}`, z.null(), ana.accessToken);
const tras = await fetch(`${API.replace(/\/api$/, '')}${fotoUrl}`);
console.log('foto tras borrar →', tras.status);
if (tras.status !== 404) {
  throw new Error('La foto debería haberse borrado');
}

const lecheFinal = despensa.find((producto) => producto.id === productoLeche.id);
if (lecheFinal === undefined || lecheFinal.estado !== 'hay' || lecheFinal.enCarro) {
  throw new Error('La leche debería estar en casa tras la compra');
}

paso('Histórico de compras');
const historico = await pedir('GET', '/compras', z.array(compraVistaSchema), ana.accessToken);
console.log(`${historico.length} compra(s)`);

console.log('\n✅ Flujo completo correcto');
