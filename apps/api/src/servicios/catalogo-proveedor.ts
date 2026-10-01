import type { Categoria, Supermercado } from '@super/shared';
import type { Result } from '@/common/result.js';
import { mercadonaServicio } from '@/servicios/mercadona.servicio.js';

export type ProductoExterno = {
  idExterno: string;
  nombre: string;
  formato: string | null;
  precio: number;
  imagenUrl: string | null;
  categoria: Categoria;
};

export type ProveedorCatalogo = {
  resolverZona: (codigoPostal: string) => Promise<Result<string>>;
  descargarCatalogo: (zona: string) => Promise<Result<ProductoExterno[]>>;
};

export const catalogoProveedores: Record<Supermercado, ProveedorCatalogo> = {
  mercadona: mercadonaServicio,
};
