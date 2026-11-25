import { loginSchema, registroSchema } from '@super/shared';
import { type FormEvent, useState } from 'react';
import { Boton, Campo, MensajeError, Tarjeta } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { sesion } from '@/logica/sesion';

type Modo = 'login' | 'registro';

export const Acceso = () => {
  const [modo, setModo] = useState<Modo>('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const login = sesion.useLogin();
  const registro = sesion.useRegistro();
  const mutacion = modo === 'login' ? login : registro;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    setErrorLocal(null);
    if (modo === 'login') {
      const peticion = loginSchema.safeParse({ email, password });
      if (!peticion.success) {
        setErrorLocal(peticion.error.issues[0]?.message ?? 'Datos no válidos');
        return;
      }
      login.mutate(peticion.data);
      return;
    }
    const peticion = registroSchema.safeParse({ nombre, email, password });
    if (!peticion.success) {
      setErrorLocal(peticion.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    registro.mutate(peticion.data);
  };

  const cambiarModo = () => {
    setModo(modo === 'login' ? 'registro' : 'login');
    setErrorLocal(null);
    login.reset();
    registro.reset();
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <img src="/icono.svg" alt="" className="mx-auto mb-4 size-16" />
        <h1 className="text-2xl font-bold">TraeLeche</h1>
        <p className="mt-1 text-slate-500">La compra del súper, entre los dos</p>
      </div>
      <Tarjeta>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          {modo === 'registro' ? (
            <Campo etiqueta="Nombre" id="nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          ) : null}
          <Campo etiqueta="Email" id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Campo
            etiqueta="Contraseña"
            id="password"
            type="password"
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <MensajeError mensaje={errorLocal ?? consulta.mensaje(mutacion.error)} />
          <Boton type="submit" cargando={mutacion.isPending}>
            {modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Boton>
        </form>
      </Tarjeta>
      <button type="button" onClick={cambiarModo} className="mt-6 text-sm font-medium text-marca-700">
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
      </button>
    </div>
  );
};
