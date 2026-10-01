import { Controller, Get, Headers, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { FotoSubidaVista } from '@super/shared';
import type { Request, Response } from 'express';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { fotoLogica } from '@/logica/foto.logica.js';

const UN_ANO_SEGUNDOS = 365 * 24 * 60 * 60;

@Controller('fotos')
export class FotoController {
  @Post()
  @UseGuards(AuthGuard)
  async subir(
    @UsuarioId() usuarioId: string,
    @Headers('content-type') tipo: string | undefined,
    @Req() peticion: Request,
  ): Promise<FotoSubidaVista> {
    const datos: unknown = peticion.body;
    return { id: http.desenvolver(await fotoLogica.subir(usuarioId, tipo ?? 'desconocido', datos)) };
  }

  @Get(':clave')
  async obtener(@Param('clave') clave: string, @Res() respuesta: Response): Promise<void> {
    const foto = http.desenvolver(await fotoLogica.obtener(clave));
    respuesta
      .type(foto.tipo)
      .setHeader('Cache-Control', `private, max-age=${UN_ANO_SEGUNDOS}, immutable`)
      .send(foto.datos);
  }
}
