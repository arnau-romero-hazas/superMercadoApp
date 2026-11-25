import { z } from 'zod';
import { categoriaSchema, estadoProductoSchema, supermercadoSchema } from './dominio.js';

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Email no válido'));
const codigoPostalSchema = z.string().trim().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos');

export const requisitosPassword: { texto: string; patron: RegExp }[] = [
  { texto: 'Al menos 8 caracteres', patron: /^[\s\S]{8,}$/u },
  { texto: 'Una mayúscula', patron: /\p{Lu}/u },
  { texto: 'Una minúscula', patron: /\p{Ll}/u },
  { texto: 'Un número', patron: /\p{N}/u },
  { texto: 'Un símbolo (!, ?, #, …)', patron: /[^\p{L}\p{N}\s]/u },
];

const passwordNuevaSchema = requisitosPassword.reduce(
  (schema, requisito) => schema.regex(requisito.patron, `La contraseña debe tener ${requisito.texto.toLowerCase()}`),
  z.string().max(128),
);

export const registroSchema = z.object({
  email: emailSchema,
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(50),
  password: passwordNuevaSchema,
});
export type RegistroPeticion = z.infer<typeof registroSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
});
export type LoginPeticion = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshPeticion = z.infer<typeof refreshSchema>;

export const crearHogarSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(50),
  codigoPostal: codigoPostalSchema,
});
export type CrearHogarPeticion = z.infer<typeof crearHogarSchema>;

export const unirseHogarSchema = z.object({
  codigoInvitacion: z.string().trim().toUpperCase().min(1, 'El código es obligatorio'),
});
export type UnirseHogarPeticion = z.infer<typeof unirseHogarSchema>;

export const actualizarHogarSchema = z.object({
  nombre: z.string().trim().min(1).max(50).optional(),
  codigoPostal: codigoPostalSchema.optional(),
});
export type ActualizarHogarPeticion = z.infer<typeof actualizarHogarSchema>;

const descripcionSchema = z.string().trim().max(300, 'La descripción es demasiado larga');
const precioSchema = z.number().nonnegative('El precio no puede ser negativo').max(10_000, 'Precio no válido');
const fotoIdSchema = z.string().regex(/^[a-f0-9]{32}$/, 'Foto no válida');

export const crearProductoSchema = z.discriminatedUnion('origen', [
  z.object({
    origen: z.literal('catalogo'),
    catalogoProductoId: z.string().min(1),
    estado: estadoProductoSchema,
  }),
  z.object({
    origen: z.literal('propio'),
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    categoria: categoriaSchema,
    estado: estadoProductoSchema,
    supermercado: supermercadoSchema,
    descripcion: descripcionSchema.nullable(),
    precio: precioSchema.nullable(),
    fotoId: fotoIdSchema.nullable(),
  }),
]);
export type CrearProductoPeticion = z.infer<typeof crearProductoSchema>;

export const actualizarProductoSchema = z.object({
  estado: estadoProductoSchema.optional(),
  enCarro: z.boolean().optional(),
  nombre: z.string().trim().min(1).max(80).optional(),
  nota: z.string().trim().max(200).nullable().optional(),
  descripcion: descripcionSchema.nullable().optional(),
  precio: precioSchema.nullable().optional(),
  fotoId: fotoIdSchema.nullable().optional(),
});
export type ActualizarProductoPeticion = z.infer<typeof actualizarProductoSchema>;

export const buscarCatalogoSchema = z.object({
  q: z.string().trim().min(2, 'Escribe al menos 2 letras').max(60),
});
export type BuscarCatalogoPeticion = z.infer<typeof buscarCatalogoSchema>;

export const TIPOS_FOTO = ['image/webp', 'image/jpeg', 'image/png'] as const;
export const TAMANO_MAXIMO_FOTO = 2 * 1024 * 1024;
