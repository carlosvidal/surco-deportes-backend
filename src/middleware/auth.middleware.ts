// src/middleware/auth.middleware.ts

import dotenv from 'dotenv';
dotenv.config();

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-change-in-production';

export interface JwtPayload {
  id: number;
  usuario: string;
  rol: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    console.log('[MIDDLEWARE] Verificando token con secret:', JWT_SECRET.substring(0, 20) + '...');
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('Error verificando token:', error.message);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos suficientes' });
    }

    next();
  };
};
