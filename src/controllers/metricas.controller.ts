// src/controllers/metricas.controller.ts

import { Response } from 'express';
import { MetricasService } from '../services/metricas.service';
import { AuthRequest } from '../types';

export class MetricasController {
  /**
   * Obtiene el dashboard completo de comunidad
   */
  static async getDashboardComunidad(req: AuthRequest, res: Response) {
    try {
      const dias = req.query.dias ? parseInt(req.query.dias as string) : 30;

      const [
        metricasHoy,
        metricasMes,
        usoPorInstalacion,
        asistenciaPorDia,
        vecinosFrecuentes,
        ocupacionPorHora,
        ingresosPorMetodoPago,
        paquetesMasVendidos,
      ] = await Promise.all([
        MetricasService.getMetricasHoy(),
        MetricasService.getMetricasMes(),
        MetricasService.getUsoPorInstalacion(dias),
        MetricasService.getAsistenciaPorDia(dias),
        MetricasService.getVecinosFrecuentes(10, dias),
        MetricasService.getOcupacionPorHora(dias),
        MetricasService.getIngresosPorMetodoPago(dias),
        MetricasService.getPaquetesMasVendidos(dias),
      ]);

      res.json({
        hoy: metricasHoy,
        mes: metricasMes,
        usoPorInstalacion,
        asistenciaPorDia,
        vecinosFrecuentes,
        ocupacionPorHora,
        ingresosPorMetodoPago,
        paquetesMasVendidos,
      });
    } catch (error) {
      console.error('Error al obtener dashboard de comunidad:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  }

  /**
   * Obtiene métricas de hoy
   */
  static async getMetricasHoy(req: AuthRequest, res: Response) {
    try {
      const metricas = await MetricasService.getMetricasHoy();
      res.json(metricas);
    } catch (error) {
      console.error('Error al obtener métricas de hoy:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  }

  /**
   * Obtiene métricas del mes
   */
  static async getMetricasMes(req: AuthRequest, res: Response) {
    try {
      const metricas = await MetricasService.getMetricasMes();
      res.json(metricas);
    } catch (error) {
      console.error('Error al obtener métricas del mes:', error);
      res.status(500).json({ error: 'Error al obtener métricas' });
    }
  }

  /**
   * Obtiene vecinos frecuentes
   */
  static async getVecinosFrecuentes(req: AuthRequest, res: Response) {
    try {
      const limite = req.query.limite ? parseInt(req.query.limite as string) : 10;
      const dias = req.query.dias ? parseInt(req.query.dias as string) : 30;

      const vecinos = await MetricasService.getVecinosFrecuentes(limite, dias);
      res.json(vecinos);
    } catch (error) {
      console.error('Error al obtener vecinos frecuentes:', error);
      res.status(500).json({ error: 'Error al obtener vecinos frecuentes' });
    }
  }
}
