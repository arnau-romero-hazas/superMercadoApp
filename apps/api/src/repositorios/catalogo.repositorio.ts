import type { Categoria, Supermercado } from '@super/shared';
import { model, Schema, Types } from 'mongoose';
import { Result } from '@/common/result.js';
import { texto } from '@/common/texto.js';
import { repositorioComun } from '@/repositorios/comun.js';

export type ProductoCatalogo = {
  supermercado: Supermercado;
  zona: string;
  idExterno: string;
  nombre: string;
  formato: string | null;
  precio: number;
  imagenUrl: string | null;
  categoria: Categoria;
};

export type EstadoSincronizacion = {
  sincronizando: boolean;
  productos: number;
  sincronizadoEn: Date | null;
};

const productoCatalogoSchema = new Schema({
  supermercado: { type: String, enum: ['mercadona'], required: true },
  zona: { type: String, required: true },
  idExterno: { type: String, required: true },
  nombre: { type: String, required: true },
  nombreNormalizado: { type: String, required: true },
  formato: { type: String, default: null },
  precio: { type: Number, required: true },
  imagenUrl: { type: String, default: null },
  categoria: {
    nombre: { type: String, required: true },
    orden: { type: Number, required: true },
  },
  sincronizadoEn: { type: Date, required: true },
});
productoCatalogoSchema.index({ supermercado: 1, zona: 1, idExterno: 1 }, { unique: true });

const ProductoCatalogoModelo = model('ProductoCatalogo', productoCatalogoSchema, 'catalogo_productos');

const sincronizacionSchema = new Schema({
  supermercado: { type: String, enum: ['mercadona'], required: true },
  zona: { type: String, required: true },
  sincronizando: { type: Boolean, required: true },
  iniciadaEn: { type: Date, required: true },
  sincronizadoEn: { type: Date, default: null },
  productos: { type: Number, required: true, default: 0 },
});
sincronizacionSchema.index({ supermercado: 1, zona: 1 }, { unique: true });

const SincronizacionModelo = model('SincronizacionCatalogo', sincronizacionSchema, 'catalogo_sincronizaciones');

type ProductoCatalogoDocumento = {
  _id: Types.ObjectId;
  supermercado: Supermercado;
  zona: string;
  idExterno: string;
  nombre: string;
  formato: string | null;
  precio: number;
  imagenUrl: string | null;
  categoria: Categoria;
};

type SincronizacionDocumento = {
  sincronizando: boolean;
  productos: number;
  sincronizadoEn: Date | null;
};

const SINCRONIZACION_CADUCADA_MS = 60 * 60 * 1000;

const aProductoCatalogo = (doc: ProductoCatalogoDocumento): ProductoCatalogo => ({
  supermercado: doc.supermercado,
  zona: doc.zona,
  idExterno: doc.idExterno,
  nombre: doc.nombre,
  formato: doc.formato,
  precio: doc.precio,
  imagenUrl: doc.imagenUrl,
  categoria: { nombre: doc.categoria.nombre, orden: doc.categoria.orden },
});

export const catalogoRepositorio = {
  reemplazarZona: (supermercado: Supermercado, zona: string, productos: ProductoCatalogo[]): Promise<Result<number>> =>
    repositorioComun.ejecutar('No se pudo guardar el catálogo', async () => {
      const sincronizadoEn = new Date();
      await ProductoCatalogoModelo.bulkWrite(
        productos.map((producto) => ({
          updateOne: {
            filter: { supermercado, zona, idExterno: producto.idExterno },
            update: { $set: { ...producto, nombreNormalizado: texto.normalizar(producto.nombre), sincronizadoEn } },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      await ProductoCatalogoModelo.deleteMany({ supermercado, zona, sincronizadoEn: { $lt: sincronizadoEn } });
      return productos.length;
    }),

  buscar: (supermercado: Supermercado, zona: string, consulta: string, limite: number): Promise<Result<ProductoCatalogo[]>> => {
    const palabras = texto.normalizar(consulta).split(/\s+/).filter((palabra) => palabra.length > 0);
    return repositorioComun.ejecutar('No se pudo buscar en el catálogo', async () => {
      const docs = await ProductoCatalogoModelo.find({
        supermercado,
        zona,
        $and: palabras.map((palabra) => ({ nombreNormalizado: { $regex: texto.escaparRegex(palabra) } })),
      })
        .sort({ nombre: 1 })
        .limit(limite)
        .lean<ProductoCatalogoDocumento[]>();
      return docs.map(aProductoCatalogo);
    });
  },

  buscarPorIdsExternos: (supermercado: Supermercado, zona: string, idsExternos: string[]): Promise<Result<ProductoCatalogo[]>> =>
    repositorioComun.ejecutar('No se pudieron obtener los productos del catálogo', async () => {
      const docs = await ProductoCatalogoModelo.find({ supermercado, zona, idExterno: { $in: idsExternos } }).lean<
        ProductoCatalogoDocumento[]
      >();
      return docs.map(aProductoCatalogo);
    }),

  categorias: (supermercado: Supermercado, zona: string): Promise<Result<Categoria[]>> =>
    repositorioComun.ejecutar('No se pudieron obtener las categorías', async () => {
      const grupos = await ProductoCatalogoModelo.aggregate<{ _id: string; orden: number }>([
        { $match: { supermercado, zona } },
        { $group: { _id: '$categoria.nombre', orden: { $min: '$categoria.orden' } } },
        { $sort: { orden: 1, _id: 1 } },
      ]);
      return grupos.map((grupo) => ({ nombre: grupo._id, orden: grupo.orden }));
    }),

  estadoSincronizacion: (supermercado: Supermercado, zona: string): Promise<Result<EstadoSincronizacion | null>> =>
    repositorioComun.ejecutar('No se pudo obtener el estado del catálogo', async () => {
      const doc = await SincronizacionModelo.findOne({ supermercado, zona }).lean<SincronizacionDocumento>();
      return doc === null
        ? null
        : { sincronizando: doc.sincronizando, productos: doc.productos, sincronizadoEn: doc.sincronizadoEn };
    }),

  iniciarSincronizacion: (supermercado: Supermercado, zona: string): Promise<Result<boolean>> =>
    repositorioComun.ejecutar('No se pudo iniciar la sincronización', async () => {
      const caducada = new Date(Date.now() - SINCRONIZACION_CADUCADA_MS);
      try {
        await SincronizacionModelo.findOneAndUpdate(
          { supermercado, zona, $or: [{ sincronizando: false }, { iniciadaEn: { $lt: caducada } }] },
          { $set: { sincronizando: true, iniciadaEn: new Date() } },
          { upsert: true },
        );
        return true;
      } catch (error) {
        if (repositorioComun.esClaveDuplicada(error)) {
          return false;
        }
        throw error;
      }
    }),

  finalizarSincronizacion: (
    supermercado: Supermercado,
    zona: string,
    productos: number | null,
  ): Promise<Result<void>> =>
    repositorioComun.ejecutar('No se pudo finalizar la sincronización', async () => {
      const cambios = productos === null ? { sincronizando: false } : { sincronizando: false, productos, sincronizadoEn: new Date() };
      await SincronizacionModelo.updateOne({ supermercado, zona }, { $set: cambios });
    }),
};
