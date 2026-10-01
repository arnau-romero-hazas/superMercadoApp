import type { AppError } from '@/common/errores.js';

export type Result<T, E = AppError> = { ok: true; value: T } | { ok: false; error: E };

export const Result = {
  success: <T>(value: T): Result<T, never> => ({ ok: true, value }),
  fail: <E>(error: E): Result<never, E> => ({ ok: false, error }),
};
