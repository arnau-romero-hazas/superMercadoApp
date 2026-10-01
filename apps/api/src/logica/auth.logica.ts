import type { LoginPeticion, RegistroPeticion } from '@super/shared';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { type Usuario, usuarioRepositorio } from '@/repositorios/usuario.repositorio.js';
import { passwordServicio } from '@/servicios/password.servicio.js';
import { tokenServicio } from '@/servicios/token.servicio.js';

export type SesionAuth = { accessToken: string; refreshToken: string; usuario: Usuario };

const credencialesIncorrectas = errores.autorizacion('Email o contraseña incorrectos');

const emitirSesion = async (usuario: Usuario): Promise<Result<SesionAuth>> => {
  const accessToken = await tokenServicio.firmar(usuario.id, 'access');
  if (!accessToken.ok) {
    return accessToken;
  }
  const refreshToken = await tokenServicio.firmar(usuario.id, 'refresh');
  if (!refreshToken.ok) {
    return refreshToken;
  }
  return Result.success({ accessToken: accessToken.value, refreshToken: refreshToken.value, usuario });
};

const obtenerUsuario = async (usuarioId: string): Promise<Result<Usuario>> => {
  const usuario = await usuarioRepositorio.buscarPorId(usuarioId);
  if (!usuario.ok) {
    return usuario;
  }
  if (usuario.value === null) {
    return Result.fail(errores.existencia('La cuenta no existe'));
  }
  return Result.success(usuario.value);
};

export const authLogica = {
  registrar: async (peticion: RegistroPeticion): Promise<Result<SesionAuth>> => {
    const passwordHash = await passwordServicio.hashear(peticion.password);
    if (!passwordHash.ok) {
      return passwordHash;
    }
    const usuario = await usuarioRepositorio.crear({
      email: peticion.email,
      nombre: peticion.nombre,
      passwordHash: passwordHash.value,
    });
    if (!usuario.ok) {
      return usuario;
    }
    return emitirSesion(usuario.value);
  },

  login: async (peticion: LoginPeticion): Promise<Result<SesionAuth>> => {
    const usuario = await usuarioRepositorio.buscarPorEmail(peticion.email);
    if (!usuario.ok) {
      return usuario;
    }
    if (usuario.value === null) {
      return Result.fail(credencialesIncorrectas);
    }
    const valida = await passwordServicio.verificar(usuario.value.passwordHash, peticion.password);
    if (!valida.ok) {
      return valida;
    }
    if (!valida.value) {
      return Result.fail(credencialesIncorrectas);
    }
    return emitirSesion(usuario.value);
  },

  refrescar: async (refreshToken: string): Promise<Result<SesionAuth>> => {
    const usuarioId = await tokenServicio.verificar(refreshToken, 'refresh');
    if (!usuarioId.ok) {
      return usuarioId;
    }
    const usuario = await obtenerUsuario(usuarioId.value);
    if (!usuario.ok) {
      return Result.fail(errores.autorizacion('Sesión no válida'));
    }
    return emitirSesion(usuario.value);
  },

  verificarAcceso: (accessToken: string): Promise<Result<string>> => tokenServicio.verificar(accessToken, 'access'),

  obtenerUsuario,
};
