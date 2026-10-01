import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { CompraVista } from '@super/shared';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { vistas } from '@/interfaz/vistas.js';
import { compraLogica } from '@/logica/compra.logica.js';

@Controller('compras')
@UseGuards(AuthGuard)
export class CompraController {
  @Get()
  async listar(@UsuarioId() usuarioId: string): Promise<CompraVista[]> {
    return http.desenvolver(await compraLogica.listar(usuarioId)).map(vistas.compra);
  }

  @Post('finalizar')
  async finalizar(@UsuarioId() usuarioId: string): Promise<CompraVista> {
    return vistas.compra(http.desenvolver(await compraLogica.finalizar(usuarioId)));
  }
}
