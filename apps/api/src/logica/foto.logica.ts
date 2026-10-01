import { randomBytes } from 'node:crypto';
import { TAMANO_MAXIMO_FOTO, TIPOS_FOTO } from '@super/shared';
import { errores } from '@/common/errores.js';
import { Result } from '@/common/result.js';
import { hogarActual } from '@/logica/hogar-actual.js';
import { type Foto, fotoRepositorio } from '@/repositorios/foto.repositorio.js';

type TipoFoto = (typeof TIPOS_FOTO)[number];

const esTipoFoto = (tipo: string): tipo is TipoFoto => TIPOS_FOTO.some((permitido) => permitido === tipo);

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const coincideFirma: Record<TipoFoto, (datos: Buffer) => boolean> = {
  'image/webp': (datos) =>
    datos.subarray(0, 4).toString('ascii') === 'RIFF' && datos.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/jpeg': (datos) => datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff,
  'image/png': (datos) => datos.subarray(0, FIRMA_PNG.length).equals(FIRMA_PNG),
};

const fotoNoValida = errores.validacion('La foto debe ser una imagen WebP, JPEG o PNG de menos de 2 MB');

export const fotoLogica = {
  subir: async (usuarioId: string, tipo: string, datos: unknown): Promise<Result<string>> => {
    if (!esTipoFoto(tipo) || !Buffer.isBuffer(datos)) {
      return Result.fail(fotoNoValida);
    }
    if (datos.length === 0 || datos.length > TAMANO_MAXIMO_FOTO || !coincideFirma[tipo](datos)) {
      return Result.fail(fotoNoValida);
    }
    const hogar = await hogarActual.exigir(usuarioId);
    if (!hogar.ok) {
      return hogar;
    }
    const guardada = await fotoRepositorio.guardar({
      clave: randomBytes(16).toString('hex'),
      hogarId: hogar.value.id,
      tipo,
      datos,
    });
    if (!guardada.ok) {
      return guardada;
    }
    return Result.success(guardada.value.clave);
  },

  obtener: async (clave: string): Promise<Result<Foto>> => {
    const foto = await fotoRepositorio.buscar(clave);
    if (!foto.ok) {
      return foto;
    }
    if (foto.value === null) {
      return Result.fail(errores.existencia('La foto no existe'));
    }
    return Result.success(foto.value);
  },
};
