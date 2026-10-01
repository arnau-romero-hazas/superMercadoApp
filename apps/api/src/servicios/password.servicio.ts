import argon2 from 'argon2';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';

export const passwordServicio = {
  hashear: async (password: string): Promise<Result<string>> => {
    try {
      return Result.success(await argon2.hash(password));
    } catch {
      return Result.fail(errores.operacion('No se pudo procesar la contraseña'));
    }
  },

  verificar: async (hash: string, password: string): Promise<Result<boolean>> => {
    try {
      return Result.success(await argon2.verify(hash, password));
    } catch {
      return Result.fail(errores.operacion('No se pudo verificar la contraseña'));
    }
  },
};
