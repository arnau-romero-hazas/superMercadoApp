import { Logger } from '@nestjs/common';
import type { ActualizarProductoPeticion, CrearProductoPeticion } from '@super/shared';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { hogarActual } from '@/logica/hogar-actual.js';
import { catalogoRepositorio, type ProductoCatalogo } from '@/repositorios/catalogo.repositorio.js';
import type { Hogar } from '@/repositorios/hogar.repositorio.js';
import { fotoRepositorio } from '@/repositorios/foto.repositorio.js';
import {
  type CambiosProductoHogar,
  type DatosPropios,
  type NuevoProductoHogar,
  type ProductoHogar,
  productoHogarRepositorio,
} from '@/repositorios/producto-hogar.repositorio.js';
import { type Usuario, usuarioRepositorio } from '@/repositorios/usuario.repositorio.js';

const logger = new Logger('DespensaLogica');

export type DetalleProducto = {
  producto: ProductoHogar;
  catalogo: ProductoCatalogo | null;
  actualizadoPor: Usuario | null;
};

const idExternoEnHogar = (hogar: Hogar, producto: ProductoHogar): string | null =>
  producto.equivalencias.find((equivalencia) => equivalencia.supermercado === hogar.supermercado)?.idExterno ?? null;

const detallar = async (hogar: Hogar, productos: ProductoHogar[]): Promise<Result<DetalleProducto[]>> => {
  const idsExternos = productos.map((producto) => idExternoEnHogar(hogar, producto)).filter((id) => id !== null);
  const catalogo = await catalogoRepositorio.buscarPorIdsExternos(hogar.supermercado, hogar.zonaCatalogo, idsExternos);
  if (!catalogo.ok) {
    return catalogo;
  }
  const miembros = await usuarioRepositorio.buscarPorIds(hogar.miembros.map((miembro) => miembro.usuarioId));
  if (!miembros.ok) {
    return miembros;
  }
  const catalogoPorId = new Map(catalogo.value.map((producto) => [producto.idExterno, producto]));
  const miembrosPorId = new Map(miembros.value.map((miembro) => [miembro.id, miembro]));
  return Result.success(
    productos.map((producto) => {
      const idExterno = idExternoEnHogar(hogar, producto);
      return {
        producto,
        catalogo: idExterno === null ? null : (catalogoPorId.get(idExterno) ?? null),
        actualizadoPor: producto.actualizadoPor === null ? null : (miembrosPorId.get(producto.actualizadoPor) ?? null),
      };
    }),
  );
};

const detallarUno = async (hogar: Hogar, producto: ProductoHogar): Promise<Result<DetalleProducto>> => {
  const detalles = await detallar(hogar, [producto]);
  if (!detalles.ok) {
    return detalles;
  }
  const [detalle] = detalles.value;
  if (detalle === undefined) {
    return Result.fail(errores.operacion('No se pudo preparar el producto'));
  }
  return Result.success(detalle);
};

const textoONulo = (valor: string | null): string | null => (valor === null || valor.length === 0 ? null : valor);

const validarFoto = async (hogar: Hogar, fotoId: string | null): Promise<Result<void>> => {
  if (fotoId === null) {
    return Result.success(undefined);
  }
  const foto = await fotoRepositorio.buscar(fotoId);
  if (!foto.ok) {
    return foto;
  }
  if (foto.value === null || foto.value.hogarId !== hogar.id) {
    return Result.fail(errores.validacion('La foto no existe'));
  }
  return Result.success(undefined);
};

const limpiarFoto = async (fotoId: string | null): Promise<void> => {
  if (fotoId === null) {
    return;
  }
  const eliminada = await fotoRepositorio.eliminar(fotoId);
  if (!eliminada.ok) {
    logger.warn(`No se pudo eliminar la foto ${fotoId}: ${eliminada.error.mensaje}`);
  }
};

const prepararNuevo = async (
  hogar: Hogar,
  usuarioId: string,
  peticion: CrearProductoPeticion,
): Promise<Result<NuevoProductoHogar>> => {
  const base = { hogarId: hogar.id, estado: peticion.estado, enCarro: false, nota: null, actualizadoPor: usuarioId };
  if (peticion.origen === 'propio') {
    const foto = await validarFoto(hogar, peticion.fotoId);
    if (!foto.ok) {
      return foto;
    }
    return Result.success({
      ...base,
      nombre: peticion.nombre,
      categoria: peticion.categoria,
      equivalencias: [],
      propio: {
        supermercado: peticion.supermercado,
        descripcion: textoONulo(peticion.descripcion),
        precio: peticion.precio,
        fotoId: peticion.fotoId,
      },
    });
  }

  const equivalencia = { supermercado: hogar.supermercado, idExterno: peticion.catalogoProductoId };
  const existente = await productoHogarRepositorio.buscarPorEquivalencia(hogar.id, equivalencia);
  if (!existente.ok) {
    return existente;
  }
  if (existente.value !== null) {
    return Result.fail(errores.estado(`"${existente.value.nombre}" ya está en la despensa`));
  }
  const catalogo = await catalogoRepositorio.buscarPorIdsExternos(hogar.supermercado, hogar.zonaCatalogo, [
    peticion.catalogoProductoId,
  ]);
  if (!catalogo.ok) {
    return catalogo;
  }
  const [productoCatalogo] = catalogo.value;
  if (productoCatalogo === undefined) {
    return Result.fail(errores.existencia('El producto no existe en el catálogo'));
  }
  return Result.success({
    ...base,
    nombre: productoCatalogo.nombre,
    categoria: productoCatalogo.categoria,
    equivalencias: [equivalencia],
    propio: null,
  });
};

