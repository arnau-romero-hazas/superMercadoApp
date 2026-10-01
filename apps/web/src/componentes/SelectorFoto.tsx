import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { MensajeError, Spinner } from '@/componentes/ui';
import type { CambioFoto } from '@/logica/despensa';
import { fotos } from '@/logica/fotos';

type Props = { urlActual: string | null; onCambiar: (cambio: CambioFoto) => void };

const estiloBoton =
  'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl bg-white px-3 text-sm font-medium ring-1 ring-slate-300 ring-inset hover:bg-slate-100';

export const SelectorFoto = ({ urlActual, onCambiar }: Props) => {
  const [vista, setVista] = useState<string | null>(urlActual);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlLocal = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlLocal.current !== null) {
        URL.revokeObjectURL(urlLocal.current);
      }
    },
    [],
  );

  const alElegir = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.item(0) ?? null;
    evento.target.value = '';
    if (archivo === null) {
      return;
    }
    setProcesando(true);
    setError(null);
    const comprimida = await fotos.comprimir(archivo);
    setProcesando(false);
    if (!comprimida.ok) {
      setError(comprimida.error);
      return;
    }
    if (urlLocal.current !== null) {
      URL.revokeObjectURL(urlLocal.current);
    }
    urlLocal.current = URL.createObjectURL(comprimida.value);
    setVista(urlLocal.current);
    onCambiar({ tipo: 'nueva', foto: comprimida.value });
  };

  const quitar = () => {
    setVista(null);
    onCambiar({ tipo: 'quitar' });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">Foto</span>
      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
          {procesando ? <Spinner /> : null}
          {!procesando && vista !== null ? <img src={vista} alt="Foto del producto" className="size-full object-cover" /> : null}
          {!procesando && vista === null ? <span className="text-xs">Sin foto</span> : null}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <label className={estiloBoton}>
              Hacer foto
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void alElegir(e)} />
            </label>
            <label className={estiloBoton}>
              Galería
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => void alElegir(e)} />
            </label>
          </div>
          {vista === null ? null : (
            <button type="button" onClick={quitar} className="text-left text-xs font-medium text-rose-700">
              Quitar foto
            </button>
          )}
        </div>
      </div>
      <MensajeError mensaje={error} />
    </div>
  );
};
