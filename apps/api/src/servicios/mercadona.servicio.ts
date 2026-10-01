import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import type { ProductoExterno } from '@/servicios/catalogo-proveedor.js';

const URL_BASE = 'https://tienda.mercadona.es/api';
const PAUSA_ENTRE_PETICIONES_MS = 250;
const TIMEOUT_MS = 15_000;

const logger = new Logger('MercadonaServicio');

const categoriasRaizSchema = z.object({
  results: z.array(
    z.object({
      name: z.string(),
      order: z.number(),
      categories: z.array(z.object({ id: z.number() })),
    }),
  ),
});

const categoriaDetalleSchema = z.object({
  categories: z.array(
    z.object({
      products: z.array(
        z.object({
          id: z.string(),
          display_name: z.string(),
          packaging: z.string().nullable(),
          thumbnail: z.string().nullable(),
          price_instructions: z.object({
            unit_price: z.string(),
            unit_size: z.number().nullable(),
            size_format: z.string().nullable(),
          }),
        }),
      ),
    }),
  ),
});

type ProductoMercadona = z.infer<typeof categoriaDetalleSchema>['categories'][number]['products'][number];

const esperar = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const obtenerJson = async <T>(url: string, schema: z.ZodType<T>): Promise<Result<T>> => {
  try {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!respuesta.ok) {
      return Result.fail(errores.operacion(`El catálogo respondió ${respuesta.status}`));
    }
    const validado = schema.safeParse(await respuesta.json());
    if (!validado.success) {
      logger.warn(`Respuesta inesperada de ${url}: ${validado.error.message}`);
      return Result.fail(errores.operacion('El formato del catálogo ha cambiado'));
    }
    return Result.success(validado.data);
  } catch (error) {
    logger.warn(`Error consultando ${url}: ${String(error)}`);
    return Result.fail(errores.operacion('No se pudo consultar el catálogo'));
  }
};

const formatearTamano = (producto: ProductoMercadona): string | null => {
  const { unit_size, size_format } = producto.price_instructions;
  if (unit_size === null || size_format === null) {
    return null;
  }
  return `${unit_size.toLocaleString('es-ES')} ${size_format}`;
};

const aProductoExterno = (producto: ProductoMercadona, categoria: { nombre: string; orden: number }): ProductoExterno | null => {
  const precio = Number.parseFloat(producto.price_instructions.unit_price);
  if (Number.isNaN(precio)) {
    return null;
  }
  const partesFormato = [producto.packaging, formatearTamano(producto)].filter((parte) => parte !== null);
  return {
    idExterno: producto.id,
    nombre: producto.display_name,
    formato: partesFormato.length === 0 ? null : partesFormato.join(' '),
    precio,
    imagenUrl: producto.thumbnail,
    categoria,
  };
};

export const mercadonaServicio = {
  resolverZona: async (codigoPostal: string): Promise<Result<string>> => {
    try {
      const respuesta = await fetch(`${URL_BASE}/postal-codes/actions/change-pc/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_postal_code: codigoPostal }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const zona = respuesta.headers.get('x-customer-wh');
      if (!respuesta.ok || zona === null || zona.length === 0) {
        return Result.fail(errores.validacion('No hay servicio para ese código postal'));
      }
      return Result.success(zona);
    } catch (error) {
      logger.warn(`Error resolviendo el código postal ${codigoPostal}: ${String(error)}`);
      return Result.fail(errores.operacion('No se pudo validar el código postal'));
    }
  },

  descargarCatalogo: async (zona: string): Promise<Result<ProductoExterno[]>> => {
    const parametros = `lang=es&wh=${encodeURIComponent(zona)}`;
    const raiz = await obtenerJson(`${URL_BASE}/categories/?${parametros}`, categoriasRaizSchema);
    if (!raiz.ok) {
      return raiz;
    }

    const productos = new Map<string, ProductoExterno>();
    for (const categoriaRaiz of raiz.value.results) {
      const categoria = { nombre: categoriaRaiz.name, orden: categoriaRaiz.order };
      for (const subcategoria of categoriaRaiz.categories) {
        await esperar(PAUSA_ENTRE_PETICIONES_MS);
        const detalle = await obtenerJson(`${URL_BASE}/categories/${subcategoria.id}/?${parametros}`, categoriaDetalleSchema);
        if (!detalle.ok) {
          return detalle;
        }
        for (const grupo of detalle.value.categories) {
          for (const producto of grupo.products) {
            const externo = aProductoExterno(producto, categoria);
            if (externo !== null && !productos.has(externo.idExterno)) {
              productos.set(externo.idExterno, externo);
            }
          }
        }
      }
    }
    return Result.success([...productos.values()]);
  },
};
