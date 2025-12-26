// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Errores de Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Error de base de datos',
      message: err.message,
    });
  }

  // Errores de validación
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message,
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
  });
};
