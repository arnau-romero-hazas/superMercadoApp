import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { authLogica } from '@/logica/auth.logica.js';

declare global {
  namespace Express {
    interface Request {
      usuarioId?: string;
    }
  }
}

const PREFIJO = 'Bearer ';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<Request>();
    const cabecera = peticion.headers.authorization;
    if (cabecera === undefined || !cabecera.startsWith(PREFIJO)) {
      throw new UnauthorizedException('Falta la sesión');
    }
    const usuarioId = await authLogica.verificarAcceso(cabecera.slice(PREFIJO.length));
    if (!usuarioId.ok) {
      throw new UnauthorizedException(usuarioId.error.mensaje);
    }
    peticion.usuarioId = usuarioId.value;
    return true;
  }
}

export const UsuarioId = createParamDecorator((_dato: unknown, contexto: ExecutionContext): string => {
  const usuarioId = contexto.switchToHttp().getRequest<Request>().usuarioId;
  if (usuarioId === undefined) {
    throw new UnauthorizedException('Falta la sesión');
  }
  return usuarioId;
});
