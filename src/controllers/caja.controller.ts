// src/controllers/caja.controller.ts

import { Response } from 'express';
import { CajaService } from '../services/caja.service';
import { AuthRequest } from '../types';

export class CajaController {
  /**
   * Abre la caja del día
   */
  static async abrir(req: AuthRequest, res: Response) {
    try {
      const { fecha, saldoInicial } = req.body;

      if (saldoInicial === undefined || saldoInicial < 0) {
        return res.status(400).json({ error: 'Saldo inicial inválido' });
      }

      const fechaCaja = fecha ? new Date(fecha) : new Date();
      fechaCaja.setHours(0, 0, 0, 0);

      const caja = await CajaService.abrir({
        fecha: fechaCaja,
        saldoInicial,
        staffId: req.user!.id,
        ip: req.ip,
      });

      res.status(201).json(caja);
    } catch (error: any) {
      console.error('Error al abrir caja:', error);
      res.status(400).json({ error: error.message || 'Error al abrir caja' });
    }
  }

  /**
   * Cierra la caja del día
   */
  static async cerrar(req: AuthRequest, res: Response) {
    try {
      const { fecha, saldoDeclarado, observaciones } = req.body;

      if (saldoDeclarado === undefined || saldoDeclarado < 0) {
        return res.status(400).json({ error: 'Saldo declarado inválido' });
      }

      const fechaCaja = fecha ? new Date(fecha) : new Date();
      fechaCaja.setHours(0, 0, 0, 0);

      const caja = await CajaService.cerrar({
        fecha: fechaCaja,
        saldoDeclarado,
        observaciones,
        staffId: req.user!.id,
        ip: req.ip,
      });

      res.json(caja);
    } catch (error: any) {
      console.error('Error al cerrar caja:', error);
      res.status(400).json({ error: error.message || 'Error al cerrar caja' });
    }
  }

  /**
   * Obtiene la caja actual (abierta)
   */
  static async actual(req: AuthRequest, res: Response) {
    try {
      const caja = await CajaService.obtenerCajaActual();

      if (!caja) {
        return res.status(404).json({ error: 'No hay caja abierta' });
      }

      res.json(caja);
    } catch (error) {
      console.error('Error al obtener caja actual:', error);
      res.status(500).json({ error: 'Error al obtener caja actual' });
    }
  }

  /**
   * Obtiene el resumen de la caja de una fecha
   */
  static async resumen(req: AuthRequest, res: Response) {
    try {
      const { fecha } = req.query;

      const fechaCaja = fecha ? new Date(fecha as string) : new Date();
      fechaCaja.setHours(0, 0, 0, 0);

      const resumen = await CajaService.obtenerResumen(fechaCaja);

      if (!resumen) {
        return res.status(404).json({ error: 'No se encontró caja para esa fecha' });
      }

      res.json(resumen);
    } catch (error) {
      console.error('Error al obtener resumen:', error);
      res.status(500).json({ error: 'Error al obtener resumen' });
    }
  }
}
