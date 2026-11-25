import { Link } from 'react-router';
import { MensajeError, PantallaCarga, Vacio } from '@/componentes/ui';
import { compras } from '@/logica/compras';
import { NOMBRES_SUPERMERCADO, productos } from '@/logica/productos';

export const Compras = () => {
  const historial = compras.useHistorial();

  if (historial.isPending) {
    return <PantallaCarga />;
  }
  if (historial.isError) {
    return <MensajeError mensaje={historial.error.message} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compras</h1>
        <Link to="/lista" className="text-sm font-medium text-marca-700">
          Volver a la lista
        </Link>
      </div>

      {historial.data.length === 0 ? (
        <Vacio titulo="Aún no hay compras">Al terminar una compra desde la lista, aparecerá aquí.</Vacio>
      ) : null}

      <ul className="flex flex-col gap-3">
        {historial.data.map((compra) => (
          <li key={compra.id}>
            <details className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium first-letter:uppercase">{compras.formatearFecha(compra.finalizadaEn)}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {[
                      NOMBRES_SUPERMERCADO[compra.supermercado],
                      `${compra.lineas.length} ${compra.lineas.length === 1 ? 'producto' : 'productos'}`,
                      compra.finalizadaPor,
                    ]
                      .filter((parte) => parte !== null)
                      .join(' · ')}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">≈ {productos.formatearPrecio(compra.totalEstimado)}</span>
                <span aria-hidden className="shrink-0 text-slate-400 transition-transform group-open:rotate-90">
                  ›
                </span>
              </summary>
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {compra.lineas.map((linea, indice) => (
                  <li key={indice} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                    <span className="min-w-0">{linea.nombre}</span>
                    <span className="shrink-0 text-slate-500">
                      {linea.precioEstimado === null ? 'Sin precio' : productos.formatearPrecio(linea.precioEstimado)}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
};
