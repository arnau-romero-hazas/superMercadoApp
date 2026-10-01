import {
  type ActualizarHogarPeticion,
  type ActualizarProductoPeticion,
  type Categoria,
  categoriaSchema,
  type CompraVista,
  compraVistaSchema,
  type CrearHogarPeticion,
  type CrearProductoPeticion,
  type EstadoCatalogoVista,
  estadoCatalogoVistaSchema,
  type FotoSubidaVista,
  fotoSubidaVistaSchema,
  type HogarVista,
  hogarVistaSchema,
  type LoginPeticion,
  type ProductoCatalogoVista,
  productoCatalogoVistaSchema,
  type ProductoHogarVista,
  productoHogarVistaSchema,
  type RegistroPeticion,
  type SesionAuthVista,
  sesionAuthVistaSchema,
  type YoVista,
  yoVistaSchema,
} from '@super/shared';
import { z } from 'zod';
import { Result } from '@/common/result';
import { sesionServicio } from '@/servicios/sesion.servicio';

export type ErrorApi = { estado: number; mensaje: string };

type Respuesta<T> = Promise<Result<T, ErrorApi>>;

const BASE = '/api';

const errorNestSchema = z.object({ message: z.union([z.string(), z.array(z.string())]) });
const sinContenidoSchema = z.null();

const sinConexion: ErrorApi = { estado: 0, mensaje: 'No hay conexión con el servidor' };

const leerError = async (respuesta: Response): Promise<ErrorApi> => {
  try {
    const cuerpo = errorNestSchema.safeParse(await respuesta.json());
    if (cuerpo.success) {
      const mensaje = Array.isArray(cuerpo.data.message) ? cuerpo.data.message.join('. ') : cuerpo.data.message;
      return { estado: respuesta.status, mensaje };
    }
  } catch {
    // El cuerpo no es JSON: se usa el mensaje genérico.
  }
  return { estado: respuesta.status, mensaje: 'Algo ha ido mal, inténtalo de nuevo' };
};

const serializar = (cuerpo: unknown): BodyInit | undefined => {
  if (cuerpo === undefined) {
    return undefined;
  }
  return cuerpo instanceof Blob ? cuerpo : JSON.stringify(cuerpo);
};

const enviar = async (metodo: string, ruta: string, cuerpo: unknown, token: string | null): Promise<Response | null> => {
  const cabeceras: Record<string, string> = {};
  if (cuerpo instanceof Blob) {
    cabeceras['Content-Type'] = cuerpo.type;
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
  }
  if (token !== null) {
    cabeceras['Authorization'] = `Bearer ${token}`;
  }
  try {
    return await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: serializar(cuerpo),
    });
  } catch {
    return null;
  }
};

const interpretar = async <T>(respuesta: Response, schema: z.ZodType<T>): Respuesta<T> => {
  if (!respuesta.ok) {
    return Result.fail(await leerError(respuesta));
  }
  try {
    const texto = await respuesta.text();
    const validado = schema.safeParse(texto.length === 0 ? null : JSON.parse(texto));
    if (!validado.success) {
      return Result.fail({ estado: respuesta.status, mensaje: 'Respuesta inesperada del servidor' });
    }
    return Result.success(validado.data);
  } catch {
    return Result.fail({ estado: respuesta.status, mensaje: 'Respuesta inesperada del servidor' });
  }
};

let refrescoEnCurso: Promise<boolean> | null = null;

const refrescarSesion = (): Promise<boolean> => {
  if (refrescoEnCurso !== null) {
    return refrescoEnCurso;
  }
  refrescoEnCurso = (async () => {
    const tokens = sesionServicio.leer();
    if (tokens === null) {
      return false;
    }
    const respuesta = await enviar('POST', '/auth/refresh', { refreshToken: tokens.refreshToken }, null);
    if (respuesta === null) {
      return false;
    }
    const sesion = await interpretar(respuesta, sesionAuthVistaSchema);
    if (!sesion.ok) {
      if (sesion.error.estado === 401) {
        sesionServicio.borrar();
      }
      return false;
    }
    sesionServicio.guardar({ accessToken: sesion.value.accessToken, refreshToken: sesion.value.refreshToken });
    return true;
  })().finally(() => {
    refrescoEnCurso = null;
  });
  return refrescoEnCurso;
};

