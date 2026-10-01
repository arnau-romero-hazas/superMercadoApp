export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const Result = {
  success: <T>(value: T): Result<T, never> => ({ ok: true, value }),
  fail: <E>(error: E): Result<never, E> => ({ ok: false, error }),
};
