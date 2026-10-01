import { model, mongo, Schema, Types } from 'mongoose';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type Foto = { clave: string; hogarId: string; tipo: string; datos: Buffer };

const fotoSchema = new Schema(
  {
    clave: { type: String, required: true, unique: true },
    hogarId: { type: Schema.Types.ObjectId, required: true, index: true },
    tipo: { type: String, required: true },
    datos: { type: Buffer, required: true },
  },
  { timestamps: true },
);

const FotoModelo = model('Foto', fotoSchema, 'fotos');

type FotoDocumento = { clave: string; hogarId: Types.ObjectId; tipo: string; datos: Buffer | mongo.Binary };

const aFoto = (doc: FotoDocumento): Foto => ({
  clave: doc.clave,
  hogarId: doc.hogarId.toString(),
  tipo: doc.tipo,
  datos: doc.datos instanceof mongo.Binary ? Buffer.from(doc.datos.buffer) : doc.datos,
});

const idNoValido = errores.validacion('Identificador no válido');

export const fotoRepositorio = {
  guardar: (foto: Foto): Promise<Result<Foto>> => {
    const hogarId = repositorioComun.aObjectId(foto.hogarId);
    if (hogarId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo guardar la foto', async () => {
      await FotoModelo.create({ ...foto, hogarId });
      return foto;
    });
  },

  buscar: (clave: string): Promise<Result<Foto | null>> =>
    repositorioComun.ejecutar('No se pudo obtener la foto', async () => {
      const doc = await FotoModelo.findOne({ clave }).lean<FotoDocumento>();
      return doc === null ? null : aFoto(doc);
    }),

  eliminar: (clave: string): Promise<Result<void>> =>
    repositorioComun.ejecutar('No se pudo eliminar la foto', async () => {
      await FotoModelo.deleteOne({ clave });
    }),
};