const pedir = async <T>(metodo: string, ruta: string, schema: z.ZodType<T>, cuerpo?: unknown): Respuesta<T> => {
  const primera = await enviar(metodo, ruta, cuerpo, sesionServicio.leer()?.accessToken ?? null);
  if (primera === null) {
    return Result.fail(sinConexion);
  }
  if (primera.status !== 401 || sesionServicio.leer() === null) {
    return interpretar(primera, schema);
  }
  const refrescada = await refrescarSesion();
  if (!refrescada) {
    return interpretar(primera, schema);
  }
  const segunda = await enviar(metodo, ruta, cuerpo, sesionServicio.leer()?.accessToken ?? null);
  return segunda === null ? Result.fail(sinConexion) : interpretar(segunda, schema);
};

const iniciarSesion = async (ruta: string, peticion: RegistroPeticion | LoginPeticion): Respuesta<SesionAuthVista> => {
  const respuesta = await enviar('POST', ruta, peticion, null);
  if (respuesta === null) {
    return Result.fail(sinConexion);
  }
  const sesion = await interpretar(respuesta, sesionAuthVistaSchema);
  if (sesion.ok) {
    sesionServicio.guardar({ accessToken: sesion.value.accessToken, refreshToken: sesion.value.refreshToken });
  }
  return sesion;
};

export const apiServicio = {
  refrescarSesion,

  auth: {
    registrar: (peticion: RegistroPeticion): Respuesta<SesionAuthVista> => iniciarSesion('/auth/registro', peticion),
    login: (peticion: LoginPeticion): Respuesta<SesionAuthVista> => iniciarSesion('/auth/login', peticion),
    yo: (): Respuesta<YoVista> => pedir('GET', '/auth/yo', yoVistaSchema),
  },

  hogar: {
    crear: (peticion: CrearHogarPeticion): Respuesta<HogarVista> => pedir('POST', '/hogares', hogarVistaSchema, peticion),
    unirse: (codigoInvitacion: string): Respuesta<HogarVista> =>
      pedir('POST', '/hogares/unirse', hogarVistaSchema, { codigoInvitacion }),
    actualizar: (peticion: ActualizarHogarPeticion): Respuesta<HogarVista> =>
      pedir('PATCH', '/hogares/actual', hogarVistaSchema, peticion),
  },

  despensa: {
    listar: (): Respuesta<ProductoHogarVista[]> => pedir('GET', '/despensa', z.array(productoHogarVistaSchema)),
    crear: (peticion: CrearProductoPeticion): Respuesta<ProductoHogarVista> =>
      pedir('POST', '/despensa', productoHogarVistaSchema, peticion),
    actualizar: (id: string, peticion: ActualizarProductoPeticion): Respuesta<ProductoHogarVista> =>
      pedir('PATCH', `/despensa/${encodeURIComponent(id)}`, productoHogarVistaSchema, peticion),
    eliminar: (id: string): Respuesta<null> => pedir('DELETE', `/despensa/${encodeURIComponent(id)}`, sinContenidoSchema),
  },

  fotos: {
    subir: (foto: Blob): Respuesta<FotoSubidaVista> => pedir('POST', '/fotos', fotoSubidaVistaSchema, foto),
  },

  compras: {
    listar: (): Respuesta<CompraVista[]> => pedir('GET', '/compras', z.array(compraVistaSchema)),
    finalizar: (): Respuesta<CompraVista> => pedir('POST', '/compras/finalizar', compraVistaSchema),
  },

  catalogo: {
    buscar: (consulta: string): Respuesta<ProductoCatalogoVista[]> =>
      pedir('GET', `/catalogo/buscar?q=${encodeURIComponent(consulta)}`, z.array(productoCatalogoVistaSchema)),
    categorias: (): Respuesta<Categoria[]> => pedir('GET', '/catalogo/categorias', z.array(categoriaSchema)),
    estado: (): Respuesta<EstadoCatalogoVista> => pedir('GET', '/catalogo/estado', estadoCatalogoVistaSchema),
  },
};
