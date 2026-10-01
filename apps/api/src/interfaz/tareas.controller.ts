import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common';
import { CronGuard } from '@/interfaz/cron.guard.js';
import { http } from '@/interfaz/http.js';
import { catalogoLogica } from '@/logica/catalogo.logica.js';

@Controller('tareas')
@UseGuards(CronGuard)
export class TareasController {
  @Get('sincronizar-catalogo')
  @HttpCode(204)
  async sincronizarCatalogo(): Promise<void> {
    http.desenvolver(await catalogoLogica.sincronizarZonasEnUso());
  }
}
