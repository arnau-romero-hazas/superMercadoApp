import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  type BuscarCatalogoPeticion,
  buscarCatalogoSchema,
  type Categoria,
  type EstadoCatalogoVista,
  type ProductoCatalogoVista,
} from '@super/shared';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { vistas } from '@/interfaz/vistas.js';
import { ZodPipe } from '@/interfaz/zod.pipe.js';
import { catalogoLogica } from '@/logica/catalogo.logica.js';

@Controller('catalogo')
@UseGuards(AuthGuard)
export class CatalogoController {
  @Get('buscar')
  async buscar(
    @UsuarioId() usuarioId: string,
    @Query(new ZodPipe(buscarCatalogoSchema)) peticion: BuscarCatalogoPeticion,
  ): Promise<ProductoCatalogoVista[]> {
    return http.desenvolver(await catalogoLogica.buscar(usuarioId, peticion.q)).map(vistas.productoCatalogo);
  }

  @Get('categorias')
  async categorias(@UsuarioId() usuarioId: string): Promise<Categoria[]> {
    return http.desenvolver(await catalogoLogica.categorias(usuarioId));
  }

  @Get('estado')
  async estado(@UsuarioId() usuarioId: string): Promise<EstadoCatalogoVista> {
    return vistas.estadoCatalogo(http.desenvolver(await catalogoLogica.estado(usuarioId)));
  }
}
