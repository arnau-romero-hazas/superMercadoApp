import { CATEGORIA_OTROS, type Categoria, type EstadoProducto, type Supermercado, supermercadoSchema } from '@super/shared';
import { type FormEvent, useState } from 'react';
import { Hoja } from '@/componentes/Hoja';
import { SelectorFoto } from '@/componentes/SelectorFoto';
import { Boton, Campo, MensajeError } from '@/componentes/ui';
import { consulta } from '@/logica/consulta';
import { type CambioFoto, despensa } from '@/logica/despensa';
import { NOMBRES_SUPERMERCADO, productos } from '@/logica/productos';

type Props = {
  nombreInicial: string;
  estado: EstadoProducto;
  supermercado: Supermercado;
  categorias: Categoria[];
  onCerrar: () => void;
  onCreado: () => void;
};

const estiloSelect = 'min-h-11 rounded-xl border border-slate-300 bg-white px-2 text-base';

export const NuevoProducto = ({ nombreInicial, estado, supermercado: supermercadoInicial, categorias, onCerrar, onCreado }: Props) => {
  const [nombre, setNombre] = useState(nombreInicial);
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [supermercado, setSupermercado] = useState<Supermercado>(supermercadoInicial);
  const [categoria, setCategoria] = useState(CATEGORIA_OTROS.nombre);
  const [foto, setFoto] = useState<Blob | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const crear = despensa.useCrearPropio();

  const cambiarFoto = (cambio: CambioFoto) => setFoto(cambio.tipo === 'nueva' ? cambio.foto : null);

  const guardar = (evento: FormEvent) => {
    evento.preventDefault();
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.length === 0) {
      setErrorLocal('El nombre es obligatorio');
      return;
    }
    const precioLeido = productos.leerPrecio(precio);
    if (!precioLeido.ok) {
      setErrorLocal(precioLeido.error);
      return;
    }
    const descripcionLimpia = descripcion.trim();
    setErrorLocal(null);
    crear.mutate(
      {
        datos: {
          nombre: nombreLimpio,
          descripcion: descripcionLimpia.length === 0 ? null : descripcionLimpia,
          precio: precioLeido.value,
          supermercado,
          categoria: categorias.find((opcion) => opcion.nombre === categoria) ?? CATEGORIA_OTROS,
          estado,
        },
        foto,
      },
      { onSuccess: onCreado },
    );
  };

  return (
    <Hoja titulo="Producto nuevo" onCerrar={onCerrar}>
      <form onSubmit={guardar} className="flex max-h-[75dvh] flex-col gap-4 overflow-y-auto">
        <SelectorFoto urlActual={null} onCambiar={cambiarFoto} />
        <Campo etiqueta="Nombre" id="nuevo-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Campo
          etiqueta="Descripción"
          id="nuevo-descripcion"
          placeholder="Ej.: nuevo, junto a los hummus"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Campo
            etiqueta="Precio (€)"
            id="nuevo-precio"
            inputMode="decimal"
            placeholder="2,35"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-700">Supermercado</span>
            <select
              className={estiloSelect}
              value={supermercado}
              onChange={(e) => {
                const elegido = supermercadoSchema.safeParse(e.target.value);
                if (elegido.success) {
                  setSupermercado(elegido.data);
                }
              }}
            >
              {supermercadoSchema.options.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {NOMBRES_SUPERMERCADO[opcion]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-700">Categoría</span>
          <select className={estiloSelect} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((opcion) => (
              <option key={opcion.nombre} value={opcion.nombre}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </label>
        <MensajeError mensaje={errorLocal ?? consulta.mensaje(crear.error)} />
        <Boton type="submit" cargando={crear.isPending}>
          {estado === 'hay' ? 'Guardar en la despensa' : 'Guardar y añadir a la lista'}
        </Boton>
      </form>
    </Hoja>
  );
};
