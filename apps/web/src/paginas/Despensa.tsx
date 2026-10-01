import type { ProductoHogarVista } from '@super/shared';
import { useState } from 'react';
import { EditarProducto } from '@/componentes/EditarProducto';
import { Hoja } from '@/componentes/Hoja';
import { IconoCruz } from '@/componentes/Iconos';
import { ImagenProducto } from '@/componentes/ImagenProducto';
import { SelectorEstado } from '@/componentes/SelectorEstado';
import { Boton, MensajeError, PantallaCarga, Vacio } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { despensa } from '@/logica/despensa';
import { productos } from '@/logica/productos';

export const Despensa = () => {
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState<ProductoHogarVista | null>(null);
  const lista = despensa.useProductos();
  const [quitando, setQuitando] = useState<ProductoHogarVista | null>(null);
  const actualizar = despensa.useActualizar();
  const eliminar = despensa.useEliminar();

  const cerrarQuitar = () => {
    setQuitando(null);
    eliminar.reset();
  };

  if (lista.isPending) {
    return <PantallaCarga />;
  }
  if (lista.isError) {
    return <MensajeError mensaje={lista.error.message} />;
  }

  const grupos = productos.agruparPorCategoria(productos.filtrar(lista.data, busqueda));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Despensa</h1>
      {lista.data.length > 0 ? (
        <input
          type="search"
          placeholder="Buscar en casa…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-green-700"
        />
      ) : null}
      <MensajeError mensaje={consulta.mensaje(actualizar.error)} />

      {lista.data.length === 0 ? (
        <Vacio titulo="La despensa está vacía">Pulsa + para añadir lo que tenéis en casa.</Vacio>
      ) : null}
      {lista.data.length > 0 && grupos.length === 0 ? <Vacio titulo="Nada coincide con la búsqueda" /> : null}

      {grupos.map((grupo) => (
        <section key={grupo.categoria.nombre}>
          <h2 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{grupo.categoria.nombre}</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {grupo.productos.map((producto) => (
              <li key={producto.id} className="flex items-center gap-3 px-3 py-2.5">
                <button type="button" onClick={() => setEditando(producto)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ImagenProducto url={productos.imagen(producto)} nombre={producto.nombre} />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm leading-snug font-medium">{producto.nombre}</span>
                    {productos.subtitulo(producto) === null ? null : (
                      <span className="block truncate text-xs text-slate-500">{productos.subtitulo(producto)}</span>
                    )}
                  </span>
                </button>
                <SelectorEstado
                  nombre={producto.nombre}
                  estado={producto.estado}
                  onCambiar={(estado) => actualizar.mutate({ id: producto.id, cambios: { estado } })}
                />
                <button
                  type="button"
                  aria-label={`Quitar ${producto.nombre} de la despensa`}
                  onClick={() => setQuitando(producto)}
                  className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                >
                  <IconoCruz className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {editando === null ? null : <EditarProducto producto={editando} onCerrar={() => setEditando(null)} />}
      {quitando === null ? null : (
        <Hoja titulo="Quitar de la despensa" onCerrar={cerrarQuitar}>
          <p className="mb-4 text-sm text-slate-600">
            ¿Seguro que quieres quitar <span className="font-semibold text-slate-900">{quitando.nombre}</span>? También desaparecerá de la
            lista.
          </p>
          <MensajeError mensaje={consulta.mensaje(eliminar.error)} />
          <div className="mt-4 flex gap-3">
            <Boton variante="secundario" onClick={cerrarQuitar} className="flex-1">
              Cancelar
            </Boton>
            <Boton
              variante="peligro"
              cargando={eliminar.isPending}
              onClick={() => eliminar.mutate(quitando.id, { onSuccess: cerrarQuitar })}
              className="flex-1"
            >
              Quitar
            </Boton>
          </div>
        </Hoja>
      )}
    </div>
  );
};
