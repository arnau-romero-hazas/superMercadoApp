import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { type Hogar, hogarRepositorio } from '@/repositorios/hogar.repositorio.js';

export const hogarActual = {
  exigir: async (usuarioId: string): Promise<Result<Hogar>> => {
    const hogar = await hogarRepositorio.buscarPorMiembro(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    if (hogar.value === null) {
      return Result.fail(errores.existencia('Todavía no perteneces a ningún hogar'));
    }
    return Result.success(hogar.value);
  },
};
