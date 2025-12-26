// src/controllers/compras.controller.ts

import { Response } from 'express';
import { CompraService } from '../services/compra.service';
import { CajaService } from '../services/caja.service';
import { AuthRequest } from '../types';

export class ComprasController {
  /**
   * Registrar una nueva venta de paquete
   */
  static async registrarVenta(req: AuthRequest, res: Response) {
    try {
      const { vecinoDni, horas, metodoPago, referencia } = req.body;

      if (!vecinoDni || !horas || !metodoPago) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      // Validar que las horas sean un paquete válido
      const paquetesValidos = [1, 4, 8, 12];
      if (!paquetesValidos.includes(horas)) {
        return res.status(400).json({ error: 'Paquete de horas inválido' });
      }

      // Obtener caja actual para asociar la venta
      const cajaActual = await CajaService.obtenerCajaActual();
      const cajaId = cajaActual?.id;

      const compra = await CompraService.registrarVenta({
        vecinoDni,
        horas,
        metodoPago,
        referencia,
        staffId: req.user!.id,
        cajaId,
        ip: req.ip,
      });

      res.status(201).json(compra);
    } catch (error: any) {
      console.error('Error al registrar venta:', error);
      res.status(400).json({ error: error.message || 'Error al registrar venta' });
    }
  }

  /**
   * Obtener detalle de una compra
   */
  static async obtenerPorId(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const compra = await CompraService.obtenerPorId(parseInt(id));

      if (!compra) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      res.json(compra);
    } catch (error) {
      console.error('Error al obtener compra:', error);
      res.status(500).json({ error: 'Error al obtener compra' });
    }
  }

  /**
   * Anular una compra
   */
  static async anular(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      if (!motivo) {
        return res.status(400).json({ error: 'El motivo es requerido' });
      }

      const compra = await CompraService.anular(
        parseInt(id),
        motivo,
        req.user!.id,
        req.ip
      );

      res.json(compra);
    } catch (error: any) {
      console.error('Error al anular compra:', error);
      res.status(400).json({ error: error.message || 'Error al anular compra' });
    }
  }
}
