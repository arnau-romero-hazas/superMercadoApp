import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { hogarActual } from '@/logica/hogar-actual.js';
import { catalogoRepositorio } from '@/repositorios/catalogo.repositorio.js';
import { type Compra, compraRepositorio } from '@/repositorios/compra.repositorio.js';
import { productoHogarRepositorio } from '@/repositorios/producto-hogar.repositorio.js';
import { type Usuario, usuarioRepositorio } from '@/repositorios/usuario.repositorio.js';

export type CompraDetalle = { compra: Compra; finalizadaPor: Usuario | null };

const LIMITE_HISTORICO = 50;

export const compraLogica = {
  finalizar: async (usuarioId: string): Promise<Result<CompraDetalle>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const { id: hogarId, supermercado, zonaCatalogo } = hogar.value;
    const enCarro = await productoHogarRepositorio.listarEnCarro(hogarId);
    if (!enCarro.ok) {
      return enCarro;
    }
    if (enCarro.value.length === 0) {
      return Result.fail(errores.estado('No hay nada en el carro'));
    }

    const idsExternos = enCarro.value
      .map((producto) => producto.equivalencias.find((equivalencia) => equivalencia.supermercado === supermercado))
      .filter((equivalencia) => equivalencia !== undefined)
      .map((equivalencia) => equivalencia.idExterno);
    const catalogo = await catalogoRepositorio.buscarPorIdsExternos(supermercado, zonaCatalogo, idsExternos);
    if (!catalogo.ok) {
      return catalogo;
    }
    const precios = new Map(catalogo.value.map((producto) => [producto.idExterno, producto.precio]));

    const lineas = enCarro.value.map((producto) => {
      const equivalencia = producto.equivalencias.find((item) => item.supermercado === supermercado);
      return {
        productoHogarId: producto.id,
        nombre: producto.nombre,
        precioEstimado:
          equivalencia === undefined
            ? producto.propio === null
              ? null
              : producto.propio.precio
            : (precios.get(equivalencia.idExterno) ?? null),
      };
    });
    const totalEstimado = lineas.reduce((total, linea) => total + (linea.precioEstimado ?? 0), 0);

    const compra = await compraRepositorio.crear({
      hogarId,
      supermercado,
      finalizadaPor: usuarioId,
      finalizadaEn: new Date(),
      lineas,
      totalEstimado: Math.round(totalEstimado * 100) / 100,
    });
    if (!compra.ok) {
      return compra;
    }
    const repuestos = await productoHogarRepositorio.reponerCarro(hogarId, usuarioId);
    if (!repuestos.ok) {
      return repuestos;
    }
    const usuario = await usuarioRepositorio.buscarPorId(usuarioId);
    if (!usuario.ok) {
      return usuario;
    }
    return Result.success({ compra: compra.value, finalizadaPor: usuario.value });
  },

  listar: async (usuarioId: string): Promise<Result<CompraDetalle[]>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const compras = await compraRepositorio.listarPorHogar(hogar.value.id, LIMITE_HISTORICO);
    if (!compras.ok) {
      return compras;
    }
    const usuarios = await usuarioRepositorio.buscarPorIds(hogar.value.miembros.map((miembro) => miembro.usuarioId));
    if (!usuarios.ok) {
      return usuarios;
    }
    const usuariosPorId = new Map(usuarios.value.map((usuario) => [usuario.id, usuario]));
    return Result.success(
      compras.value.map((compra) => ({ compra, finalizadaPor: usuariosPorId.get(compra.finalizadaPor) ?? null })),
    );
  },
};
