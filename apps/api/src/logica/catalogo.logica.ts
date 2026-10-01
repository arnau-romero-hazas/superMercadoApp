import { Logger } from '@nestjs/common';
import { CATEGORIA_OTROS, type Categoria, type Supermercado } from '@super/shared';
import { Result } from '@/common/result.js';
import { texto } from '@/common/texto.js';
import { hogarActual } from '@/logica/hogar-actual.js';
import { catalogoRepositorio, type EstadoSincronizacion, type ProductoCatalogo } from '@/repositorios/catalogo.repositorio.js';
import { hogarRepositorio } from '@/repositorios/hogar.repositorio.js';
import { catalogoProveedores } from '@/servicios/catalogo-proveedor.js';

const LIMITE_BUSQUEDA = 40;
const CANDIDATOS_BUSQUEDA = 300;

const logger = new Logger('CatalogoLogica');

const sincronizar = async (supermercado: Supermercado, zona: string): Promise<Result<number | null>> => {
  const iniciada = await catalogoRepositorio.iniciarSincronizacion(supermercado, zona);
  if (!iniciada.ok) {
    return iniciada;
  }
  if (!iniciada.value) {
    return Result.success(null);
  }

  logger.log(`Sincronizando catálogo ${supermercado}/${zona}`);
  const descarga = await catalogoProveedores[supermercado].descargarCatalogo(zona);
  const guardado = descarga.ok
    ? await catalogoRepositorio.reemplazarZona(
        supermercado,
        zona,
        descarga.value.map((producto) => ({ ...producto, supermercado, zona })),
      )
    : descarga;

  const finalizada = await catalogoRepositorio.finalizarSincronizacion(supermercado, zona, guardado.ok ? guardado.value : null);
  if (!guardado.ok) {
    logger.error(`Falló la sincronización ${supermercado}/${zona}: ${guardado.error.mensaje}`);
    return guardado;
  }
  if (!finalizada.ok) {
    return finalizada;
  }
  logger.log(`Catálogo ${supermercado}/${zona} sincronizado: ${guardado.value} productos`);
  return Result.success(guardado.value);
};

const puntuar = (nombre: string, primeraPalabra: string): number => {
  const normalizado = texto.normalizar(nombre);
  if (normalizado.startsWith(primeraPalabra)) {
    return 0;
  }
  if (normalizado.split(/\s+/).some((palabra) => palabra.startsWith(primeraPalabra))) {
    return 1;
  }
  return 2;
};

const ordenarPorRelevancia = (productos: ProductoCatalogo[], consulta: string): ProductoCatalogo[] => {
  const primeraPalabra = texto.normalizar(consulta).split(/\s+/)[0];
  if (primeraPalabra === undefined) {
    return productos;
  }
  return productos
    .map((producto) => ({ producto, puntuacion: puntuar(producto.nombre, primeraPalabra) }))
    .sort((a, b) => {
      const porPuntuacion = a.puntuacion - b.puntuacion;
      if (porPuntuacion !== 0) {
        return porPuntuacion;
      }
      const porLongitud = a.producto.nombre.length - b.producto.nombre.length;
      return porLongitud !== 0 ? porLongitud : a.producto.nombre.localeCompare(b.producto.nombre, 'es');
    })
    .map(({ producto }) => producto);
};

export const catalogoLogica = {
  sincronizar,

  asegurarSincronizado: async (supermercado: Supermercado, zona: string): Promise<Result<void>> => {
    const estado = await catalogoRepositorio.estadoSincronizacion(supermercado, zona);
    if (!estado.ok) {
      return estado;
    }
    if (estado.value !== null && estado.value.sincronizadoEn !== null) {
      return Result.success(undefined);
    }
    const resultado = await sincronizar(supermercado, zona);
    return resultado.ok ? Result.success(undefined) : resultado;
  },

  sincronizarZonasEnUso: async (): Promise<Result<void>> => {
    const zonas = await hogarRepositorio.zonasEnUso();
    if (!zonas.ok) {
      return zonas;
    }
    for (const { supermercado, zona } of zonas.value) {
      await sincronizar(supermercado, zona);
    }
    return Result.success(undefined);
  },

  buscar: async (usuarioId: string, consulta: string): Promise<Result<ProductoCatalogo[]>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const candidatos = await catalogoRepositorio.buscar(
      hogar.value.supermercado,
      hogar.value.zonaCatalogo,
      consulta,
      CANDIDATOS_BUSQUEDA,
    );
    if (!candidatos.ok) {
      return candidatos;
    }
    return Result.success(ordenarPorRelevancia(candidatos.value, consulta).slice(0, LIMITE_BUSQUEDA));
  },

  categorias: async (usuarioId: string): Promise<Result<Categoria[]>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const categorias = await catalogoRepositorio.categorias(hogar.value.supermercado, hogar.value.zonaCatalogo);
    if (!categorias.ok) {
      return categorias;
    }
    return Result.success([...categorias.value, CATEGORIA_OTROS]);
  },

  estado: async (usuarioId: string): Promise<Result<EstadoSincronizacion>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const estado = await catalogoRepositorio.estadoSincronizacion(hogar.value.supermercado, hogar.value.zonaCatalogo);
    if (!estado.ok) {
      return estado;
    }
    return Result.success(estado.value ?? { sincronizando: false, productos: 0, sincronizadoEn: null });
  },
};
