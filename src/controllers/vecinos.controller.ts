// src/controllers/vecinos.controller.ts

import { Response } from 'express';
import { VecinoService } from '../services/vecino.service';
import { SaldoService } from '../services/saldo.service';
import { AuthRequest } from '../types';
import { AuditService } from '../services/audit.service';

export class VecinosController {
  /**
   * Buscar vecino por DNI
   */
  static async buscarPorDni(req: AuthRequest, res: Response) {
    try {
      const { dni } = req.params;

      const vecino = await VecinoService.buscarPorDni(dni);

      if (!vecino) {
        return res.status(404).json({ error: 'Vecino no encontrado' });
      }

      res.json(vecino);
    } catch (error) {
      console.error('Error al buscar vecino:', error);
      res.status(500).json({ error: 'Error al buscar vecino' });
    }
  }

  /**
   * Crear nuevo vecino
   */
  static async crear(req: AuthRequest, res: Response) {
    try {
      const vecino = await VecinoService.crear(req.body);

      // Registrar en auditoría
      await AuditService.registrar({
        entidad: 'vecinos',
        entidadId: vecino.dni,
        accion: 'CREATE',
        datos: vecino,
        staffId: req.user?.id,
        ip: req.ip,
      });

      res.status(201).json(vecino);
    } catch (error: any) {
      console.error('Error al crear vecino:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'El DNI ya está registrado' });
      }
      res.status(500).json({ error: 'Error al crear vecino' });
    }
  }

  /**
   * Actualizar datos de vecino
   */
  static async actualizar(req: AuthRequest, res: Response) {
    try {
      const { dni } = req.params;

      const vecino = await VecinoService.actualizar(dni, req.body);

      // Registrar en auditoría
      await AuditService.registrar({
        entidad: 'vecinos',
        entidadId: dni,
        accion: 'UPDATE',
        datos: req.body,
        staffId: req.user?.id,
        ip: req.ip,
      });

      res.json(vecino);
    } catch (error) {
      console.error('Error al actualizar vecino:', error);
      res.status(500).json({ error: 'Error al actualizar vecino' });
    }
  }

  /**
   * Obtener historial de vecino
   */
  static async historial(req: AuthRequest, res: Response) {
    try {
      const { dni } = req.params;

      const historial = await SaldoService.obtenerHistorial(dni);

      res.json(historial);
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }

  /**
   * Buscar vecinos por nombre (si q está vacío, devuelve todos)
   */
  static async buscar(req: AuthRequest, res: Response) {
    try {
      const { q } = req.query;
      const query = typeof q === 'string' ? q : '';

      const vecinos = await VecinoService.buscar(query);

      res.json(vecinos);
    } catch (error) {
      console.error('Error al buscar vecinos:', error);
      res.status(500).json({ error: 'Error al buscar vecinos' });
    }
  }

  /**
   * Obtener familia de vecino
   */
  static async familia(req: AuthRequest, res: Response) {
    try {
      const { dni } = req.params;

      const familia = await VecinoService.obtenerFamilia(dni);

      res.json(familia);
    } catch (error) {
      console.error('Error al obtener familia:', error);
      res.status(500).json({ error: 'Error al obtener familia' });
    }
  }
}
