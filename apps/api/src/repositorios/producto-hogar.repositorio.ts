import type { Categoria, EstadoProducto, Supermercado } from '@super/shared';
import { model, Schema, Types } from 'mongoose';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type Equivalencia = { supermercado: Supermercado; idExterno: string };

export type DatosPropios = {
  supermercado: Supermercado;
  descripcion: string | null;
  precio: number | null;
  fotoId: string | null;
};

export type ProductoHogar = {
  id: string;
  hogarId: string;
  nombre: string;
  categoria: Categoria;
  estado: EstadoProducto;
  enCarro: boolean;
  nota: string | null;
  equivalencias: Equivalencia[];
  propio: DatosPropios | null;
  actualizadoPor: string | null;
  actualizadoEn: Date;
};

export type NuevoProductoHogar = Omit<ProductoHogar, 'id' | 'actualizadoEn'>;

export type CambiosProductoHogar = Partial<Pick<ProductoHogar, 'nombre' | 'estado' | 'enCarro' | 'nota' | 'propio'>> & {
  actualizadoPor: string;
};

const datosPropiosSchema = new Schema(
  {
    supermercado: { type: String, enum: ['mercadona'], required: true },
    descripcion: { type: String, default: null },
    precio: { type: Number, default: null },
    fotoId: { type: String, default: null },
  },
  { _id: false },
);

