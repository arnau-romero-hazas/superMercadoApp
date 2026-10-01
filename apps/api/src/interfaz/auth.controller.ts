import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  type LoginPeticion,
  loginSchema,
  type RefreshPeticion,
  refreshSchema,
  type RegistroPeticion,
  registroSchema,
  type SesionAuthVista,
  type YoVista,
} from '@super/shared';
import { AuthGuard, UsuarioId } from '@/interfaz/auth.guard.js';
import { http } from '@/interfaz/http.js';
import { vistas } from '@/interfaz/vistas.js';
import { ZodPipe } from '@/interfaz/zod.pipe.js';
import { authLogica } from '@/logica/auth.logica.js';
import { hogarLogica } from '@/logica/hogar.logica.js';

@Controller('auth')
export class AuthController {
  @Post('registro')
  async registrar(@Body(new ZodPipe(registroSchema)) peticion: RegistroPeticion): Promise<SesionAuthVista> {
    return vistas.sesion(http.desenvolver(await authLogica.registrar(peticion)));
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodPipe(loginSchema)) peticion: LoginPeticion): Promise<SesionAuthVista> {
    return vistas.sesion(http.desenvolver(await authLogica.login(peticion)));
  }

  @Post('refresh')
  @HttpCode(200)
  async refrescar(@Body(new ZodPipe(refreshSchema)) peticion: RefreshPeticion): Promise<SesionAuthVista> {
    return vistas.sesion(http.desenvolver(await authLogica.refrescar(peticion.refreshToken)));
  }

  @Get('yo')
  @UseGuards(AuthGuard)
  async yo(@UsuarioId() usuarioId: string): Promise<YoVista> {
    const usuario = http.desenvolver(await authLogica.obtenerUsuario(usuarioId));
    const hogar = http.desenvolver(await hogarLogica.obtenerDelUsuario(usuarioId));
    return { usuario: vistas.usuario(usuario), hogar: hogar === null ? null : vistas.hogar(hogar) };
  }
}
