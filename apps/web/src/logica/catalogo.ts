import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CLAVES, consulta } from '@/logica/consulta';
import { apiServicio } from '@/servicios/api.servicio';

const LONGITUD_MINIMA = 2;
const ESPERA_BUSQUEDA_MS = 300;
const INTERVALO_ESTADO_MS = 5000;

const useRetrasado = (valor: string, ms: number): string => {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(temporizador);
  }, [valor, ms]);
  return retrasado;
};

export const catalogo = {
  useBusqueda: (texto: string) => {
    const consultaRetrasada = useRetrasado(texto.trim(), ESPERA_BUSQUEDA_MS);
    return useQuery({
      queryKey: CLAVES.busqueda(consultaRetrasada),
      queryFn: () => consulta.desenvolver(apiServicio.catalogo.buscar(consultaRetrasada)),
      enabled: consultaRetrasada.length >= LONGITUD_MINIMA,
      staleTime: 60_000,
    });
  },

  useCategorias: (catalogoListo: boolean) =>
    useQuery({
      queryKey: CLAVES.categorias,
      queryFn: () => consulta.desenvolver(apiServicio.catalogo.categorias()),
      enabled: catalogoListo,
      staleTime: 10 * 60_000,
    }),

  useEstado: () =>
    useQuery({
      queryKey: CLAVES.catalogoEstado,
      queryFn: () => consulta.desenvolver(apiServicio.catalogo.estado()),
      refetchInterval: (query) => (query.state.data?.sincronizadoEn === null ? INTERVALO_ESTADO_MS : false),
    }),

  LONGITUD_MINIMA,
};
