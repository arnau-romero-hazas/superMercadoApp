import { type ReactNode, useEffect } from 'react';

type Props = { titulo: string; onCerrar: () => void; children: ReactNode };

export const Hoja = ({ titulo, onCerrar, children }: Props) => {
  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    };
    window.addEventListener('keydown', alPulsar);
    return () => window.removeEventListener('keydown', alPulsar);
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(evento) => evento.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
        <h2 className="mb-4 text-lg font-semibold">{titulo}</h2>
        {children}
      </div>
    </div>
  );
};
