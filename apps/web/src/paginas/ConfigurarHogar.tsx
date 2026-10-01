import { crearHogarSchema, unirseHogarSchema } from '@super/shared';
import { type FormEvent, useState } from 'react';
import { Boton, Campo, MensajeError, Tarjeta } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { hogar } from '@/logica/hogar';
import { sesion } from '@/logica/sesion';

export const ConfigurarHogar = ({ nombreUsuario }: { nombreUsuario: string }) => {
  const [nombre, setNombre] = useState('Casa');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [codigo, setCodigo] = useState('');
  const [errorCrear, setErrorCrear] = useState<string | null>(null);
  const [errorUnirse, setErrorUnirse] = useState<string | null>(null);
  const crear = hogar.useCrear();
  const unirse = hogar.useUnirse();
  const salir = sesion.useSalir();

  const enviarCrear = (evento: FormEvent) => {
    evento.preventDefault();
    const peticion = crearHogarSchema.safeParse({ nombre, codigoPostal });
    if (!peticion.success) {
      setErrorCrear(peticion.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    setErrorCrear(null);
    crear.mutate(peticion.data);
  };

  const enviarUnirse = (evento: FormEvent) => {
    evento.preventDefault();
    const peticion = unirseHogarSchema.safeParse({ codigoInvitacion: codigo });
    if (!peticion.success) {
      setErrorUnirse(peticion.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    setErrorUnirse(null);
    unirse.mutate(peticion.data.codigoInvitacion);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold">Hola, {nombreUsuario}</h1>
        <p className="mt-1 text-slate-500">Crea vuestro hogar o únete al de tu pareja.</p>
      </div>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Crear un hogar</h2>
        <form onSubmit={enviarCrear} className="flex flex-col gap-4">
          <Campo etiqueta="Nombre del hogar" id="nombre-hogar" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Campo
            etiqueta="Código postal"
            id="codigo-postal"
            inputMode="numeric"
            maxLength={5}
            placeholder="46001"
            value={codigoPostal}
            onChange={(e) => setCodigoPostal(e.target.value)}
          />
          <p className="-mt-2 text-xs text-slate-500">Lo usamos para cargar los productos y precios de tu zona.</p>
          <MensajeError mensaje={errorCrear ?? consulta.mensaje(crear.error)} />
          <Boton type="submit" cargando={crear.isPending}>
            Crear hogar
          </Boton>
        </form>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold">Unirme con un código</h2>
        <form onSubmit={enviarUnirse} className="flex flex-col gap-4">
          <Campo
            etiqueta="Código de invitación"
            id="codigo-invitacion"
            autoCapitalize="characters"
            placeholder="ABC123"
            className="font-mono tracking-widest uppercase"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <MensajeError mensaje={errorUnirse ?? consulta.mensaje(unirse.error)} />
          <Boton type="submit" variante="secundario" cargando={unirse.isPending}>
            Unirme
          </Boton>
        </form>
      </Tarjeta>

      <button type="button" onClick={salir} className="text-sm text-slate-500">
        Cerrar sesión
      </button>
    </div>
  );
};
