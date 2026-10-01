import { Result } from '@/common/result';

const LADO_MAXIMO = 1000;
const CALIDAD = 0.8;

const aBlob = (lienzo: HTMLCanvasElement, tipo: string): Promise<Blob | null> =>
  new Promise((resolve) => lienzo.toBlob(resolve, tipo, CALIDAD));

export const imagenServicio = {
  comprimir: async (archivo: File): Promise<Result<Blob, string>> => {
    try {
      const mapa = await createImageBitmap(archivo);
      const escala = Math.min(1, LADO_MAXIMO / Math.max(mapa.width, mapa.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(mapa.width * escala);
      lienzo.height = Math.round(mapa.height * escala);
      const contexto = lienzo.getContext('2d');
      if (contexto === null) {
        mapa.close();
        return Result.fail('Este navegador no puede procesar la foto');
      }
      contexto.drawImage(mapa, 0, 0, lienzo.width, lienzo.height);
      mapa.close();
      const webp = await aBlob(lienzo, 'image/webp');
      if (webp !== null && webp.type === 'image/webp') {
        return Result.success(webp);
      }
      const jpeg = await aBlob(lienzo, 'image/jpeg');
      return jpeg === null ? Result.fail('No se pudo comprimir la foto') : Result.success(jpeg);
    } catch {
      return Result.fail('No se pudo leer la imagen');
    }
  },
};
