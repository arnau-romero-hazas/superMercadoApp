import type { ActualizarProductoPeticion, ProductoHogarVista } from '@super/shared';
import { type FormEvent, useState } from 'react';
import { Hoja } from '@/componentes/Hoja';
import { SelectorFoto } from '@/componentes/SelectorFoto';
import { Boton, Campo, MensajeError } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { type CambioFoto, despensa } from '@/logica/despensa';
import { NOMBRES_SUPERMERCADO, productos } from '@/logica/productos';

type Props = { producto: ProductoHogarVista; onCerrar: () => void };

const textoONulo = (valor: string): string | null => {
  const limpio = valor.trim();
  return limpio.length === 0 ? null : limpio;
};

const precioATexto = (precio: number | null): string =>
  precio === null ? '' : precio.toLocaleString('es-ES', { maximumFractionDigits: 2 });

export const EditarProducto = ({ producto, onCerrar }: Props) => {
  const { propio, catalogo } = producto;
  const [nombre, setNombre] = useState(producto.nombre);
  const [nota, setNota] = useState(producto.nota ?? '');
  const [descripcion, setDescripcion] = useState(propio === null ? '' : (propio.descripcion ?? ''));
  const [precio, setPrecio] = useState(propio === null ? '' : precioATexto(propio.precio));
  const [foto, setFoto] = useState<CambioFoto>({ tipo: 'mantener' });
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const editar = despensa.useEditarDetalle();
  const eliminar = despensa.useEliminar();

  const guardar = (evento: FormEvent) => {
    evento.preventDefault();
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length === 0) {
      setErrorLocal('El nombre es obligatorio');
      return;
    }
    const cambios: ActualizarProductoPeticion = { nombre: nombreLimpio, nota: textoONulo(nota) };
    if (propio !== null) {
      const precioLeido = productos.leerPrecio(precio);
      if (!precioLeido.ok) {
        setErrorLocal(precioLeido.error);
        return;
      }
      cambios.precio = precioLeido.value;
      cambios.descripcion = textoONulo(descripcion);
    }
    setErrorLocal(null);
    editar.mutate({ id: producto.id, cambios, foto: propio === null ? { tipo: 'mantener' } : foto }, { onSuccess: onCerrar });
  };

  const borrar = () => {
    if (!confirmarBorrado) {
      setConfirmarBorrado(true);
      return;
    }
    eliminar.mutate(producto.id, { onSuccess: onCerrar });
  };

  return (
    <Hoja titulo="Editar producto" onCerrar={onCerrar}>
      <form onSubmit={guardar} className="flex max-h-[75dvh] flex-col gap-4 overflow-y-auto">
        {catalogo === null ? null : (
          <p className="text-sm text-slate-500">
            {[catalogo.formato, productos.formatearPrecio(catalogo.precio)].filter((parte) => parte !== null).join(' · ')}
          </p>
        )}
        {propio === null ? null : (
          <>
            <SelectorFoto urlActual={propio.fotoUrl} onCambiar={setFoto} />
            <p className="-mt-2 text-xs text-slate-500">Producto propio · {NOMBRES_SUPERMERCADO[propio.supermercado]}</p>
          </>
        )}
        <Campo etiqueta="Nombre" id="editar-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {propio === null ? null : (
          <>
            <Campo
              etiqueta="Descripción"
              id="editar-descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <Campo
              etiqueta="Precio (€)"
              id="editar-precio"
              inputMode="decimal"
              placeholder="2,35"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
            />
          </>
        )}
        <Campo
          etiqueta="Nota"
          id="editar-nota"
          placeholder="Ej.: la de sin lactosa"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        {producto.actualizadoPor === null ? null : (
          <p className="text-xs text-slate-500">Último cambio: {producto.actualizadoPor}</p>
        )}
        <MensajeError mensaje={errorLocal ?? consulta.mensaje(editar.error) ?? consulta.mensaje(eliminar.error)} />
        <div className="flex gap-3">
          <Boton type="button" variante="peligro" onClick={borrar} cargando={eliminar.isPending} className="flex-1">
            {confirmarBorrado ? '¿Seguro?' : 'Eliminar'}
          </Boton>
          <Boton type="submit" cargando={editar.isPending} className="flex-1">
            Guardar
          </Boton>
        </div>
      </form>
    </Hoja>
  );
};
