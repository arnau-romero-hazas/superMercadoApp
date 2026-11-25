import { type InputHTMLAttributes, type ReactNode, useState } from 'react';
import { IconoOjo, IconoOjoTachado } from '@/componentes/Iconos';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { etiqueta: string; id: string; children?: ReactNode };

export const CampoPassword = ({ etiqueta, id, children, ...resto }: Props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          {...resto}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-0 pr-12 pl-3 text-base outline-none focus:border-marca-700 focus:ring-2 focus:ring-marca-700/20"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-800"
        >
          {visible ? <IconoOjoTachado className="size-5" /> : <IconoOjo className="size-5" />}
        </button>
      </div>
      {children}
    </div>
  );
};
