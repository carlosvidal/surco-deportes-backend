// src/services/consumo.service.ts

import { PrismaClient, Instalacion } from '@prisma/client';
import { SaldoService } from './saldo.service';
import { AuditService } from './audit.service';
import { ConsumoActivo } from '../types';
import { TIEMPO_LIMITE_HORA } from '../utils/config';

const prisma = new PrismaClient();

export class ConsumoService {
  /**
   * Registra un check-in (entrada a instalación)
   */
  static async registrarCheckin(data: {
    vecinoDni: string;
    instalacion: Instalacion;
    carril?: number;
    staffId: number;
    ip?: string;
  }) {
    // Verificar que el vecino tenga saldo
    const tieneSaldo = await SaldoService.tieneSaldo(data.vecinoDni, 1);
    if (!tieneSaldo) {
      throw new Error('El vecino no tiene saldo suficiente');
    }

    // Verificar que no tenga un consumo activo (sin salida)
    const consumoActivo = await prisma.consumo.findFirst({
      where: {
        vecinoDni: data.vecinoDni,
        salidaAt: null,
        anulado: false,
      },
    });

    if (consumoActivo) {
      throw new Error('El vecino ya tiene un consumo activo');
    }

    // Si es piscina, verificar que el carril esté libre
    if (
      (data.instalacion === 'PISCINA_ADULTOS' || data.instalacion === 'PISCINA_NINOS') &&
      data.carril
    ) {
      const carrilOcupado = await prisma.consumo.findFirst({
        where: {
          instalacion: data.instalacion,
          carril: data.carril,
          salidaAt: null,
          anulado: false,
        },
      });

      if (carrilOcupado) {
        throw new Error('El carril está ocupado');
      }
    }

    // Crear el consumo
    const consumo = await prisma.consumo.create({
      data: {
        vecinoDni: data.vecinoDni,
        instalacion: data.instalacion,
        carril: data.carril,
        staffId: data.staffId,
      },
      include: {
        vecino: true,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'consumos',
      entidadId: consumo.id.toString(),
      accion: 'CHECKIN',
      datos: consumo,
      staffId: data.staffId,
      ip: data.ip,
    });

    return consumo;
  }

  /**
   * Registra un check-out (salida de instalación)
   */
  static async registrarCheckout(
    consumoId: number,
    staffId: number,
    auto: boolean = false,
    ip?: string
  ) {
    const consumo = await prisma.consumo.findUnique({
      where: { id: consumoId },
    });

    if (!consumo) {
      throw new Error('Consumo no encontrado');
    }

    if (consumo.salidaAt) {
      throw new Error('El consumo ya tiene salida registrada');
    }

    if (consumo.anulado) {
      throw new Error('El consumo está anulado');
    }

    const consumoActualizado = await prisma.consumo.update({
      where: { id: consumoId },
      data: {
        salidaAt: new Date(),
        salidaAuto: auto,
      },
      include: {
        vecino: true,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'consumos',
      entidadId: consumoId.toString(),
      accion: 'CHECKOUT',
      datos: { auto, consumo: consumoActualizado },
      staffId,
      ip,
    });

    return consumoActualizado;
  }

  /**
   * Anula un consumo (devuelve la hora al vecino)
   */
  static async anular(
    consumoId: number,
    motivo: string,
    staffId: number,
    ip?: string
  ) {
    const consumo = await prisma.consumo.findUnique({
      where: { id: consumoId },
    });

    if (!consumo) {
      throw new Error('Consumo no encontrado');
    }

    if (consumo.anulado) {
      throw new Error('El consumo ya está anulado');
    }

    const consumoAnulado = await prisma.consumo.update({
      where: { id: consumoId },
      data: {
        anulado: true,
        motivoAnul: motivo,
        salidaAt: consumo.salidaAt || new Date(), // Si no tenía salida, registrarla
      },
      include: {
        vecino: true,
      },
    });

    // Registrar en auditoría
    await AuditService.registrar({
      entidad: 'consumos',
      entidadId: consumoId.toString(),
      accion: 'ANULAR',
      datos: { motivo, consumo: consumoAnulado },
      staffId,
      ip,
    });

    return consumoAnulado;
  }

  /**
   * Obtiene todos los consumos activos (sin salida)
   */
  static async obtenerActivos(): Promise<ConsumoActivo[]> {
    const consumos = await prisma.consumo.findMany({
      where: {
        salidaAt: null,
        anulado: false,
      },
      include: {
        vecino: {
          select: {
            nombre: true,
            apellidos: true,
          },
        },
      },
      orderBy: {
        entradaAt: 'asc',
      },
    });

    const ahora = new Date();

    return consumos.map((consumo) => {
      const tiempoTranscurrido = Math.floor(
        (ahora.getTime() - consumo.entradaAt.getTime()) / 1000 / 60
      );
      const tiempoRestante = TIEMPO_LIMITE_HORA - tiempoTranscurrido;

      return {
        id: consumo.id,
        vecinoDni: consumo.vecinoDni,
        vecino: consumo.vecino,
        instalacion: consumo.instalacion,
        carril: consumo.carril,
        entradaAt: consumo.entradaAt,
        tiempoTranscurrido,
        tiempoRestante,
      };
    });
  }

  /**
   * Obtiene consumos activos por instalación
   */
  static async obtenerActivosPorInstalacion(instalacion: Instalacion) {
    const activos = await this.obtenerActivos();
    return activos.filter((c) => c.instalacion === instalacion);
  }

  /**
   * Proceso automático para cerrar consumos que excedieron el tiempo
   */
  static async cerrarConsumosPorTiempo(staffId: number) {
    const consumosVencidos = await prisma.consumo.findMany({
      where: {
        salidaAt: null,
        anulado: false,
        entradaAt: {
          lte: new Date(Date.now() - TIEMPO_LIMITE_HORA * 60 * 1000),
        },
      },
    });

    const cerrados = [];
    for (const consumo of consumosVencidos) {
      const cerrado = await this.registrarCheckout(consumo.id, staffId, true);
      cerrados.push(cerrado);
    }

    return cerrados;
  }

  /**
   * Obtiene consumos activos con alertas de tiempo
   */
  static async obtenerConsumosConAlertas() {
    const ALERTA_CRITICA = 5; // minutos
    const ALERTA_ADVERTENCIA = 15; // minutos

    const activos = await this.obtenerActivos();

    const criticos = activos.filter(
      (c) => c.tiempoRestante <= ALERTA_CRITICA && c.tiempoRestante > 0
    );

    const advertencias = activos.filter(
      (c) =>
        c.tiempoRestante > ALERTA_CRITICA &&
        c.tiempoRestante <= ALERTA_ADVERTENCIA
    );

    const vencidos = activos.filter((c) => c.tiempoRestante <= 0);

    return {
      criticos: criticos.sort((a, b) => a.tiempoRestante - b.tiempoRestante),
      advertencias: advertencias.sort(
        (a, b) => a.tiempoRestante - b.tiempoRestante
      ),
      vencidos: vencidos.sort((a, b) => a.tiempoRestante - b.tiempoRestante),
      total: criticos.length + advertencias.length + vencidos.length,
    };
  }
}
