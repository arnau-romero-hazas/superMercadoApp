import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

const estilosVariante: Record<Variante, string> = {
  primario: 'bg-green-700 text-white hover:bg-green-800 disabled:bg-green-700/50',
  secundario: 'bg-white text-slate-800 ring-1 ring-slate-300 ring-inset hover:bg-slate-100 disabled:opacity-50',
  peligro: 'bg-white text-rose-700 ring-1 ring-rose-300 ring-inset hover:bg-rose-50 disabled:opacity-50',
  fantasma: 'text-slate-600 hover:bg-slate-100 disabled:opacity-50',
};

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean };

export const Boton = ({ variante = 'primario', cargando = false, className = '', disabled, children, ...resto }: BotonProps) => (
  <button
    {...resto}
    disabled={disabled === true || cargando}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-medium transition-colors ${estilosVariante[variante]} ${className}`}
  >
    {cargando ? <Spinner /> : null}
    {children}
  </button>
);

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { etiqueta: string };

export const Campo = ({ etiqueta, id, className = '', ...resto }: CampoProps) => (
  <label className="flex flex-col gap-1.5" htmlFor={id}>
    <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
    <input
      id={id}
      {...resto}
      className={`min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-green-700 focus:ring-2 focus:ring-green-700/20 ${className}`}
    />
  </label>
);

export const MensajeError = ({ mensaje }: { mensaje: string | null }) =>
  mensaje === null ? null : (
    <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
      {mensaje}
    </p>
  );

export const Spinner = () => (
  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
);

export const PantallaCarga = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-slate-500">
    <Spinner />
    <span className="text-sm">{texto}</span>
  </div>
);

export const Vacio = ({ titulo, children }: { titulo: string; children?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
    <p className="text-lg font-semibold text-slate-700">{titulo}</p>
    {children === undefined ? null : <div className="text-sm text-slate-500">{children}</div>}
  </div>
);

export const Tarjeta = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 ${className}`}>{children}</section>
);
