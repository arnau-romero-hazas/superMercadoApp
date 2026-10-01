import { timingSafeEqual } from 'node:crypto';
import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { entorno } from '@/common/entorno.js';

const esperada = Buffer.from(`Bearer ${entorno.CRON_SECRET}`);

@Injectable()
export class CronGuard implements CanActivate {
  canActivate(contexto: ExecutionContext): boolean {
    const cabecera = contexto.switchToHttp().getRequest<Request>().headers.authorization;
    if (cabecera === undefined) {
      throw new UnauthorizedException('Falta el secreto del cron');
    }
    const recibida = Buffer.from(cabecera);
    if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) {
      throw new UnauthorizedException('Secreto del cron incorrecto');
    }
    return true;
  }
}
