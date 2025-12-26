// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuditService } from '../services/audit.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

export class AuthController {
  /**
   * Login de usuario
   */
  static async login(req: Request, res: Response) {
    try {
      const { usuario, password } = req.body;

      if (!usuario || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      }

      // Buscar usuario
      const staff = await prisma.staff.findUnique({
        where: { usuario },
      });

      if (!staff || !staff.activo) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(password, staff.password);
      if (!passwordValida) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generar token
      console.log('[AUTH] Generando token con secret:', JWT_SECRET.substring(0, 20) + '...');
      const token = jwt.sign(
        {
          id: staff.id,
          usuario: staff.usuario,
          rol: staff.rol,
        },
        JWT_SECRET,
        { expiresIn: '12h' }
      );

      // Registrar login en auditoría
      await AuditService.registrar({
        entidad: 'staff',
        entidadId: staff.id.toString(),
        accion: 'LOGIN',
        staffId: staff.id,
        ip: req.ip,
      });

      res.json({
        token,
        staff: {
          id: staff.id,
          nombre: staff.nombre,
          usuario: staff.usuario,
          rol: staff.rol,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }

  /**
   * Verifica el token actual
   */
  static async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;

      const staff = await prisma.staff.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          nombre: true,
          usuario: true,
          rol: true,
          activo: true,
        },
      });

      if (!staff || !staff.activo) {
        return res.status(401).json({ error: 'Usuario no válido' });
      }

      res.json({ staff });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
}
