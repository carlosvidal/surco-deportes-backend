// src/services/caja.service.ts

import { PrismaClient, MetodoPago } from '@prisma/client';
import { AuditService } from './audit.service';
import { ResumenCaja } from '../types';

const prisma = new PrismaClient();

export class CajaService {
  /**
   * Abre la caja del día
   */
  static async abrir(data: {
    fecha: Date;
    saldoInicial: number;
    staffId: number;
    ip?: string;
  }) {
    // Verificar que no exista una caja para esta fecha
    const cajaExistente = await prisma.caja.findUnique({
      where: { fecha: data.fecha },
    });

    if (cajaExistente) {
      throw new Error('Ya existe una caja para esta fecha');
    }

    const caja = await prisma.caja.create({
      data: {
        fecha: data.fecha,
        saldoInicial: data.saldoInicial,
        staffId: data.staffId,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'cajas',
      entidadId: caja.id.toString(),
      accion: 'ABRIR',
      datos: caja,
      staffId: data.staffId,
      ip: data.ip,
    });

    return caja;
  }

  /**
   * Obtiene el resumen de la caja del día
   */
  static async obtenerResumen(fecha: Date): Promise<ResumenCaja | null> {
    const caja = await prisma.caja.findUnique({
      where: { fecha },
      include: {
        compras: {
          where: { anulada: false },
          include: {
            vecino: {
              select: {
                nombre: true,
                apellidos: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!caja) {
      return null;
    }

    // Calcular totales por método de pago
    const ventasEfectivo = caja.compras
      .filter((c) => c.metodoPago === MetodoPago.EFECTIVO)
      .reduce((sum, c) => sum + Number(c.monto), 0);

    const ventasYape = caja.compras
      .filter((c) => c.metodoPago === MetodoPago.YAPE)
      .reduce((sum, c) => sum + Number(c.monto), 0);

    const ventasPlin = caja.compras
      .filter((c) => c.metodoPago === MetodoPago.PLIN)
      .reduce((sum, c) => sum + Number(c.monto), 0);

    const ventasTransferencia = caja.compras
      .filter((c) => c.metodoPago === MetodoPago.TRANSFERENCIA)
      .reduce((sum, c) => sum + Number(c.monto), 0);

    const totalVentas = ventasEfectivo + ventasYape + ventasPlin + ventasTransferencia;
    const efectivoEsperado = Number(caja.saldoInicial) + ventasEfectivo;

    // Formatear transacciones
    const transacciones = caja.compras.map((compra) => ({
      hora: compra.createdAt.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      vecino: `${compra.vecino.nombre} ${compra.vecino.apellidos}`,
      horas: compra.horas,
      monto: Number(compra.monto),
      metodoPago: compra.metodoPago,
    }));

    return {
      fecha: caja.fecha,
      saldoInicial: Number(caja.saldoInicial),
      totalVentas,
      ventasEfectivo,
      ventasYape,
      ventasPlin,
      ventasTransferencia,
      efectivoEsperado,
      transacciones,
    };
  }

  /**
   * Cierra la caja del día
   */
  static async cerrar(data: {
    fecha: Date;
    saldoDeclarado: number;
    observaciones?: string;
    staffId: number;
    ip?: string;
  }) {
    const caja = await prisma.caja.findUnique({
      where: { fecha: data.fecha },
    });

    if (!caja) {
      throw new Error('No se encontró la caja para esta fecha');
    }

    if (caja.cerradaAt) {
      throw new Error('La caja ya está cerrada');
    }

    // Obtener resumen para calcular saldo final
    const resumen = await this.obtenerResumen(data.fecha);
    if (!resumen) {
      throw new Error('No se pudo obtener el resumen de la caja');
    }

    const saldoFinal = resumen.efectivoEsperado;
    const diferencia = data.saldoDeclarado - saldoFinal;

    const cajaCerrada = await prisma.caja.update({
      where: { fecha: data.fecha },
      data: {
        saldoFinal,
        saldoDeclarado: data.saldoDeclarado,
        diferencia,
        observaciones: data.observaciones,
        cerradaAt: new Date(),
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'cajas',
      entidadId: caja.id.toString(),
      accion: 'CERRAR',
      datos: {
        saldoFinal,
        saldoDeclarado: data.saldoDeclarado,
        diferencia,
        observaciones: data.observaciones,
      },
      staffId: data.staffId,
      ip: data.ip,
    });

    return cajaCerrada;
  }

  /**
   * Obtiene la caja de hoy o null si no existe
   */
  static async obtenerCajaHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return await prisma.caja.findUnique({
      where: { fecha: hoy },
    });
  }

  /**
   * Obtiene la caja actual (abierta y no cerrada)
   */
  static async obtenerCajaActual() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const caja = await prisma.caja.findUnique({
      where: { fecha: hoy },
    });

    if (!caja || caja.cerradaAt) {
      return null;
    }

    return caja;
  }
}