const calcularPropio = async (
  hogar: Hogar,
  producto: ProductoHogar,
  peticion: ActualizarProductoPeticion,
): Promise<Result<DatosPropios | null>> => {
  const cambiaPropio = peticion.descripcion !== undefined || peticion.precio !== undefined || peticion.fotoId !== undefined;
  if (!cambiaPropio) {
    return Result.success(producto.propio);
  }
  if (producto.propio === null) {
    return Result.fail(errores.validacion('Los productos del catálogo no se pueden modificar'));
  }
  const fotoId = peticion.fotoId === undefined ? producto.propio.fotoId : peticion.fotoId;
  if (fotoId !== producto.propio.fotoId) {
    const foto = await validarFoto(hogar, fotoId);
    if (!foto.ok) {
      return foto;
    }
  }
  return Result.success({
    supermercado: producto.propio.supermercado,
    descripcion: peticion.descripcion === undefined ? producto.propio.descripcion : textoONulo(peticion.descripcion),
    precio: peticion.precio === undefined ? producto.propio.precio : peticion.precio,
    fotoId,
  });
};

const calcularCambios = async (
  hogar: Hogar,
  producto: ProductoHogar,
  usuarioId: string,
  peticion: ActualizarProductoPeticion,
): Promise<Result<CambiosProductoHogar>> => {
  const estado = peticion.estado ?? producto.estado;
  const enCarro = estado === 'hay' ? false : (peticion.enCarro ?? producto.enCarro);
  if (peticion.enCarro === true && estado === 'hay') {
    return Result.fail(errores.estado('Solo se pueden poner en el carro productos que faltan'));
  }
  const cambios: CambiosProductoHogar = { actualizadoPor: usuarioId, estado, enCarro };
  if (peticion.nombre !== undefined) {
    cambios.nombre = peticion.nombre;
  }
  if (peticion.nota !== undefined) {
    cambios.nota = textoONulo(peticion.nota);
  }
  const propio = await calcularPropio(hogar, producto, peticion);
  if (!propio.ok) {
    return propio;
  }
  cambios.propio = propio.value;
  return Result.success(cambios);
};

const productoNoEncontrado = errores.existencia('El producto no existe');

export const despensaLogica = {
  listar: async (usuarioId: string): Promise<Result<DetalleProducto[]>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const productos = await productoHogarRepositorio.listarPorHogar(hogar.value.id);
    if (!productos.ok) {
      return productos;
    }
    return detallar(hogar.value, productos.value);
  },

  crear: async (usuarioId: string, peticion: CrearProductoPeticion): Promise<Result<DetalleProducto>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const nuevo = await prepararNuevo(hogar.value, usuarioId, peticion);
    if (!nuevo.ok) {
      return nuevo;
    }
    const producto = await productoHogarRepositorio.crear(nuevo.value);
    if (!producto.ok) {
      return producto;
    }
    return detallarUno(hogar.value, producto.value);
  },

  actualizar: async (
    usuarioId: string,
    productoId: string,
    peticion: ActualizarProductoPeticion,
  ): Promise<Result<DetalleProducto>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const producto = await productoHogarRepositorio.buscarEnHogar(hogar.value.id, productoId);
    if (!producto.ok) {
      return producto;
    }
    if (producto.value === null) {
      return Result.fail(productoNoEncontrado);
    }
    const cambios = await calcularCambios(hogar.value, producto.value, usuarioId, peticion);
    if (!cambios.ok) {
      return cambios;
    }
    const actualizado = await productoHogarRepositorio.actualizar(producto.value.id, cambios.value);
    if (!actualizado.ok) {
      return actualizado;
    }
    if (actualizado.value === null) {
      return Result.fail(productoNoEncontrado);
    }
    const fotoAnterior = producto.value.propio === null ? null : producto.value.propio.fotoId;
    const fotoNueva = actualizado.value.propio === null ? null : actualizado.value.propio.fotoId;
    if (fotoAnterior !== fotoNueva) {
      await limpiarFoto(fotoAnterior);
    }
    return detallarUno(hogar.value, actualizado.value);
  },

  eliminar: async (usuarioId: string, productoId: string): Promise<Result<void>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const producto = await productoHogarRepositorio.buscarEnHogar(hogar.value.id, productoId);
    if (!producto.ok) {
      return producto;
    }
    if (producto.value === null) {
      return Result.fail(productoNoEncontrado);
    }
    const eliminado = await productoHogarRepositorio.eliminar(producto.value.id);
    if (!eliminado.ok) {
      return eliminado;
    }
    if (!eliminado.value) {
      return Result.fail(productoNoEncontrado);
    }
    await limpiarFoto(producto.value.propio === null ? null : producto.value.propio.fotoId);
    return Result.success(undefined);
  },
};
