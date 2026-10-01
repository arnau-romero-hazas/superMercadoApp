import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';

export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(valor: unknown): T {
    const resultado = this.schema.safeParse(valor);
    if (!resultado.success) {
      throw new BadRequestException(resultado.error.issues[0]?.message ?? 'Datos no válidos');
    }
    return resultado.data;
  }
}
