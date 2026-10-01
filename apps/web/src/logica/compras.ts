import { useQuery } from '@tanstack/react-query';
import { CLAVES, consulta } from '@/logica/consulta';
import { apiServicio } from '@/servicios/api.servicio';

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export const compras = {
  useHistorial: () =>
    useQuery({
      queryKey: CLAVES.compras,
      queryFn: () => consulta.desenvolver(apiServicio.compras.listar()),
    }),

  formatearFecha: (iso: string): string => formatoFecha.format(new Date(iso)),
};
