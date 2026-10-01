import type { ActualizarHogarPeticion, CrearHogarPeticion } from '@super/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CLAVES, consulta } from '@/logica/consulta';
import { apiServicio } from '@/servicios/api.servicio';

export const hogar = {
  useCrear: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (peticion: CrearHogarPeticion) => consulta.desenvolver(apiServicio.hogar.crear(peticion)),
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.yo }),
    });
  },

  useUnirse: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (codigoInvitacion: string) => consulta.desenvolver(apiServicio.hogar.unirse(codigoInvitacion)),
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.yo }),
    });
  },

  useActualizar: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (peticion: ActualizarHogarPeticion) => consulta.desenvolver(apiServicio.hogar.actualizar(peticion)),
      onSuccess: () => {
        void cliente.invalidateQueries({ queryKey: CLAVES.yo });
        void cliente.invalidateQueries({ queryKey: CLAVES.despensa });
        void cliente.invalidateQueries({ queryKey: ['catalogo'] });
      },
    });
  },
};
