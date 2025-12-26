// src/controllers/consumos.controller.ts

import { Response } from 'express';
import { ConsumoService } from '../services/consumo.service';
import { AuthRequest } from '../types';

export class ConsumosController {
  /**
   * Registrar check-in
   */
  static async checkin(req: AuthRequest, res: Response) {
    try {
      const { vecinoDni, instalacion, carril } = req.body;

      if (!vecinoDni || !instalacion) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const consumo = await ConsumoService.registrarCheckin({
        vecinoDni,
        instalacion,
        carril,
        staffId: req.user!.id,
        ip: req.ip,
      });

      res.status(201).json(consumo);
    } catch (error: any) {
      console.error('Error en check-in:', error);
      res.status(400).json({ error: error.message || 'Error al registrar entrada' });
    }
  }

  /**
   * Registrar check-out
   */
  static async checkout(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const consumo = await ConsumoService.registrarCheckout(
        parseInt(id),
        req.user!.id,
        false,
        req.ip
      );

      res.json(consumo);
    } catch (error: any) {
      console.error('Error en check-out:', error);
      res.status(400).json({ error: error.message || 'Error al registrar salida' });
    }
  }

  /**
   * Anular consumo
   */
  static async anular(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({ error: 'El motivo es requerido' });
      }

      const consumo = await ConsumoService.anular(
        parseInt(id),
        motivo,
        req.user!.id,
        req.ip
      );

      res.json(consumo);
    } catch (error: any) {
      console.error('Error al anular consumo:', error);
      res.status(400).json({ error: error.message || 'Error al anular consumo' });
    }
  }

  /**
   * Obtener consumos activos (dashboard)
   */
  static async activos(req: AuthRequest, res: Response) {
    try {
      const consumos = await ConsumoService.obtenerActivos();

      res.json(consumos);
    } catch (error) {
      console.error('Error al obtener consumos activos:', error);
      res.status(500).json({ error: 'Error al obtener consumos activos' });
    }
  }

  /**
   * Obtener consumos activos por instalación
   */
  static async activosPorInstalacion(req: AuthRequest, res: Response) {
    try {
      const { instalacion } = req.params;

      const consumos = await ConsumoService.obtenerActivosPorInstalacion(
        instalacion as any
      );

      res.json(consumos);
    } catch (error) {
      console.error('Error al obtener consumos:', error);
      res.status(500).json({ error: 'Error al obtener consumos' });
    }
  }

  /**
   * Cerrar consumos vencidos automáticamente
   */
  static async cerrarVencidos(req: AuthRequest, res: Response) {
    try {
      const cerrados = await ConsumoService.cerrarConsumosPorTiempo(req.user!.id);

      res.json({
        message: `Se cerraron ${cerrados.length} consumos`,
        cerrados,
      });
    } catch (error) {
      console.error('Error al cerrar consumos vencidos:', error);
      res.status(500).json({ error: 'Error al cerrar consumos vencidos' });
    }
  }

  /**
   * Obtener consumos con alertas de tiempo
   */
  static async obtenerAlertas(req: AuthRequest, res: Response) {
    try {
      const alertas = await ConsumoService.obtenerConsumosConAlertas();

      res.json(alertas);
    } catch (error) {
      console.error('Error al obtener alertas:', error);
      res.status(500).json({ error: 'Error al obtener alertas' });
    }
  }
}
