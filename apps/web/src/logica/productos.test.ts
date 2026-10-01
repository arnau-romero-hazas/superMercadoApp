import type { ProductoHogarVista } from '@super/shared';
import { describe, expect, it } from 'vitest';
import { productos } from '@/logica/productos';

const crear = (datos: Partial<ProductoHogarVista> & Pick<ProductoHogarVista, 'id' | 'nombre'>): ProductoHogarVista => ({
  categoria: { nombre: 'Otros', orden: 999 },
  estado: 'hay',
  enCarro: false,
  nota: null,
  catalogo: null,
  propio: null,
  actualizadoPor: null,
  actualizadoEn: '2026-10-01T00:00:00.000Z',
  ...datos,
});

const lacteos = { nombre: 'Lácteos', orden: 3 };
const fruta = { nombre: 'Fruta', orden: 1 };

describe('productos', () => {
  it('agrupa por categoría ordenando por orden de pasillo y luego por nombre', () => {
    const grupos = productos.agruparPorCategoria([
      crear({ id: '1', nombre: 'Yogur', categoria: lacteos }),
      crear({ id: '2', nombre: 'Pan', categoria: { nombre: 'Otros', orden: 999 } }),
      crear({ id: '3', nombre: 'Plátano', categoria: fruta }),
      crear({ id: '4', nombre: 'Leche', categoria: lacteos }),
    ]);
    expect(grupos.map((grupo) => grupo.categoria.nombre)).toEqual(['Fruta', 'Lácteos', 'Otros']);
    expect(grupos[1]?.productos.map((producto) => producto.nombre)).toEqual(['Leche', 'Yogur']);
  });

  it('la lista contiene lo que falta y lo que queda poco', () => {
    const lista = productos.enLista([
      crear({ id: '1', nombre: 'A', estado: 'hay' }),
      crear({ id: '2', nombre: 'B', estado: 'falta' }),
      crear({ id: '3', nombre: 'C', estado: 'queda_poco' }),
    ]);
    expect(lista.map((producto) => producto.id)).toEqual(['2', '3']);
  });

  it('filtra sin distinguir mayúsculas ni tildes', () => {
    const lista = [crear({ id: '1', nombre: 'Plátano de Canarias' }), crear({ id: '2', nombre: 'Leche' })];
    expect(productos.filtrar(lista, 'PLATANO').map((producto) => producto.id)).toEqual(['1']);
    expect(productos.filtrar(lista, '  ')).toHaveLength(2);
  });

  it('suma el total estimado ignorando productos sin precio', () => {
    const catalogo = (precio: number) => ({
      id: 'x',
      nombre: 'x',
      formato: null,
      precio,
      imagenUrl: null,
      categoria: fruta,
    });
    const total = productos.totalEstimado([
      crear({ id: '1', nombre: 'A', catalogo: catalogo(1.1) }),
      crear({ id: '2', nombre: 'B', catalogo: catalogo(2.2) }),
      crear({ id: '3', nombre: 'C' }),
      crear({
        id: '4',
        nombre: 'D',
        propio: { supermercado: 'mercadona', descripcion: null, precio: 0.45, fotoUrl: null },
      }),
    ]);
    expect(total).toBe(3.75);
  });

  it('lee precios con coma, punto o símbolo de euro', () => {
    expect(productos.leerPrecio('2,35')).toEqual({ ok: true, value: 2.35 });
    expect(productos.leerPrecio(' 3.1 € ')).toEqual({ ok: true, value: 3.1 });
    expect(productos.leerPrecio('')).toEqual({ ok: true, value: null });
    expect(productos.leerPrecio('dos euros').ok).toBe(false);
    expect(productos.leerPrecio('1,234').ok).toBe(false);
  });
});
