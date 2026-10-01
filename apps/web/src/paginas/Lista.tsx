import type { ProductoHogarVista } from '@super/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { IconoCheck } from '@/componentes/Iconos';
import { ImagenProducto } from '@/componentes/ImagenProducto';
import { Boton, MensajeError, PantallaCarga, Vacio } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { despensa } from '@/logica/despensa';
import { productos } from '@/logica/productos';

const DURACION_AVISO_MS = 4000;

const FilaLista = ({ producto, onAlternar }: { producto: ProductoHogarVista; onAlternar: () => void }) => {
  const precio = productos.precio(producto);
  return (
  <li>
    <button type="button" onClick={onAlternar} aria-pressed={producto.enCarro} className="flex w-full items-center gap-3 px-3 py-2.5 text-left">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${
          producto.enCarro ? 'border-green-700 bg-green-700 text-white' : 'border-slate-300 text-transparent'
        }`}
      >
        <IconoCheck className="size-4" />
      </span>
      <ImagenProducto url={productos.imagen(producto)} nombre={producto.nombre} />
      <span className={`min-w-0 flex-1 ${producto.enCarro ? 'text-slate-400 line-through' : ''}`}>
        <span className="line-clamp-2 text-sm leading-snug font-medium">{producto.nombre}</span>
        {productos.subtitulo(producto) === null ? null : (
          <span className="block truncate text-xs text-slate-500">{productos.subtitulo(producto)}</span>
        )}
      </span>
      {precio === null ? null : (
        <span className="shrink-0 text-sm text-slate-600 tabular-nums">{productos.formatearPrecio(precio)}</span>
      )}
    </button>
  </li>
  );
};

const Seccion = ({
  titulo,
  lista,
  onAlternar,
}: {
  titulo: string;
  lista: ProductoHogarVista[];
  onAlternar: (producto: ProductoHogarVista) => void;
}) =>
  lista.length === 0 ? null : (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {productos.agruparPorCategoria(lista).map((grupo) => (
        <div key={grupo.categoria.nombre}>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{grupo.categoria.nombre}</h3>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {grupo.productos.map((producto) => (
              <FilaLista key={producto.id} producto={producto} onAlternar={() => onAlternar(producto)} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );

export const Lista = () => {
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const datos = despensa.useProductos();
  const actualizar = despensa.useActualizar();
  const finalizar = despensa.useFinalizarCompra();

  useEffect(() => {
    if (aviso === null) {
      return;
    }
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  if (datos.isPending) {
    return <PantallaCarga />;
  }
  if (datos.isError) {
    return <MensajeError mensaje={datos.error.message} />;
  }

  const lista = productos.enLista(datos.data);
  const enCarro = lista.filter((producto) => producto.enCarro);

  const alternar = (producto: ProductoHogarVista) =>
    actualizar.mutate({ id: producto.id, cambios: { enCarro: !producto.enCarro } });

  const terminar = () => {
    if (!confirmando) {
      setConfirmando(true);
      return;
    }
    finalizar.mutate(undefined, {
      onSuccess: (compra) => {
        setConfirmando(false);
        setAviso(`Compra guardada · ${productos.formatearPrecio(compra.totalEstimado)} aprox.`);
      },
      onError: () => setConfirmando(false),
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lista</h1>
          <Link to="/compras" className="text-sm font-medium text-green-700">
            Compras anteriores
          </Link>
        </div>
        {lista.length > 0 ? (
          <p className="text-right text-sm text-slate-500">
            {enCarro.length}/{lista.length} en el carro
            <br />
            <span className="font-medium text-slate-700">≈ {productos.formatearPrecio(productos.totalEstimado(lista))}</span>
          </p>
        ) : null}
      </div>

      {aviso === null ? null : <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">{aviso}</p>}
      <MensajeError mensaje={consulta.mensaje(actualizar.error) ?? consulta.mensaje(finalizar.error)} />

      {lista.length === 0 ? <Vacio titulo="No falta nada 🎉">Cuando algo se acabe, márcalo en la despensa.</Vacio> : null}

      <Seccion titulo="Falta" lista={productos.conEstado(lista, 'falta')} onAlternar={alternar} />
      <Seccion titulo="Si os acordáis" lista={productos.conEstado(lista, 'queda_poco')} onAlternar={alternar} />

      {enCarro.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 px-4 pb-3">
          <div className="mx-auto flex max-w-lg gap-2 pr-[4.5rem]">
            {confirmando ? (
              <Boton variante="secundario" onClick={() => setConfirmando(false)} className="shadow-lg">
                Cancelar
              </Boton>
            ) : null}
            <Boton onClick={terminar} cargando={finalizar.isPending} className="flex-1 shadow-lg">
              {confirmando ? `Confirmar: ${enCarro.length} a la despensa` : `Terminar compra (${enCarro.length})`}
            </Boton>
          </div>
        </div>
      ) : null}
    </div>
  );
};
