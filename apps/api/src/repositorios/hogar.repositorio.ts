import type { Supermercado } from '@super/shared';
import { model, Schema, Types } from 'mongoose';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type RolMiembro = 'admin' | 'miembro';

export type Hogar = {
  id: string;
  nombre: string;
  codigoPostal: string;
  supermercado: Supermercado;
  zonaCatalogo: string;
  codigoInvitacion: string;
  miembros: { usuarioId: string; rol: RolMiembro; unidoEn: Date }[];
};

export type ZonaCatalogo = { supermercado: Supermercado; zona: string };

const hogarSchema = new Schema(
  {
    nombre: { type: String, required: true },
    codigoPostal: { type: String, required: true },
    supermercado: { type: String, enum: ['mercadona'], required: true },
    zonaCatalogo: { type: String, required: true },
    codigoInvitacion: { type: String, required: true, unique: true },
    miembros: [
      {
        _id: false,
        usuarioId: { type: Schema.Types.ObjectId, required: true, index: true },
        rol: { type: String, enum: ['admin', 'miembro'], required: true },
        unidoEn: { type: Date, required: true },
      },
    ],
  },
  { timestamps: true },
);

const HogarModelo = model('Hogar', hogarSchema, 'hogares');

type HogarDocumento = {
  _id: Types.ObjectId;
  nombre: string;
  codigoPostal: string;
  supermercado: Supermercado;
  zonaCatalogo: string;
  codigoInvitacion: string;
  miembros: { usuarioId: Types.ObjectId; rol: RolMiembro; unidoEn: Date }[];
};

const aHogar = (doc: HogarDocumento): Hogar => ({
  id: doc._id.toString(),
  nombre: doc.nombre,
  codigoPostal: doc.codigoPostal,
  supermercado: doc.supermercado,
  zonaCatalogo: doc.zonaCatalogo,
  codigoInvitacion: doc.codigoInvitacion,
  miembros: doc.miembros.map((miembro) => ({
    usuarioId: miembro.usuarioId.toString(),
    rol: miembro.rol,
    unidoEn: miembro.unidoEn,
  })),
});

const usuarioNoValido = errores.validacion('Identificador de usuario no válido');

export const hogarRepositorio = {
  crear: (datos: Omit<Hogar, 'id'>): Promise<Result<Hogar>> => {
    const miembros = datos.miembros.map((miembro) => ({ ...miembro, usuarioId: repositorioComun.aObjectId(miembro.usuarioId) }));
    if (miembros.some((miembro) => miembro.usuarioId === null)) {
      return Promise.resolve(Result.fail(usuarioNoValido));
    }
    return repositorioComun.ejecutar(
      'No se pudo crear el hogar',
      async () => aHogar(await HogarModelo.create({ ...datos, miembros })),
      (error) => (repositorioComun.esClaveDuplicada(error) ? errores.estado('Código de invitación duplicado') : null),
    );
  },

  buscarPorMiembro: (usuarioId: string): Promise<Result<Hogar | null>> => {
    const objectId = repositorioComun.aObjectId(usuarioId);
    if (objectId === null) {
      return Promise.resolve(Result.fail(usuarioNoValido));
    }
    return repositorioComun.ejecutar('No se pudo buscar el hogar', async () => {
      const doc = await HogarModelo.findOne({ 'miembros.usuarioId': objectId }).lean<HogarDocumento>();
      return doc === null ? null : aHogar(doc);
    });
  },

  buscarPorCodigoInvitacion: (codigoInvitacion: string): Promise<Result<Hogar | null>> =>
    repositorioComun.ejecutar('No se pudo buscar el hogar', async () => {
      const doc = await HogarModelo.findOne({ codigoInvitacion }).lean<HogarDocumento>();
      return doc === null ? null : aHogar(doc);
    }),

  anadirMiembro: (hogarId: string, usuarioId: string): Promise<Result<Hogar | null>> => {
    const hogarObjectId = repositorioComun.aObjectId(hogarId);
    const usuarioObjectId = repositorioComun.aObjectId(usuarioId);
    if (hogarObjectId === null || usuarioObjectId === null) {
      return Promise.resolve(Result.success(null));
    }
    return repositorioComun.ejecutar('No se pudo añadir el miembro', async () => {
      const doc = await HogarModelo.findByIdAndUpdate(
        hogarObjectId,
        { $push: { miembros: { usuarioId: usuarioObjectId, rol: 'miembro', unidoEn: new Date() } } },
        { new: true },
      ).lean<HogarDocumento>();
      return doc === null ? null : aHogar(doc);
    });
  },

  actualizar: (
    hogarId: string,
    cambios: Partial<Pick<Hogar, 'nombre' | 'codigoPostal' | 'zonaCatalogo'>>,
  ): Promise<Result<Hogar | null>> => {
    const objectId = repositorioComun.aObjectId(hogarId);
    if (objectId === null) {
      return Promise.resolve(Result.success(null));
    }
    return repositorioComun.ejecutar('No se pudo actualizar el hogar', async () => {
      const doc = await HogarModelo.findByIdAndUpdate(objectId, { $set: cambios }, { new: true }).lean<HogarDocumento>();
      return doc === null ? null : aHogar(doc);
    });
  },

  zonasEnUso: (): Promise<Result<ZonaCatalogo[]>> =>
    repositorioComun.ejecutar('No se pudieron obtener las zonas de catálogo', async () => {
      const grupos = await HogarModelo.aggregate<{ _id: ZonaCatalogo }>([
        { $group: { _id: { supermercado: '$supermercado', zona: '$zonaCatalogo' } } },
      ]);
      return grupos.map((grupo) => grupo._id);
    }),
};
