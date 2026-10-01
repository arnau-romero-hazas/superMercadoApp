import type { Categoria, EstadoProducto, ProductoHogarVista, Supermercado } from '@super/shared';
import { Result } from '@/common/result';

export const NOMBRES_SUPERMERCADO: Record<Supermercado, string> = { mercadona: 'Mercadona' };

const precioDe = (producto: ProductoHogarVista): number | null => {
  if (producto.catalogo !== null) {
    return producto.catalogo.precio;
  }
  return producto.propio === null ? null : producto.propio.precio;
};

export type GrupoCategoria = { categoria: Categoria; productos: ProductoHogarVista[] };

const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const productos = {
  agruparPorCategoria: (lista: ProductoHogarVista[]): GrupoCategoria[] => {
    const grupos = new Map<string, GrupoCategoria>();
    for (const producto of lista) {
      const grupo = grupos.get(producto.categoria.nombre);
      if (grupo === undefined) {
        grupos.set(producto.categoria.nombre, { categoria: producto.categoria, productos: [producto] });
      } else {
        grupo.productos.push(producto);
      }
    }
    return [...grupos.values()]
      .sort((a, b) => {
        const porOrden = a.categoria.orden - b.categoria.orden;
        return porOrden !== 0 ? porOrden : a.categoria.nombre.localeCompare(b.categoria.nombre, 'es');
      })
      .map((grupo) => ({
        categoria: grupo.categoria,
        productos: [...grupo.productos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      }));
  },

  conEstado: (lista: ProductoHogarVista[], estado: EstadoProducto): ProductoHogarVista[] =>
    lista.filter((producto) => producto.estado === estado),

  enLista: (lista: ProductoHogarVista[]): ProductoHogarVista[] => lista.filter((producto) => producto.estado !== 'hay'),

  filtrar: (lista: ProductoHogarVista[], consulta: string): ProductoHogarVista[] => {
    const buscado = normalizar(consulta);
    if (buscado.length === 0) {
      return lista;
    }
    return lista.filter((producto) => normalizar(producto.nombre).includes(buscado));
  },

  precio: precioDe,

  imagen: (producto: ProductoHogarVista): string | null => {
    if (producto.catalogo !== null) {
      return producto.catalogo.imagenUrl;
    }
    return producto.propio === null ? null : producto.propio.fotoUrl;
  },

  totalEstimado: (lista: ProductoHogarVista[]): number =>
    Math.round(lista.reduce((total, producto) => total + (precioDe(producto) ?? 0), 0) * 100) / 100,

  leerPrecio: (texto: string): Result<number | null, string> => {
    const limpio = texto.trim().replace(',', '.').replace('€', '').trim();
    if (limpio.length === 0) {
      return Result.success(null);
    }
    if (!/^\d+(\.\d{1,2})?$/.test(limpio)) {
      return Result.fail('Precio no válido, por ejemplo 2,35');
    }
    return Result.success(Number.parseFloat(limpio));
  },

  subtitulo: (producto: ProductoHogarVista): string | null => {
    if (producto.nota !== null) {
      return producto.nota;
    }
    if (producto.catalogo !== null) {
      return producto.catalogo.formato;
    }
    return producto.propio === null ? null : producto.propio.descripcion;
  },

  formatearPrecio: (precio: number): string =>
    precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
};
