import { model, Schema, Types } from 'mongoose';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  passwordHash: string;
};

const usuarioSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const UsuarioModelo = model('Usuario', usuarioSchema, 'usuarios');

type UsuarioDocumento = { _id: Types.ObjectId; email: string; nombre: string; passwordHash: string };

const aUsuario = (doc: UsuarioDocumento): Usuario => ({
  id: doc._id.toString(),
  email: doc.email,
  nombre: doc.nombre,
  passwordHash: doc.passwordHash,
});

export const usuarioRepositorio = {
  crear: (datos: Omit<Usuario, 'id'>): Promise<Result<Usuario>> =>
    repositorioComun.ejecutar(
      'No se pudo crear el usuario',
      async () => aUsuario(await UsuarioModelo.create(datos)),
      (error) =>
        repositorioComun.esClaveDuplicada(error) ? errores.estado('Ya existe una cuenta con ese email') : null,
    ),

  buscarPorEmail: (email: string): Promise<Result<Usuario | null>> =>
    repositorioComun.ejecutar('No se pudo buscar el usuario', async () => {
      const doc = await UsuarioModelo.findOne({ email }).lean();
      return doc === null ? null : aUsuario(doc);
    }),

  buscarPorId: (id: string): Promise<Result<Usuario | null>> => {
    const objectId = repositorioComun.aObjectId(id);
    if (objectId === null) {
      return Promise.resolve(Result.success(null));
    }
    return repositorioComun.ejecutar('No se pudo buscar el usuario', async () => {
      const doc = await UsuarioModelo.findById(objectId).lean();
      return doc === null ? null : aUsuario(doc);
    });
  },

  buscarPorIds: (ids: string[]): Promise<Result<Usuario[]>> => {
    const objectIds = ids.map(repositorioComun.aObjectId).filter((id) => id !== null);
    return repositorioComun.ejecutar('No se pudieron buscar los usuarios', async () => {
      const docs = await UsuarioModelo.find({ _id: { $in: objectIds } }).lean();
      return docs.map(aUsuario);
    });
  },
};
