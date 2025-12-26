// src/routes/index.ts

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

// Controllers
import { AuthController } from '../controllers/auth.controller';
import { VecinosController } from '../controllers/vecinos.controller';
import { ConsumosController } from '../controllers/consumos.controller';
import { ComprasController } from '../controllers/compras.controller';
import { CajaController } from '../controllers/caja.controller';
import { MetricasController } from '../controllers/metricas.controller';

const router = Router();

// ==================== AUTH ====================
router.post('/auth/login', AuthController.login);
router.get('/auth/verify', AuthController.verify);

// ==================== VECINOS ====================
router.get('/vecinos/buscar', authMiddleware, VecinosController.buscar);
router.get('/vecinos/:dni', authMiddleware, VecinosController.buscarPorDni);
router.post('/vecinos', authMiddleware, VecinosController.crear);
router.put('/vecinos/:dni', authMiddleware, VecinosController.actualizar);
router.get('/vecinos/:dni/historial', authMiddleware, VecinosController.historial);
router.get('/vecinos/:dni/familia', authMiddleware, VecinosController.familia);

// ==================== CONSUMOS ====================
router.post('/consumos/checkin', authMiddleware, ConsumosController.checkin);
router.put('/consumos/:id/checkout', authMiddleware, ConsumosController.checkout);
router.post('/consumos/:id/anular', authMiddleware, ConsumosController.anular);
router.get('/consumos/activos', authMiddleware, ConsumosController.activos);
router.get('/consumos/alertas', authMiddleware, ConsumosController.obtenerAlertas);
router.get('/consumos/activos/:instalacion', authMiddleware, ConsumosController.activosPorInstalacion);
router.post('/consumos/cerrar-vencidos', authMiddleware, ConsumosController.cerrarVencidos);

// ==================== COMPRAS ====================
router.post('/compras', authMiddleware, ComprasController.registrarVenta);
router.get('/compras/:id', authMiddleware, ComprasController.obtenerPorId);
router.post('/compras/:id/anular', authMiddleware, ComprasController.anular);

// ==================== CAJA ====================
router.post('/caja/abrir', authMiddleware, CajaController.abrir);
router.post('/caja/cerrar', authMiddleware, CajaController.cerrar);
router.get('/caja/actual', authMiddleware, CajaController.actual);
router.get('/caja/resumen', authMiddleware, CajaController.resumen);

// ==================== MÉTRICAS ====================
router.get('/metricas/dashboard', authMiddleware, MetricasController.getDashboardComunidad);
router.get('/metricas/hoy', authMiddleware, MetricasController.getMetricasHoy);
router.get('/metricas/mes', authMiddleware, MetricasController.getMetricasMes);
router.get('/metricas/vecinos-frecuentes', authMiddleware, MetricasController.getVecinosFrecuentes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
