import { Logger } from '@nestjs/common';
import { isValidObjectId, mongo, Types } from 'mongoose';
import { type AppError, errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';

const logger = new Logger('Repositorio');

export const repositorioComun = {
  ejecutar: async <T>(
    mensaje: string,
    operacion: () => Promise<T>,
    traducir: (error: unknown) => AppError | null = () => null,
  ): Promise<Result<T>> => {
    try {
      return Result.success(await operacion());
    } catch (error) {
      const traducido = traducir(error);
      if (traducido !== null) {
        return Result.fail(traducido);
      }
      logger.error(mensaje, error instanceof Error ? error.stack : String(error));
      return Result.fail(errores.operacion(mensaje));
    }
  },
  esClaveDuplicada: (error: unknown): boolean =>
    error instanceof mongo.MongoServerError && error.code === 11000,
  aObjectId: (id: string): Types.ObjectId | null => (isValidObjectId(id) ? new Types.ObjectId(id) : null),
};
