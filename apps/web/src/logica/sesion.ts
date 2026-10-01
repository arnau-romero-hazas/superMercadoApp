import type { HogarVista, LoginPeticion, RegistroPeticion, UsuarioVista, YoVista } from '@super/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { CLAVES, consulta } from '@/logica/consulta';
import { apiServicio } from '@/servicios/api.servicio';
import { sesionServicio } from '@/servicios/sesion.servicio';

export type EstadoSesion =
  | { tipo: 'anonimo' }
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string; reintentar: () => void }
  | { tipo: 'listo'; yo: YoVista };

export const sesion = {
  useEstado: (): EstadoSesion => {
    const tokens = useSyncExternalStore(sesionServicio.suscribir, sesionServicio.leer);
    const yo = useQuery({
      queryKey: CLAVES.yo,
      queryFn: () => consulta.desenvolver(apiServicio.auth.yo()),
      enabled: tokens !== null,
      retry: 1,
    });
    if (tokens === null) {
      return { tipo: 'anonimo' };
    }
    if (yo.isPending) {
      return { tipo: 'cargando' };
    }
    if (yo.isError) {
      return { tipo: 'error', mensaje: yo.error.message, reintentar: () => void yo.refetch() };
    }
    return { tipo: 'listo', yo: yo.data };
  },

  useHogarActual: (): { usuario: UsuarioVista; hogar: HogarVista } | null => {
    const yo = useQuery({
      queryKey: CLAVES.yo,
      queryFn: () => consulta.desenvolver(apiServicio.auth.yo()),
    });
    if (yo.data === undefined || yo.data.hogar === null) {
      return null;
    }
    return { usuario: yo.data.usuario, hogar: yo.data.hogar };
  },

  useLogin: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (peticion: LoginPeticion) => consulta.desenvolver(apiServicio.auth.login(peticion)),
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.yo }),
    });
  },

  useRegistro: () => {
    const cliente = useQueryClient();
    return useMutation({
      mutationFn: (peticion: RegistroPeticion) => consulta.desenvolver(apiServicio.auth.registrar(peticion)),
      onSuccess: () => cliente.invalidateQueries({ queryKey: CLAVES.yo }),
    });
  },

  useSalir: () => {
    const cliente = useQueryClient();
    return () => {
      sesionServicio.borrar();
      cliente.clear();
    };
  },
};
