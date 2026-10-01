import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { Marco } from '@/componentes/Marco';
import { Boton, MensajeError, PantallaCarga } from '@/componentes/ui';
import { sesion } from '@/logica/sesion';
import { Acceso } from '@/paginas/Acceso';
import { Ajustes } from '@/paginas/Ajustes';
import { Anadir } from '@/paginas/Anadir';
import { Compras } from '@/paginas/Compras';
import { ConfigurarHogar } from '@/paginas/ConfigurarHogar';
import { Despensa } from '@/paginas/Despensa';
import { Lista } from '@/paginas/Lista';

const Contenido = () => {
  const estado = sesion.useEstado();

  switch (estado.tipo) {
    case 'anonimo':
      return <Acceso />;
    case 'cargando':
      return <PantallaCarga />;
    case 'error':
      return (
        <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 px-4">
          <MensajeError mensaje={estado.mensaje} />
          <Boton onClick={estado.reintentar}>Reintentar</Boton>
        </div>
      );
    case 'listo':
      if (estado.yo.hogar === null) {
        return <ConfigurarHogar nombreUsuario={estado.yo.usuario.nombre} />;
      }
      return (
        <Routes>
          <Route element={<Marco hogarNombre={estado.yo.hogar.nombre} />}>
            <Route index element={<Despensa />} />
            <Route path="lista" element={<Lista />} />
            <Route path="anadir" element={<Anadir />} />
            <Route path="compras" element={<Compras />} />
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      );
  }
};

export const App = () => (
  <BrowserRouter>
    <Contenido />
  </BrowserRouter>
);
