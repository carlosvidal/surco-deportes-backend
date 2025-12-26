// src/services/audit.service.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   */
  static async registrar(data: {
    entidad: string;
    entidadId: string;
    accion: string;
    datos?: any;
    staffId?: number;
    ip?: string;
  }) {
    return await prisma.auditLog.create({
      data: {
        entidad: data.entidad,
        entidadId: data.entidadId,
        accion: data.accion,
        datos: data.datos || {},
        staffId: data.staffId,
        ip: data.ip,
      },
    });
  }

  /**
   * Obtiene el log de auditoría con filtros opcionales
   */
  static async obtenerLog(params: {
    entidad?: string;
    entidadId?: string;
    staffId?: number;
    desde?: Date;
    hasta?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.entidad) where.entidad = params.entidad;
    if (params.entidadId) where.entidadId = params.entidadId;
    if (params.staffId) where.staffId = params.staffId;

    if (params.desde || params.hasta) {
      where.createdAt = {};
      if (params.desde) where.createdAt.gte = params.desde;
      if (params.hasta) where.createdAt.lte = params.hasta;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: params.limit || 50,
      offset: params.offset || 0,
    };
  }
}