const productoHogarSchema = new Schema(
  {
    hogarId: { type: Schema.Types.ObjectId, required: true, index: true },
    nombre: { type: String, required: true },
    categoria: {
      nombre: { type: String, required: true },
      orden: { type: Number, required: true },
    },
    estado: { type: String, enum: ['hay', 'queda_poco', 'falta'], required: true },
    enCarro: { type: Boolean, required: true, default: false },
    nota: { type: String, default: null },
    equivalencias: [
      {
        _id: false,
        supermercado: { type: String, enum: ['mercadona'], required: true },
        idExterno: { type: String, required: true },
      },
    ],
    propio: { type: datosPropiosSchema, default: null },
    actualizadoPor: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

const ProductoHogarModelo = model('ProductoHogar', productoHogarSchema, 'productos_hogar');

type ProductoHogarDocumento = {
  _id: Types.ObjectId;
  hogarId: Types.ObjectId;
  nombre: string;
  categoria: Categoria;
  estado: EstadoProducto;
  enCarro: boolean;
  nota: string | null;
  equivalencias: Equivalencia[];
  propio?: DatosPropios | null;
  actualizadoPor: Types.ObjectId | null;
  updatedAt: Date;
};

const aProductoHogar = (doc: ProductoHogarDocumento): ProductoHogar => ({
  id: doc._id.toString(),
  hogarId: doc.hogarId.toString(),
  nombre: doc.nombre,
  categoria: { nombre: doc.categoria.nombre, orden: doc.categoria.orden },
  estado: doc.estado,
  enCarro: doc.enCarro,
  nota: doc.nota,
  equivalencias: doc.equivalencias.map((equivalencia) => ({
    supermercado: equivalencia.supermercado,
    idExterno: equivalencia.idExterno,
  })),
  propio:
    doc.propio === undefined || doc.propio === null
      ? null
      : {
          supermercado: doc.propio.supermercado,
          descripcion: doc.propio.descripcion,
          precio: doc.propio.precio,
          fotoId: doc.propio.fotoId,
        },
  actualizadoPor: doc.actualizadoPor === null ? null : doc.actualizadoPor.toString(),
  actualizadoEn: doc.updatedAt,
});

const idNoValido = errores.validacion('Identificador no válido');

export const productoHogarRepositorio = {
  crear: (datos: NuevoProductoHogar): Promise<Result<ProductoHogar>> => {
    const hogarId = repositorioComun.aObjectId(datos.hogarId);
    const actualizadoPor = datos.actualizadoPor === null ? null : repositorioComun.aObjectId(datos.actualizadoPor);
    if (hogarId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo crear el producto', async () => {
      const doc = await ProductoHogarModelo.create({ ...datos, hogarId, actualizadoPor });
      return aProductoHogar(doc.toObject<ProductoHogarDocumento>());
    });
  },

  listarPorHogar: (hogarId: string): Promise<Result<ProductoHogar[]>> => {
    const objectId = repositorioComun.aObjectId(hogarId);
    if (objectId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudieron listar los productos', async () => {
      const docs = await ProductoHogarModelo.find({ hogarId: objectId })
        .sort({ 'categoria.orden': 1, nombre: 1 })
        .lean<ProductoHogarDocumento[]>();
      return docs.map(aProductoHogar);
    });
  },

  listarEnCarro: (hogarId: string): Promise<Result<ProductoHogar[]>> => {
    const objectId = repositorioComun.aObjectId(hogarId);
    if (objectId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudieron listar los productos del carro', async () => {
      const docs = await ProductoHogarModelo.find({ hogarId: objectId, enCarro: true }).lean<ProductoHogarDocumento[]>();
      return docs.map(aProductoHogar);
    });
  },

  buscarEnHogar: (hogarId: string, productoId: string): Promise<Result<ProductoHogar | null>> => {
    const hogarObjectId = repositorioComun.aObjectId(hogarId);
    const productoObjectId = repositorioComun.aObjectId(productoId);
    if (hogarObjectId === null || productoObjectId === null) {
      return Promise.resolve(Result.success(null));
    }
    return repositorioComun.ejecutar('No se pudo buscar el producto', async () => {
      const doc = await ProductoHogarModelo.findOne({ _id: productoObjectId, hogarId: hogarObjectId }).lean<ProductoHogarDocumento>();
      return doc === null ? null : aProductoHogar(doc);
    });
  },

  buscarPorEquivalencia: (hogarId: string, equivalencia: Equivalencia): Promise<Result<ProductoHogar | null>> => {
    const objectId = repositorioComun.aObjectId(hogarId);
    if (objectId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo buscar el producto', async () => {
      const doc = await ProductoHogarModelo.findOne({
        hogarId: objectId,
        equivalencias: { $elemMatch: equivalencia },
      }).lean<ProductoHogarDocumento>();
      return doc === null ? null : aProductoHogar(doc);
    });
  },

  actualizar: (productoId: string, cambios: CambiosProductoHogar): Promise<Result<ProductoHogar | null>> => {
    const objectId = repositorioComun.aObjectId(productoId);
    const actualizadoPor = repositorioComun.aObjectId(cambios.actualizadoPor);
    if (objectId === null || actualizadoPor === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo actualizar el producto', async () => {
      const doc = await ProductoHogarModelo.findByIdAndUpdate(
        objectId,
        { $set: { ...cambios, actualizadoPor } },
        { new: true },
      ).lean<ProductoHogarDocumento>();
      return doc === null ? null : aProductoHogar(doc);
    });
  },

  reponerCarro: (hogarId: string, actualizadoPor: string): Promise<Result<number>> => {
    const hogarObjectId = repositorioComun.aObjectId(hogarId);
    const usuarioObjectId = repositorioComun.aObjectId(actualizadoPor);
    if (hogarObjectId === null || usuarioObjectId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo reponer la despensa', async () => {
      const resultado = await ProductoHogarModelo.updateMany(
        { hogarId: hogarObjectId, enCarro: true },
        { $set: { estado: 'hay', enCarro: false, actualizadoPor: usuarioObjectId } },
      );
      return resultado.modifiedCount;
    });
  },

  eliminar: (productoId: string): Promise<Result<boolean>> => {
    const objectId = repositorioComun.aObjectId(productoId);
    if (objectId === null) {
      return Promise.resolve(Result.success(false));
    }
    return repositorioComun.ejecutar('No se pudo eliminar el producto', async () => {
      const resultado = await ProductoHogarModelo.deleteOne({ _id: objectId });
      return resultado.deletedCount === 1;
    });
  },
};
