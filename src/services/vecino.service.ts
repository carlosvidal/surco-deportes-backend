// src/services/vecino.service.ts

import { PrismaClient, Vecino } from '@prisma/client';
import { SaldoService } from './saldo.service';
import { VecinoConSaldo } from '../types';

const prisma = new PrismaClient();

export class VecinoService {
  /**
   * Busca un vecino por DNI e incluye su saldo calculado
   */
  static async buscarPorDni(dni: string): Promise<VecinoConSaldo | null> {
    const vecino = await prisma.vecino.findUnique({
      where: { dni },
    });

    if (!vecino) {
      return null;
    }

    const { saldo, horasCompradas, horasConsumidas } = await SaldoService.calcularSaldo(dni);

    return {
      ...vecino,
      saldo,
      horasCompradas,
      horasConsumidas,
    };
  }

  /**
   * Crea un nuevo vecino
   */
  static async crear(data: {
    dni: string;
    nombre: string;
    apellidos: string;
    fechaNacimiento?: Date;
    telefono?: string;
    email?: string;
    distrito: string;
    esSurco: boolean;
    contactoEmergencia?: string;
    telefonoEmergencia?: string;
  }): Promise<Vecino> {
    return await prisma.vecino.create({
      data,
    });
  }

  /**
   * Actualiza los datos de un vecino
   */
  static async actualizar(
    dni: string,
    data: {
      nombre?: string;
      apellidos?: string;
      fechaNacimiento?: Date;
      telefono?: string;
      email?: string;
      distrito?: string;
      esSurco?: boolean;
      contactoEmergencia?: string;
      telefonoEmergencia?: string;
    }
  ): Promise<Vecino> {
    return await prisma.vecino.update({
      where: { dni },
      data,
    });
  }

  /**
   * Lista todos los vecinos activos
   */
  static async listar(limit: number = 50, offset: number = 0) {
    const [vecinos, total] = await Promise.all([
      prisma.vecino.findMany({
        where: { activo: true },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vecino.count({
        where: { activo: true },
      }),
    ]);

    return {
      vecinos,
      total,
      limit,
      offset,
    };
  }

  /**
   * Busca vecinos por nombre o apellido (con saldo)
   */
  static async buscar(query: string) {
    const vecinos = await prisma.vecino.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { apellidos: { contains: query, mode: 'insensitive' } },
          { dni: { contains: query } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // Agregar saldo a cada vecino
    const vecinosConSaldo = await Promise.all(
      vecinos.map(async (vecino) => {
        const saldo = await SaldoService.calcularSaldo(vecino.dni);
        return {
          ...vecino,
          saldo: saldo.saldo,
          horasCompradas: saldo.horasCompradas,
          horasConsumidas: saldo.horasConsumidas,
        };
      })
    );

    return vecinosConSaldo;
  }

  /**
   * Obtiene la familia de un vecino
   */
  static async obtenerFamilia(dni: string) {
    const [comoTitular, comoMiembro] = await Promise.all([
      prisma.familia.findMany({
        where: { titularDni: dni },
        include: {
          miembro: true,
        },
      }),
      prisma.familia.findMany({
        where: { miembroDni: dni },
        include: {
          titular: true,
        },
      }),
    ]);

    return {
      dependientes: comoTitular,
      titular: comoMiembro.length > 0 ? comoMiembro[0].titular : null,
    };
  }
}
