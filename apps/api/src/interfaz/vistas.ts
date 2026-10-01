import type {
  CompraVista,
  EstadoCatalogoVista,
  HogarVista,
  ProductoCatalogoVista,
  ProductoHogarVista,
  SesionAuthVista,
  UsuarioVista,
} from '@super/shared';
import type { SesionAuth } from '@/logica/auth.logica.js';
import type { CompraDetalle } from '@/logica/compra.logica.js';
import type { DetalleProducto } from '@/logica/despensa.logica.js';
import type { HogarDetalle } from '@/logica/hogar.logica.js';
import type { EstadoSincronizacion, ProductoCatalogo } from '@/repositorios/catalogo.repositorio.js';
import type { Usuario } from '@/repositorios/usuario.repositorio.js';

const usuario = (entidad: Usuario): UsuarioVista => ({ id: entidad.id, email: entidad.email, nombre: entidad.nombre });

const productoCatalogo = (entidad: ProductoCatalogo): ProductoCatalogoVista => ({
  id: entidad.idExterno,
  nombre: entidad.nombre,
  formato: entidad.formato,
  precio: entidad.precio,
  imagenUrl: entidad.imagenUrl,
  categoria: entidad.categoria,
});

export const vistas = {
  usuario,

  sesion: (sesion: SesionAuth): SesionAuthVista => ({
    accessToken: sesion.accessToken,
    refreshToken: sesion.refreshToken,
    usuario: usuario(sesion.usuario),
  }),

  hogar: ({ hogar, miembros }: HogarDetalle): HogarVista => ({
    id: hogar.id,
    nombre: hogar.nombre,
    codigoPostal: hogar.codigoPostal,
    supermercado: hogar.supermercado,
    codigoInvitacion: hogar.codigoInvitacion,
    miembros: miembros.map((miembro) => ({ id: miembro.id, nombre: miembro.nombre })),
  }),

  productoCatalogo,

  productoHogar: ({ producto, catalogo, actualizadoPor }: DetalleProducto): ProductoHogarVista => ({
    id: producto.id,
    nombre: producto.nombre,
    categoria: producto.categoria,
    estado: producto.estado,
    enCarro: producto.enCarro,
    nota: producto.nota,
    catalogo: catalogo === null ? null : productoCatalogo(catalogo),
    propio:
      producto.propio === null
        ? null
        : {
            supermercado: producto.propio.supermercado,
            descripcion: producto.propio.descripcion,
            precio: producto.propio.precio,
            fotoUrl: producto.propio.fotoId === null ? null : `/api/fotos/${producto.propio.fotoId}`,
          },
    actualizadoPor: actualizadoPor === null ? null : actualizadoPor.nombre,
    actualizadoEn: producto.actualizadoEn.toISOString(),
  }),

  compra: ({ compra, finalizadaPor }: CompraDetalle): CompraVista => ({
    id: compra.id,
    supermercado: compra.supermercado,
    finalizadaPor: finalizadaPor === null ? null : finalizadaPor.nombre,
    finalizadaEn: compra.finalizadaEn.toISOString(),
    totalEstimado: compra.totalEstimado,
    lineas: compra.lineas.map((linea) => ({ nombre: linea.nombre, precioEstimado: linea.precioEstimado })),
  }),

  estadoCatalogo: (estado: EstadoSincronizacion): EstadoCatalogoVista => ({
    sincronizando: estado.sincronizando,
    productos: estado.productos,
    sincronizadoEn: estado.sincronizadoEn === null ? null : estado.sincronizadoEn.toISOString(),
  }),
};
