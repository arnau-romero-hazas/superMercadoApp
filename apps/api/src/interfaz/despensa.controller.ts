import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  type ActualizarProductoPeticion,
  actualizarProductoSchema,
  type CrearProductoPeticion,
  crearProductoSchema,
  type ProductoHogarVista,
} from '@super/shared';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { vistas } from '@/interfaz/vistas.js';
import { ZodPipe } from '@/interfaz/zod.pipe.js';
import { despensaLogica } from '@/logica/despensa.logica.js';

@Controller('despensa')
@UseGuards(AuthGuard)
export class DespensaController {
  @Get()
  async listar(@UsuarioId() usuarioId: string): Promise<ProductoHogarVista[]> {
    return http.desenvolver(await despensaLogica.listar(usuarioId)).map(vistas.productoHogar);
  }

  @Post()
  async crear(
    @UsuarioId() usuarioId: string,
    @Body(new ZodPipe(crearProductoSchema)) peticion: CrearProductoPeticion,
  ): Promise<ProductoHogarVista> {
    return vistas.productoHogar(http.desenvolver(await despensaLogica.crear(usuarioId, peticion)));
  }

  @Patch(':id')
  async actualizar(
    @UsuarioId() usuarioId: string,
    @Param('id') productoId: string,
    @Body(new ZodPipe(actualizarProductoSchema)) peticion: ActualizarProductoPeticion,
  ): Promise<ProductoHogarVista> {
    return vistas.productoHogar(http.desenvolver(await despensaLogica.actualizar(usuarioId, productoId, peticion)));
  }

  @Delete(':id')
  @HttpCode(204)
  async eliminar(@UsuarioId() usuarioId: string, @Param('id') productoId: string): Promise<void> {
    http.desenvolver(await despensaLogica.eliminar(usuarioId, productoId));
  }
}
