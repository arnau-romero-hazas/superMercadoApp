import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppError } from '@/common/errores.js';
import type { Result } from '@/common/result.js';

const aHttp = (error: AppError): HttpException => {
  switch (error.tipo) {
    case 'ExistenceError':
      return new NotFoundException(error.mensaje);
    case 'StateError':
      return new ConflictException(error.mensaje);
    case 'ValidationError':
      return new BadRequestException(error.mensaje);
    case 'AuthorizationError':
      return new UnauthorizedException(error.mensaje);
    case 'OperationError':
      return new InternalServerErrorException(error.mensaje);
  }
};

export const http = {
  desenvolver: <T>(resultado: Result<T>): T => {
    if (!resultado.ok) {
      throw aHttp(resultado.error);
    }
    return resultado.value;
  },
};
