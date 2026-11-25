import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { IconoAjustes, IconoCarro, IconoCasa, IconoMas } from '@/componentes/Iconos';
import { despensa } from '@/logica/despensa';
import { productos } from '@/logica/productos';

type Props = { hogarNombre: string };

const Pestana = ({ a, etiqueta, icono, insignia }: { a: string; etiqueta: string; icono: ReactNode; insignia: number }) => (
  <NavLink
    to={a}
    className={({ isActive }) =>
      `relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${isActive ? 'text-marca-700' : 'text-slate-500'}`
    }
  >
    {icono}
    {etiqueta}
    {insignia > 0 ? (
      <span className="absolute top-1 left-1/2 ml-2 min-w-5 rounded-full bg-rose-600 px-1.5 text-center text-[11px] leading-5 text-white">
        {insignia}
      </span>
    ) : null}
  </NavLink>
);

export const Marco = ({ hogarNombre }: Props) => {
  const { data } = despensa.useProductos();
  const { pathname } = useLocation();
  const pendientes = data === undefined ? 0 : productos.enLista(data).filter((producto) => !producto.enCarro).length;
  const mostrarAnadir = pathname === '/' || pathname === '/lista';

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="sticky top-0 z-10 bg-slate-50/90 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 backdrop-blur">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{hogarNombre}</p>
      </header>
      <main className="flex-1 px-4 pb-28">
        <Outlet />
      </main>
      {mostrarAnadir ? (
        <Link
          to="/anadir"
          aria-label="Añadir producto"
          className="fixed right-[max(1rem,calc(50%-16rem+1rem))] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-marca-700 text-white shadow-lg hover:bg-marca-800"
        >
          <IconoMas />
        </Link>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-lg">
          <Pestana a="/" etiqueta="Despensa" icono={<IconoCasa />} insignia={0} />
          <Pestana a="/lista" etiqueta="Lista" icono={<IconoCarro />} insignia={pendientes} />
          <Pestana a="/ajustes" etiqueta="Ajustes" icono={<IconoAjustes />} insignia={0} />
        </div>
      </nav>
    </div>
  );
};
