// src/services/saldo.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SaldoService {
  /**
   * Calcula el saldo de horas de un vecino
   * Saldo = Compras (no anuladas) - Consumos (no anulados)
   */
  static async calcularSaldo(vecinoDni: string): Promise<{
    saldo: number;
    horasCompradas: number;
    horasConsumidas: number;
  }> {
    // Obtener total de horas compradas (no anuladas)
    const compras = await prisma.compra.aggregate({
      where: {
        vecinoDni,
        anulada: false,
      },
      _sum: {
        horas: true,
      },
    });

    // Obtener total de horas consumidas (no anuladas)
    const consumos = await prisma.consumo.count({
      where: {
        vecinoDni,
        anulado: false,
      },
    });

    const horasCompradas = compras._sum.horas || 0;
    const horasConsumidas = consumos;
    const saldo = horasCompradas - horasConsumidas;

    return {
      saldo,
      horasCompradas,
      horasConsumidas,
    };
  }

  /**
   * Verifica si un vecino tiene saldo suficiente
   */
  static async tieneSaldo(vecinoDni: string, horasRequeridas: number = 1): Promise<boolean> {
    const { saldo } = await this.calcularSaldo(vecinoDni);
    return saldo >= horasRequeridas;
  }

  /**
   * Obtiene el historial completo de compras y consumos de un vecino
   */
  static async obtenerHistorial(vecinoDni: string) {
    const [compras, consumos] = await Promise.all([
      prisma.compra.findMany({
        where: { vecinoDni },
        orderBy: { createdAt: 'desc' },
        include: {
          staff: {
            select: { nombre: true },
          },
        },
      }),
      prisma.consumo.findMany({
        where: { vecinoDni },
        orderBy: { entradaAt: 'desc' },
        include: {
          staff: {
            select: { nombre: true },
          },
        },
      }),
    ]);

    return {
      compras,
      consumos,
    };
  }
}
