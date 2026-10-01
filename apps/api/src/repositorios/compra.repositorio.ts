import type { Supermercado } from '@super/shared';
import { model, Schema, Types } from 'mongoose';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type LineaCompra = { productoHogarId: string; nombre: string; precioEstimado: number | null };

export type Compra = {
  id: string;
  hogarId: string;
  supermercado: Supermercado;
  finalizadaPor: string;
  finalizadaEn: Date;
  lineas: LineaCompra[];
  totalEstimado: number;
};

const compraSchema = new Schema({
  hogarId: { type: Schema.Types.ObjectId, required: true, index: true },
  supermercado: { type: String, enum: ['mercadona'], required: true },
  finalizadaPor: { type: Schema.Types.ObjectId, required: true },
  finalizadaEn: { type: Date, required: true },
  lineas: [
    {
      _id: false,
      productoHogarId: { type: Schema.Types.ObjectId, required: true },
      nombre: { type: String, required: true },
      precioEstimado: { type: Number, default: null },
    },
  ],
  totalEstimado: { type: Number, required: true },
});

const CompraModelo = model('Compra', compraSchema, 'compras');

type CompraDocumento = {
  _id: Types.ObjectId;
  hogarId: Types.ObjectId;
  supermercado: Supermercado;
  finalizadaPor: Types.ObjectId;
  finalizadaEn: Date;
  lineas: { productoHogarId: Types.ObjectId; nombre: string; precioEstimado: number | null }[];
  totalEstimado: number;
};

const aCompra = (doc: CompraDocumento): Compra => ({
  id: doc._id.toString(),
  hogarId: doc.hogarId.toString(),
  supermercado: doc.supermercado,
  finalizadaPor: doc.finalizadaPor.toString(),
  finalizadaEn: doc.finalizadaEn,
  lineas: doc.lineas.map((linea) => ({
    productoHogarId: linea.productoHogarId.toString(),
    nombre: linea.nombre,
    precioEstimado: linea.precioEstimado,
  })),
  totalEstimado: doc.totalEstimado,
});

const idNoValido = errores.validacion('Identificador no válido');

export const compraRepositorio = {
  crear: (datos: Omit<Compra, 'id'>): Promise<Result<Compra>> => {
    const hogarId = repositorioComun.aObjectId(datos.hogarId);
    const finalizadaPor = repositorioComun.aObjectId(datos.finalizadaPor);
    const lineas = datos.lineas.map((linea) => ({ ...linea, productoHogarId: repositorioComun.aObjectId(linea.productoHogarId) }));
    if (hogarId === null || finalizadaPor === null || lineas.some((linea) => linea.productoHogarId === null)) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudo guardar la compra', async () => {
      const doc = await CompraModelo.create({ ...datos, hogarId, finalizadaPor, lineas });
      return aCompra(doc.toObject<CompraDocumento>());
    });
  },

  listarPorHogar: (hogarId: string, limite: number): Promise<Result<Compra[]>> => {
    const objectId = repositorioComun.aObjectId(hogarId);
    if (objectId === null) {
      return Promise.resolve(Result.fail(idNoValido));
    }
    return repositorioComun.ejecutar('No se pudieron listar las compras', async () => {
      const docs = await CompraModelo.find({ hogarId: objectId })
        .sort({ finalizadaEn: -1 })
        .limit(limite)
        .lean<CompraDocumento[]>();
      return docs.map(aCompra);
    });
  },
};
