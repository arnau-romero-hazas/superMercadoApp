import { z } from 'zod';
import { categoriaSchema, estadoProductoSchema, supermercadoSchema } from './dominio.js';

export const usuarioVistaSchema = z.object({
  id: z.string(),
  email: z.string(),
  nombre: z.string(),
});
export type UsuarioVista = z.infer<typeof usuarioVistaSchema>;

export const sesionAuthVistaSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  usuario: usuarioVistaSchema,
});
export type SesionAuthVista = z.infer<typeof sesionAuthVistaSchema>;

export const hogarVistaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  codigoPostal: z.string(),
  supermercado: supermercadoSchema,
  codigoInvitacion: z.string(),
  miembros: z.array(z.object({ id: z.string(), nombre: z.string() })),
});
export type HogarVista = z.infer<typeof hogarVistaSchema>;

export const yoVistaSchema = z.object({
  usuario: usuarioVistaSchema,
  hogar: hogarVistaSchema.nullable(),
});
export type YoVista = z.infer<typeof yoVistaSchema>;

export const productoCatalogoVistaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  formato: z.string().nullable(),
  precio: z.number(),
  imagenUrl: z.string().nullable(),
  categoria: categoriaSchema,
});
export type ProductoCatalogoVista = z.infer<typeof productoCatalogoVistaSchema>;

export const productoHogarVistaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  categoria: categoriaSchema,
  estado: estadoProductoSchema,
  enCarro: z.boolean(),
  nota: z.string().nullable(),
  catalogo: productoCatalogoVistaSchema.nullable(),
  propio: z
    .object({
      supermercado: supermercadoSchema,
      descripcion: z.string().nullable(),
      precio: z.number().nullable(),
      fotoUrl: z.string().nullable(),
    })
    .nullable(),
  actualizadoPor: z.string().nullable(),
  actualizadoEn: z.string(),
});
export type ProductoHogarVista = z.infer<typeof productoHogarVistaSchema>;

export const compraVistaSchema = z.object({
  id: z.string(),
  supermercado: supermercadoSchema,
  finalizadaPor: z.string().nullable(),
  finalizadaEn: z.string(),
  totalEstimado: z.number(),
  lineas: z.array(z.object({ nombre: z.string(), precioEstimado: z.number().nullable() })),
});
export type CompraVista = z.infer<typeof compraVistaSchema>;

export const estadoCatalogoVistaSchema = z.object({
  sincronizando: z.boolean(),
  productos: z.number(),
  sincronizadoEn: z.string().nullable(),
});
export type EstadoCatalogoVista = z.infer<typeof estadoCatalogoVistaSchema>;

export const fotoSubidaVistaSchema = z.object({ id: z.string() });
export type FotoSubidaVista = z.infer<typeof fotoSubidaVistaSchema>;
