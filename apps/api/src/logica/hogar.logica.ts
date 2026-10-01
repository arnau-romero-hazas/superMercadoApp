import { randomInt } from 'node:crypto';
import type { ActualizarHogarPeticion, CrearHogarPeticion, Supermercado } from '@super/shared';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { hogarActual } from '@/logica/hogar-actual.js';
import { type Hogar, hogarRepositorio } from '@/repositorios/hogar.repositorio.js';
import { type Usuario, usuarioRepositorio } from '@/repositorios/usuario.repositorio.js';
import { catalogoProveedores } from '@/servicios/catalogo-proveedor.js';

export type HogarDetalle = { hogar: Hogar; miembros: Usuario[] };

const SUPERMERCADO_INICIAL: Supermercado = 'mercadona';
const ALFABETO_INVITACION = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LONGITUD_INVITACION = 6;
const INTENTOS_INVITACION = 5;

const generarCodigoInvitacion = (): string =>
  Array.from({ length: LONGITUD_INVITACION }, () => ALFABETO_INVITACION.charAt(randomInt(ALFABETO_INVITACION.length))).join('');

const conMiembros = async (hogar: Hogar): Promise<Result<HogarDetalle>> => {
  const miembros = await usuarioRepositorio.buscarPorIds(hogar.miembros.map((miembro) => miembro.usuarioId));
  if (!miembros.ok) {
    return miembros;
  }
  return Result.success({ hogar, miembros: miembros.value });
};

const exigirSinHogar = async (usuarioId: string): Promise<Result<void>> => {
  const actual = await hogarRepositorio.buscarPorMiembro(usuarioId);
  if (!actual.ok) {
    return actual;
  }
  if (actual.value !== null) {
    return Result.fail(errores.estado('Ya perteneces a un hogar'));
  }
  return Result.success(undefined);
};

export const hogarLogica = {
  crear: async (usuarioId: string, peticion: CrearHogarPeticion): Promise<Result<HogarDetalle>> => {
    const sinHogar = await exigirSinHogar(usuarioId);
    if (!sinHogar.ok) {
      return sinHogar;
    }
    const zona = await catalogoProveedores[SUPERMERCADO_INICIAL].resolverZona(peticion.codigoPostal);
    if (!zona.ok) {
      return zona;
    }
    for (let intento = 0; intento < INTENTOS_INVITACION; intento++) {
      const hogar = await hogarRepositorio.crear({
        nombre: peticion.nombre,
        codigoPostal: peticion.codigoPostal,
        supermercado: SUPERMERCADO_INICIAL,
        zonaCatalogo: zona.value,
        codigoInvitacion: generarCodigoInvitacion(),
        miembros: [{ usuarioId, rol: 'admin', unidoEn: new Date() }],
      });
      if (hogar.ok) {
        return conMiembros(hogar.value);
      }
      if (hogar.error.tipo !== 'StateError') {
        return hogar;
      }
    }
    return Result.fail(errores.operacion('No se pudo generar un código de invitación'));
  },

  unirse: async (usuarioId: string, codigoInvitacion: string): Promise<Result<HogarDetalle>> => {
    const sinHogar = await exigirSinHogar(usuarioId);
    if (!sinHogar.ok) {
      return sinHogar;
    }
    const hogar = await hogarRepositorio.buscarPorCodigoInvitacion(codigoInvitacion);
    if (!hogar.ok) {
      return hogar;
    }
    if (hogar.value === null) {
      return Result.fail(errores.existencia('No existe ningún hogar con ese código'));
    }
    const actualizado = await hogarRepositorio.anadirMiembro(hogar.value.id, usuarioId);
    if (!actualizado.ok) {
      return actualizado;
    }
    if (actualizado.value === null) {
      return Result.fail(errores.existencia('El hogar ya no existe'));
    }
    return conMiembros(actualizado.value);
  },

  obtenerDelUsuario: async (usuarioId: string): Promise<Result<HogarDetalle | null>> => {
    const hogar = await hogarRepositorio.buscarPorMiembro(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    if (hogar.value === null) {
      return Result.success(null);
    }
    return conMiembros(hogar.value);
  },


  actualizar: async (usuarioId: string, peticion: ActualizarHogarPeticion): Promise<Result<HogarDetalle>> => {
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const cambios: Partial<Pick<Hogar, 'nombre' | 'codigoPostal' | 'zonaCatalogo'>> = {};
    if (peticion.nombre !== undefined) {
      cambios.nombre = peticion.nombre;
    }
    if (peticion.codigoPostal !== undefined && peticion.codigoPostal !== hogar.value.codigoPostal) {
      const zona = await catalogoProveedores[hogar.value.supermercado].resolverZona(peticion.codigoPostal);
      if (!zona.ok) {
        return zona;
      }
      cambios.codigoPostal = peticion.codigoPostal;
      cambios.zonaCatalogo = zona.value;
    }
    const actualizado = await hogarRepositorio.actualizar(hogar.value.id, cambios);
    if (!actualizado.ok) {
      return actualizado;
    }
    if (actualizado.value === null) {
      return Result.fail(errores.existencia('El hogar ya no existe'));
    }
    return conMiembros(actualizado.value);
  },
};
