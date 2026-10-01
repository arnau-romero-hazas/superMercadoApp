import { jwtVerify, SignJWT } from 'jose';
import { z } from 'zod';
import { entorno } from '@/common/entorno.js';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';

type TipoToken = 'access' | 'refresh';

const configuracion: Record<TipoToken, { secreto: Uint8Array; expiracion: string }> = {
  access: { secreto: new TextEncoder().encode(entorno.JWT_SECRET), expiracion: '15m' },
  refresh: { secreto: new TextEncoder().encode(entorno.JWT_REFRESH_SECRET), expiracion: '30d' },
};

const payloadSchema = z.object({ sub: z.string().min(1), tipo: z.enum(['access', 'refresh']) });

export const tokenServicio = {
  firmar: async (usuarioId: string, tipo: TipoToken): Promise<Result<string>> => {
    try {
      const token = await new SignJWT({ tipo })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(usuarioId)
        .setIssuedAt()
        .setExpirationTime(configuracion[tipo].expiracion)
        .sign(configuracion[tipo].secreto);
      return Result.success(token);
    } catch {
      return Result.fail(errores.operacion('No se pudo generar la sesión'));
    }
  },

  verificar: async (token: string, tipo: TipoToken): Promise<Result<string>> => {
    try {
      const { payload } = await jwtVerify(token, configuracion[tipo].secreto);
      const validado = payloadSchema.safeParse(payload);
      if (!validado.success || validado.data.tipo !== tipo) {
        return Result.fail(errores.autorizacion('Sesión no válida'));
      }
      return Result.success(validado.data.sub);
    } catch {
      return Result.fail(errores.autorizacion('Sesión caducada o no válida'));
    }
  },
};
