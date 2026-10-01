import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { TAMANO_MAXIMO_FOTO, TIPOS_FOTO } from '@super/shared';
import express from 'express';
import mongoose from 'mongoose';
import { AppModule } from '@/app.module.js';
import { entorno } from '@/common/entorno.js';

const arrancar = async (): Promise<void> => {
  await mongoose.connect(entorno.MONGODB_URI);
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use('/api/fotos', express.raw({ type: [...TIPOS_FOTO], limit: TAMANO_MAXIMO_FOTO }));
  app.enableCors({ origin: entorno.CORS_ORIGIN });
  app.enableShutdownHooks();
  await app.listen(entorno.PORT);
};

void arrancar();
