import { actualizarHogarSchema } from '@super/shared';
import { type FormEvent, useState } from 'react';
import { Boton, Campo, MensajeError, Tarjeta } from '@/componentes/ui';
import { catalogo } from '@/logica/catalogo';
import { consulta } from '@/logica/consulta';
import { hogar as hogarLogica } from '@/logica/hogar';
import { sesion } from '@/logica/sesion';

export const Ajustes = () => {
  const actual = sesion.useHogarActual();
  const salir = sesion.useSalir();
  const actualizar = hogarLogica.useActualizar();
  const estadoCatalogo = catalogo.useEstado();
  const [nombre, setNombre] = useState(actual === null ? '' : actual.hogar.nombre);
  const [codigoPostal, setCodigoPostal] = useState(actual === null ? '' : actual.hogar.codigoPostal);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (actual === null) {
    return null;
  }
  const { usuario, hogar } = actual;

  const guardar = (evento: FormEvent) => {
    evento.preventDefault();
    const peticion = actualizarHogarSchema.safeParse({ nombre, codigoPostal });
    if (!peticion.success) {
      setErrorLocal(peticion.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    setErrorLocal(null);
    actualizar.mutate(peticion.data, { onSuccess: () => setAviso('Hogar actualizado') });
  };

  const compartir = async () => {
    const mensaje = `Únete a nuestra despensa "${hogar.nombre}" con el código ${hogar.codigoInvitacion}: ${window.location.origin}`;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'TraeLeche', text: mensaje });
        return;
      }
      await navigator.clipboard.writeText(hogar.codigoInvitacion);
      setAviso('Código copiado');
    } catch {
      setAviso(null);
    }
  };

  const catalogoTexto =
    estadoCatalogo.data === undefined
      ? null
      : estadoCatalogo.data.sincronizadoEn === null
        ? 'Preparando catálogo…'
        : `${estadoCatalogo.data.productos.toLocaleString('es-ES')} productos · actualizado ${new Date(
            estadoCatalogo.data.sincronizadoEn,
          ).toLocaleDateString('es-ES')}`;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      {aviso === null ? null : <p className="rounded-xl bg-marca-50 px-3 py-2 text-sm text-marca-800">{aviso}</p>}

      <Tarjeta>
        <h2 className="mb-1 font-semibold">Invitar a tu pareja</h2>
        <p className="mb-3 text-sm text-slate-500">Que se registre y entre con este código.</p>
        <div className="flex items-center gap-3">
          <span className="flex-1 rounded-xl bg-slate-100 py-2 text-center font-mono text-2xl font-bold tracking-[0.3em]">
            {hogar.codigoInvitacion}
          </span>
          <Boton variante="secundario" onClick={() => void compartir()}>
            Compartir
          </Boton>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {hogar.miembros.map((miembro) => (
            <li key={miembro.id} className="rounded-full bg-marca-50 px-3 py-1 text-sm text-marca-800">
              {miembro.nombre}
              {miembro.id === usuario.id ? ' (tú)' : ''}
            </li>
          ))}
        </ul>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Hogar</h2>
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <Campo etiqueta="Nombre" id="ajustes-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo
            etiqueta="Código postal"
            id="ajustes-cp"
            inputMode="numeric"
            maxLength={5}
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
          />
          <p className="-mt-2 text-xs text-slate-500">
            Supermercado: Mercadona{catalogoTexto === null ? null : ` · ${catalogoTexto}`}
          </p>
          <MensajeError mensaje={errorLocal ?? consulta.mensaje(actualizar.error)} />
          <Boton type="submit" variante="secundario" cargando={actualizar.isPending}>
            Guardar cambios
          </Boton>
        </form>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-1 font-semibold">Cuenta</h2>
        <p className="text-sm text-slate-600">{usuario.nombre}</p>
        <p className="mb-4 text-sm text-slate-500">{usuario.email}</p>
        <Boton variante="peligro" onClick={salir} className="w-full">
          Cerrar sesión
        </Boton>
      </Tarjeta>
    </div>
  );
};
