import type { EstadoProducto } from '@super/shared';

const OPCIONES: { estado: EstadoProducto; etiqueta: string; activo: string }[] = [
  { estado: 'hay', etiqueta: 'Hay', activo: 'bg-emerald-600 text-white' },
  { estado: 'queda_poco', etiqueta: 'Poco', activo: 'bg-amber-500 text-white' },
  { estado: 'falta', etiqueta: 'Falta', activo: 'bg-rose-600 text-white' },
];

type Props = { estado: EstadoProducto; onCambiar: (estado: EstadoProducto) => void; nombre: string };

export const SelectorEstado = ({ estado, onCambiar, nombre }: Props) => (
  <div role="radiogroup" aria-label={`Estado de ${nombre}`} className="flex shrink-0 rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
    {OPCIONES.map((opcion) => {
      const seleccionado = opcion.estado === estado;
      return (
        <button
          key={opcion.estado}
          type="button"
          role="radio"
          aria-checked={seleccionado}
          onClick={() => onCambiar(opcion.estado)}
          className={`min-h-9 rounded-md px-2.5 transition-colors ${seleccionado ? opcion.activo : 'text-slate-500'}`}
        >
          {opcion.etiqueta}
        </button>
      );
    })}
  </div>
);
