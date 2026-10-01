import { Body, Controller, Get, NotFoundException, Patch, Post, UseGuards } from '@nestjs/common';
import { waitUntil } from '@vercel/functions';
import {
  type ActualizarHogarPeticion,
  actualizarHogarSchema,
  type CrearHogarPeticion,
  crearHogarSchema,
  type HogarVista,
  type UnirseHogarPeticion,
  unirseHogarSchema,
} from '@super/shared';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { vistas } from '@/interfaz/vistas.js';
import { ZodPipe } from '@/interfaz/zod.pipe.js';
import { catalogoLogica } from '@/logica/catalogo.logica.js';
import { type HogarDetalle, hogarLogica } from '@/logica/hogar.logica.js';

@Controller('hogares')
@UseGuards(AuthGuard)
export class HogarController {
  @Post()
  async crear(
    @UsuarioId() usuarioId: string,
    @Body(new ZodPipe(crearHogarSchema)) peticion: CrearHogarPeticion,
  ): Promise<HogarVista> {
    const detalle = http.desenvolver(await hogarLogica.crear(usuarioId, peticion));
    this.prepararCatalogo(detalle);
    return vistas.hogar(detalle);
  }

  @Post('unirse')
  async unirse(
    @UsuarioId() usuarioId: string,
    @Body(new ZodPipe(unirseHogarSchema)) peticion: UnirseHogarPeticion,
  ): Promise<HogarVista> {
    return vistas.hogar(http.desenvolver(await hogarLogica.unirse(usuarioId, peticion.codigoInvitacion)));
  }

  @Get('actual')
  async actual(@UsuarioId() usuarioId: string): Promise<HogarVista> {
    const detalle = http.desenvolver(await hogarLogica.obtenerDelUsuario(usuarioId));
    if (detalle === null) {
      throw new NotFoundException('Todavía no perteneces a ningún hogar');
    }
    return vistas.hogar(detalle);
  }

  @Patch('actual')
  async actualizar(
    @UsuarioId() usuarioId: string,
    @Body(new ZodPipe(actualizarHogarSchema)) peticion: ActualizarHogarPeticion,
  ): Promise<HogarVista> {
    const detalle = http.desenvolver(await hogarLogica.actualizar(usuarioId, peticion));
    this.prepararCatalogo(detalle);
    return vistas.hogar(detalle);
  }

  private prepararCatalogo({ hogar }: HogarDetalle): void {
    waitUntil(catalogoLogica.asegurarSincronizado(hogar.supermercado, hogar.zonaCatalogo));
  }
}
