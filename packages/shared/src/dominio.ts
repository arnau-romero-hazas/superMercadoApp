import { z } from 'zod';

export const estadoProductoSchema = z.enum(['hay', 'queda_poco', 'falta']);
export type EstadoProducto = z.infer<typeof estadoProductoSchema>;

export const supermercadoSchema = z.enum(['mercadona']);
export type Supermercado = z.infer<typeof supermercadoSchema>;

export const categoriaSchema = z.object({
  nombre: z.string().min(1),
  orden: z.number().int(),
});
export type Categoria = z.infer<typeof categoriaSchema>;

export const CATEGORIA_OTROS: Categoria = { nombre: 'Otros', orden: 999 };
