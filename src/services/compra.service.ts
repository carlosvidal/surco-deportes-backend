// src/services/compra.service.ts

import { PrismaClient, MetodoPago } from '@prisma/client';
import { calcularPrecio } from '../utils/config';
import { AuditService } from './audit.service';

const prisma = new PrismaClient();

export class CompraService {
  /**
   * Registra una nueva compra de paquete de horas
   */
  static async registrarVenta(data: {
    vecinoDni: string;
    horas: number;
    metodoPago: MetodoPago;
    referencia?: string;
    staffId: number;
    cajaId?: number;
    ip?: string;
  }) {
    // Obtener datos del vecino para calcular precio
    const vecino = await prisma.vecino.findUnique({
      where: { dni: data.vecinoDni },
    });

    if (!vecino) {
      throw new Error('Vecino no encontrado');
    }

    // Calcular el monto según tarifa
    const monto = calcularPrecio(data.horas, vecino.esSurco);

    // Crear la compra
    const compra = await prisma.compra.create({
      data: {
        vecinoDni: data.vecinoDni,
        horas: data.horas,
        monto,
        metodoPago: data.metodoPago,
        referencia: data.referencia,
        staffId: data.staffId,
        cajaId: data.cajaId,
      },
      include: {
        vecino: true,
        staff: true,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'compras',
      entidadId: compra.id.toString(),
      accion: 'CREATE',
      datos: compra,
      staffId: data.staffId,
      ip: data.ip,
    });

    return compra;
  }

  /**
   * Anula una compra (no se borra, se marca como anulada)
   */
  static async anular(
    compraId: number,
    motivo: string,
    staffId: number,
    ip?: string
  ) {
    const compra = await prisma.compra.findUnique({
      where: { id: compraId },
    });

    if (!compra) {
      throw new Error('Compra no encontrada');
    }

    if (compra.anulada) {
      throw new Error('La compra ya está anulada');
    }

    const compraAnulada = await prisma.compra.update({
      where: { id: compraId },
      data: {
        anulada: true,
        motivoAnul: motivo,
      },
      include: {
        vecino: true,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'compras',
      entidadId: compraId.toString(),
      accion: 'ANULAR',
      datos: { motivo, compraAnulada },
      staffId,
      ip,
    });

    return compraAnulada;
  }

  /**
   * Obtiene el detalle de una compra
   */
  static async obtenerPorId(compraId: number) {
    return await prisma.compra.findUnique({
      where: { id: compraId },
      include: {
        vecino: true,
        staff: true,
        caja: true,
      },
    });
  }

  /**
   * Lista compras por vecino
   */
  static async listarPorVecino(vecinoDni: string) {
    return await prisma.compra.findMany({
      where: { vecinoDni },
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: { nombre: true },
        },
      },
    });
  }
}
