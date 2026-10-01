import type { Result } from '@/common/result';
import type { ErrorApi } from '@/servicios/api.servicio';

export class ErrorConsulta extends Error {
  constructor(readonly detalle: ErrorApi) {
    super(detalle.mensaje);
  }
}

export const consulta = {
  desenvolver: async <T>(peticion: Promise<Result<T, ErrorApi>>): Promise<T> => {
    const resultado = await peticion;
    if (!resultado.ok) {
      throw new ErrorConsulta(resultado.error);
    }
    return resultado.value;
  },
  mensaje: (error: Error | null): string | null => (error === null ? null : error.message),
};

export const CLAVES = {
  yo: ['yo'],
  despensa: ['despensa'],
  compras: ['compras'],
  catalogoEstado: ['catalogo', 'estado'],
  categorias: ['catalogo', 'categorias'],
  busqueda: (texto: string) => ['catalogo', 'buscar', texto],
} as const;
