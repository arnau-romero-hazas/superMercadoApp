import { CATEGORIA_OTROS, type EstadoProducto } from '@super/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { IconoMas } from '@/componentes/Iconos';
import { ImagenProducto } from '@/componentes/ImagenProducto';
import { NuevoProducto } from '@/componentes/NuevoProducto';
import { Boton, MensajeError, Spinner } from '@/componentes/ui';
import { catalogo } from '@/logica/catalogo';
import { consulta } from '@/logica/consulta';
import { despensa } from '@/logica/despensa';
import { productos } from '@/logica/productos';
import { sesion } from '@/logica/sesion';

const MODOS: { estado: EstadoProducto; etiqueta: string }[] = [
  { estado: 'falta', etiqueta: 'A la lista' },
  { estado: 'hay', etiqueta: 'Ya lo tenemos' },
];

export const Anadir = () => {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState<EstadoProducto>('falta');
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const actual = sesion.useHogarActual();
  const estadoCatalogo = catalogo.useEstado();
  const catalogoListo = estadoCatalogo.data !== undefined && estadoCatalogo.data.sincronizadoEn !== null;
  const busqueda = catalogo.useBusqueda(texto);
  const categorias = catalogo.useCategorias(catalogoListo);
  const lista = despensa.useProductos();
  const crear = despensa.useCrear();

  const enDespensa = new Set(
    (lista.data ?? []).map((producto) => (producto.catalogo === null ? null : producto.catalogo.id)).filter((id) => id !== null),
  );
  const opcionesCategoria = categorias.data ?? [CATEGORIA_OTROS];
  const textoLimpio = texto.trim();


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Añadir</h1>
        <Link to="/" className="text-sm font-medium text-marca-700">
          Hecho
        </Link>
      </div>

      <div role="radiogroup" aria-label="Cómo añadir" className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1 text-sm font-medium">
        {MODOS.map((modo) => (
          <button
            key={modo.estado}
            type="button"
            role="radio"
            aria-checked={estado === modo.estado}
            onClick={() => setEstado(modo.estado)}
            className={`min-h-10 rounded-lg ${estado === modo.estado ? 'bg-white shadow-sm' : 'text-slate-600'}`}
          >
            {modo.etiqueta}
          </button>
        ))}
      </div>

      <input
        type="search"
        autoFocus
        placeholder="Buscar producto: leche, tomate…"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAviso(null);
        }}
        className="min-h-12 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-marca-700"
      />

      {catalogoListo || estadoCatalogo.isPending ? null : (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <Spinner /> Preparando el catálogo del súper. Puede tardar un par de minutos.
        </p>
      )}
      {aviso === null ? null : <p className="rounded-xl bg-marca-50 px-3 py-2 text-sm text-marca-800">{aviso}</p>}
      <MensajeError mensaje={consulta.mensaje(crear.error) ?? consulta.mensaje(busqueda.error)} />

      <button
        type="button"
        onClick={() => setCreando(true)}
        className="flex min-h-12 items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 text-left text-sm hover:border-marca-700"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-marca-50 text-marca-700">
          <IconoMas className="size-5" />
        </span>
        <span>
          {textoLimpio.length > 0 ? (
            <>
              ¿No está? Registrar <span className="font-semibold">«{textoLimpio}»</span> con foto y precio
            </>
          ) : (
            '¿Producto nuevo en la tienda? Regístralo con foto y precio'
          )}
        </span>
      </button>

      {busqueda.isFetching ? (
        <div className="flex justify-center py-4 text-slate-400">
          <Spinner />
        </div>
      ) : null}

      {busqueda.data === undefined || busqueda.data.length === 0 ? null : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {busqueda.data.map((resultado) => {
            const yaEsta = enDespensa.has(resultado.id);
            return (
              <li key={resultado.id} className="flex items-center gap-3 px-3 py-2.5">
                <ImagenProducto url={resultado.imagenUrl} nombre={resultado.nombre} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-tight font-medium">{resultado.nombre}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {[resultado.formato, productos.formatearPrecio(resultado.precio)].filter((parte) => parte !== null).join(' · ')}
                  </span>
                </span>
                {yaEsta ? (
                  <span className="shrink-0 text-xs font-medium text-marca-700">Ya añadido ✓</span>
                ) : (
                  <Boton
                    variante="secundario"
                    className="shrink-0 px-3 text-sm"
                    disabled={crear.isPending}
                    onClick={() => crear.mutate({ origen: 'catalogo', catalogoProductoId: resultado.id, estado })}
                  >
                    Añadir
                  </Boton>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {busqueda.data !== undefined && busqueda.data.length === 0 && !busqueda.isFetching ? (
        <p className="text-center text-sm text-slate-500">No hay resultados en el catálogo.</p>
      ) : null}
      {creando && actual !== null ? (
        <NuevoProducto
          nombreInicial={textoLimpio}
          estado={estado}
          supermercado={actual.hogar.supermercado}
          categorias={opcionesCategoria}
          onCerrar={() => setCreando(false)}
          onCreado={() => {
            setCreando(false);
            setTexto('');
            setAviso('Producto registrado');
          }}
        />
      ) : null}
    </div>
  );
};
