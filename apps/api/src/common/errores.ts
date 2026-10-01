export type TipoError =
  | 'ExistenceError'
  | 'StateError'
  | 'ValidationError'
  | 'AuthorizationError'
  | 'OperationError';

export type AppError = { tipo: TipoError; mensaje: string };

export const errores = {
  existencia: (mensaje: string): AppError => ({ tipo: 'ExistenceError', mensaje }),
  estado: (mensaje: string): AppError => ({ tipo: 'StateError', mensaje }),
  validacion: (mensaje: string): AppError => ({ tipo: 'ValidationError', mensaje }),
  autorizacion: (mensaje: string): AppError => ({ tipo: 'AuthorizationError', mensaje }),
  operacion: (mensaje: string): AppError => ({ tipo: 'OperationError', mensaje }),
};
