import { Module } from '@nestjs/common';
import { AuthController } from '@/interfaz/auth.controller.js';
import { CatalogoController } from '@/interfaz/catalogo.controller.js';
import { CompraController } from '@/interfaz/compra.controller.js';
import { DespensaController } from '@/interfaz/despensa.controller.js';
import { FotoController } from '@/interfaz/foto.controller.js';
import { HogarController } from '@/interfaz/hogar.controller.js';
import { TareasController } from '@/interfaz/tareas.controller.js';

@Module({
  controllers: [
    AuthController,
    HogarController,
    DespensaController,
    CompraController,
    CatalogoController,
    FotoController,
    TareasController,
  ],
})
export class AppModule {}
