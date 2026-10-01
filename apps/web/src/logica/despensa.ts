import type { ActualizarProductoPeticion, CrearProductoPeticion, ProductoHogarVista } from '@super/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CLAVES, consulta } from '@/logica/consulta';
import { apiServicio } from '@/servicios/api.servicio';

const INTERVALO_SONDEO_MS = 5000;

type CambioProducto = { id: string; cambios: ActualizarProductoPeticion };

export type DatosProductoPropio = Omit<Extract<CrearProductoPeticion, { origen: 'propio' }>, 'origen' | 'fotoId'>;

export type CambioFoto = { tipo: 'mantener' } | { tipo: 'quitar' } | { tipo: 'nueva'; foto: Blob };

const subirFoto = async (foto: Blob): Promise<string> => (await consulta.desenvolver(apiServicio.fotos.subir(foto))).id;

const fotoIdSegun = async (cambio: CambioFoto): Promise<string | null | undefined> => {
  switch (cambio.tipo) {
    case 'mantener':
      return undefined;
    case 'quitar':
      return null;
    case 'nueva':
      return subirFoto(cambio.foto);
  }
};

const aplicarCambios = (producto: ProductoHogarVista, cambios: ActualizarProductoPeticion): ProductoHogarVista => {
  const estado = cambios.estado ?? producto.estado;
  return {
    ...producto,
    estado,
    enCarro: estado === 'hay' ? false : (cambios.enCarro ?? producto.enCarro),
    nombre: cambios.nombre ?? producto.nombre,
    nota: cambios.nota === undefined ? producto.nota : cambios.nota,
  };
};

export const despensa = {
  useProductos: () =>
    useQuery({
      queryKey: CLAVES.despensa,
      queryFn: () => consulta.desenvolver(apiServicio.despensa.listar()),
      refetchInterval: INTERVALO_SONDEO_MS,
    }),

  useCrear: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (peticion: CrearProductoPeticion) => consulta.desenvolver(apiServicio.despensa.crear(peticion)),
      onSuccess: (creado) => {
        cliente.setQueryData<ProductoHogarVista[]>(CLAVES.despensa, (actuales) =>
          actuales === undefined ? [creado] : [...actuales, creado],
        );
        void cliente.invalidateQueries({ queryKey: CLAVES.despensa });
      },
    });
  },

  useCrearPropio: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: async ({ datos, foto }: { datos: DatosProductoPropio; foto: Blob | null }) => {
        const fotoId = foto === null ? null : await subirFoto(foto);
        return consulta.desenvolver(apiServicio.despensa.crear({ ...datos, origen: 'propio', fotoId }));
      },
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.despensa }),
    });
  },

  useEditarDetalle: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, cambios, foto }: CambioProducto & { foto: CambioFoto }) => {
        const fotoId = await fotoIdSegun(foto);
        return consulta.desenvolver(
          apiServicio.despensa.actualizar(id, fotoId === undefined ? cambios : { ...cambios, fotoId }),
        );
      },
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.despensa }),
    });
  },

  useActualizar: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: ({ id, cambios }: CambioProducto) => consulta.desenvolver(apiServicio.despensa.actualizar(id, cambios)),
      onMutate: async ({ id, cambios }: CambioProducto) => {
        await cliente.cancelQueries({ queryKey: CLAVES.despensa });
        const anteriores = cliente.getQueryData<ProductoHogarVista[]>(CLAVES.despensa);
        if (anteriores !== undefined) {
          cliente.setQueryData<ProductoHogarVista[]>(
            CLAVES.despensa,
            anteriores.map((producto) => (producto.id === id ? aplicarCambios(producto, cambios) : producto)),
          );
        }
        return { anteriores };
      },
      onError: (_error, _cambio, contexto) => {
        if (contexto !== undefined && contexto.anteriores !== undefined) {
          cliente.setQueryData(CLAVES.despensa, contexto.anteriores);
        }
      },
      onSettled: () => cliente.invalidateQueries({ queryKey: CLAVES.despensa }),
    });
  },

  useEliminar: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => consulta.desenvolver(apiServicio.despensa.eliminar(id)),
      onSuccess: (_resultado, id) => {
        cliente.setQueryData<ProductoHogarVista[]>(CLAVES.despensa, (actuales) =>
          actuales === undefined ? actuales : actuales.filter((producto) => producto.id !== id),
        );
        void cliente.invalidateQueries({ queryKey: CLAVES.despensa });
      },
    });
  },

  useFinalizarCompra: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: () => consulta.desenvolver(apiServicio.compras.finalizar()),
      onSuccess: () => {
        void cliente.invalidateQueries({ queryKey: CLAVES.despensa });
        void cliente.invalidateQueries({ queryKey: CLAVES.compras });
      },
    });
  },
};
