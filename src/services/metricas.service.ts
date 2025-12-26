// src/services/metricas.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MetricasService {
  /**
   * Obtiene las métricas del día actual
   */
  static async getMetricasHoy() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Vecinos únicos que asistieron hoy
    const vecinosActivosHoy = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: hoy,
          lt: manana,
        },
        anulado: false,
      },
      select: { vecinoDni: true },
      distinct: ['vecinoDni'],
    });

    // Horas consumidas hoy
    const consumosHoy = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: hoy,
          lt: manana,
        },
        anulado: false,
      },
    });

    const horasConsumidasHoy = consumosHoy.reduce((total, consumo) => {
      if (consumo.salidaAt) {
        const horas = (new Date(consumo.salidaAt).getTime() - new Date(consumo.entradaAt).getTime()) / (1000 * 60 * 60);
        return total + Math.min(horas, 1); // Máximo 1 hora por consumo
      }
      return total + 1; // Si no ha salido, cuenta como 1 hora
    }, 0);

    // Ingresos del día
    const comprasHoy = await prisma.compra.findMany({
      where: {
        createdAt: {
          gte: hoy,
          lt: manana,
        },
        anulada: false,
      },
    });

    const ingresosHoy = comprasHoy.reduce((total, compra) => total + Number(compra.monto), 0);

    // Ocupación promedio (consumos activos / carriles totales)
    const consumosActivos = await prisma.consumo.count({
      where: {
        entradaAt: {
          gte: hoy,
          lt: manana,
        },
        salidaAt: null,
        anulado: false,
      },
    });

    const totalCarriles = 13; // 8 adultos + 5 niños
    const ocupacionPromedio = (consumosActivos / totalCarriles) * 100;

    return {
      vecinosActivosHoy: vecinosActivosHoy.length,
      horasConsumidasHoy: Math.round(horasConsumidasHoy * 10) / 10,
      ingresosHoy,
      ocupacionPromedio: Math.round(ocupacionPromedio * 10) / 10,
    };
  }

  /**
   * Obtiene las métricas del mes actual
   */
  static async getMetricasMes() {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const finMes = new Date(inicioMes);
    finMes.setMonth(finMes.getMonth() + 1);

    // Vecinos únicos del mes
    const vecinosUnicosMes = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: inicioMes,
          lt: finMes,
        },
        anulado: false,
      },
      select: { vecinoDni: true },
      distinct: ['vecinoDni'],
    });

    // Horas vendidas
    const comprasMes = await prisma.compra.findMany({
      where: {
        createdAt: {
          gte: inicioMes,
          lt: finMes,
        },
        anulada: false,
      },
    });

    const horasVendidasMes = comprasMes.reduce((total, compra) => total + compra.horas, 0);
    const ingresosMes = comprasMes.reduce((total, compra) => total + Number(compra.monto), 0);

    // Horas consumidas
    const consumosMes = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: inicioMes,
          lt: finMes,
        },
        anulado: false,
      },
    });

    const horasConsumidasMes = consumosMes.reduce((total, consumo) => {
      if (consumo.salidaAt) {
        const horas = (new Date(consumo.salidaAt).getTime() - new Date(consumo.entradaAt).getTime()) / (1000 * 60 * 60);
        return total + Math.min(horas, 1);
      }
      return total + 1;
    }, 0);

    const ticketPromedio = vecinosUnicosMes.length > 0 ? ingresosMes / vecinosUnicosMes.length : 0;

    return {
      vecinosUnicosMes: vecinosUnicosMes.length,
      horasVendidasMes,
      horasConsumidasMes: Math.round(horasConsumidasMes * 10) / 10,
      ingresosMes,
      ticketPromedio: Math.round(ticketPromedio * 100) / 100,
    };
  }

  /**
   * Obtiene el uso por instalación
   */
  static async getUsoPorInstalacion(dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const consumos = await prisma.consumo.groupBy({
      by: ['instalacion'],
      where: {
        entradaAt: {
          gte: fechaInicio,
        },
        anulado: false,
      },
      _count: {
        id: true,
      },
    });

    return consumos.map((item) => ({
      instalacion: item.instalacion,
      cantidad: item._count.id,
    }));
  }

  /**
   * Obtiene la asistencia por día de la semana
   */
  static async getAsistenciaPorDia(dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const consumos = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: fechaInicio,
        },
        anulado: false,
      },
      select: {
        entradaAt: true,
      },
    });

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const conteo: Record<string, number> = {
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sábado: 0,
      Domingo: 0,
    };

    consumos.forEach((consumo) => {
      const dia = diasSemana[new Date(consumo.entradaAt).getDay()];
      conteo[dia]++;
    });

    return Object.entries(conteo).map(([dia, cantidad]) => ({
      dia,
      cantidad,
    }));
  }

  /**
   * Obtiene los vecinos más frecuentes
   */
  static async getVecinosFrecuentes(limite: number = 10, dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const frecuencia = await prisma.consumo.groupBy({
      by: ['vecinoDni'],
      where: {
        entradaAt: {
          gte: fechaInicio,
        },
        anulado: false,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limite,
    });

    // Obtener información de los vecinos
    const dnis = frecuencia.map((f) => f.vecinoDni);
    const vecinos = await prisma.vecino.findMany({
      where: {
        dni: {
          in: dnis,
        },
      },
      select: {
        dni: true,
        nombre: true,
        apellidos: true,
        esSurco: true,
      },
    });

    return frecuencia.map((f) => {
      const vecino = vecinos.find((v) => v.dni === f.vecinoDni);
      return {
        dni: f.vecinoDni,
        nombre: vecino ? `${vecino.nombre} ${vecino.apellidos}` : 'Desconocido',
        esSurco: vecino?.esSurco || false,
        visitas: f._count.id,
      };
    });
  }

  /**
   * Obtiene ocupación por franja horaria
   */
  static async getOcupacionPorHora(dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const consumos = await prisma.consumo.findMany({
      where: {
        entradaAt: {
          gte: fechaInicio,
        },
        anulado: false,
      },
      select: {
        entradaAt: true,
      },
    });

    const franjas: Record<string, number> = {};
    for (let hora = 6; hora <= 21; hora++) {
      franjas[`${hora}:00`] = 0;
    }

    consumos.forEach((consumo) => {
      const hora = new Date(consumo.entradaAt).getHours();
      if (hora >= 6 && hora <= 21) {
        franjas[`${hora}:00`]++;
      }
    });

    return Object.entries(franjas).map(([hora, cantidad]) => ({
      hora,
      cantidad,
    }));
  }

  /**
   * Obtiene ingresos por método de pago
   */
  static async getIngresosPorMetodoPago(dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const compras = await prisma.compra.groupBy({
      by: ['metodoPago'],
      where: {
        createdAt: {
          gte: fechaInicio,
        },
        anulada: false,
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true,
      },
    });

    return compras.map((item) => ({
      metodoPago: item.metodoPago,
      monto: Number(item._sum.monto || 0),
      cantidad: item._count.id,
    }));
  }

  /**
   * Obtiene paquetes más vendidos
   */
  static async getPaquetesMasVendidos(dias: number = 30) {
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias);
    fechaInicio.setHours(0, 0, 0, 0);

    const paquetes = await prisma.compra.groupBy({
      by: ['horas'],
      where: {
        createdAt: {
          gte: fechaInicio,
        },
        anulada: false,
      },
      _count: {
        id: true,
      },
      _sum: {
        monto: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return paquetes.map((item) => ({
      paquete: `${item.horas} ${item.horas === 1 ? 'hora' : 'horas'}`,
      cantidad: item._count.id,
      ingresos: Number(item._sum.monto || 0),
    }));
  }
}
