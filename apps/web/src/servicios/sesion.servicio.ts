import { z } from 'zod';

const CLAVE = 'despensa.sesion';

const tokensSchema = z.object({ accessToken: z.string().min(1), refreshToken: z.string().min(1) });
export type Tokens = z.infer<typeof tokensSchema>;

const oyentes = new Set<() => void>();

const leerAlmacen = (): Tokens | null => {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (crudo === null) {
      return null;
    }
    const validado = tokensSchema.safeParse(JSON.parse(crudo));
    return validado.success ? validado.data : null;
  } catch {
    return null;
  }
};

let actual: Tokens | null = leerAlmacen();

const actualizar = (tokens: Tokens | null): void => {
  actual = tokens;
  try {
    if (tokens === null) {
      localStorage.removeItem(CLAVE);
    } else {
      localStorage.setItem(CLAVE, JSON.stringify(tokens));
    }
  } catch {
    // Sin almacenamiento la sesión dura lo que la pestaña.
  }
  oyentes.forEach((oyente) => oyente());
};

export const sesionServicio = {
  leer: (): Tokens | null => actual,
  guardar: (tokens: Tokens): void => actualizar(tokens),
  borrar: (): void => actualizar(null),
  suscribir: (oyente: () => void): (() => void) => {
    oyentes.add(oyente);
    return () => {
      oyentes.delete(oyente);
    };
  },
};
