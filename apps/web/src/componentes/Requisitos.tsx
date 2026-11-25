import { IconoCheck, IconoCruz } from '@/componentes/Iconos';

type Props = { requisitos: { texto: string; cumple: boolean }[]; etiqueta: string };

export const Requisitos = ({ requisitos, etiqueta }: Props) => (
  <ul aria-label={etiqueta} aria-live="polite" className="flex flex-col gap-1 text-sm">
    {requisitos.map((requisito) => (
      <li key={requisito.texto} className={`flex items-center gap-2 ${requisito.cumple ? 'text-emerald-700' : 'text-slate-500'}`}>
        {requisito.cumple ? <IconoCheck className="size-4" /> : <IconoCruz className="size-4" />}
        <span>{requisito.texto}</span>
        <span className="sr-only">{requisito.cumple ? '(cumplido)' : '(pendiente)'}</span>
      </li>
    ))}
  </ul>
);
