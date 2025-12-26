// src/jobs/auto-checkout.job.ts

import cron from 'node-cron';
import { ConsumoService } from '../services/consumo.service';

const STAFF_SISTEMA_ID = 1; // ID del admin/sistema para registros automáticos

export function iniciarAutoCheckoutJob() {
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[AUTO-CHECKOUT] Ejecutando verificación de consumos vencidos...');

      const consumosCerrados = await ConsumoService.cerrarConsumosPorTiempo(
        STAFF_SISTEMA_ID
      );

      if (consumosCerrados.length > 0) {
        console.log(
          `[AUTO-CHECKOUT] ✅ Se cerraron ${consumosCerrados.length} consumo(s) vencido(s):`
        );
        consumosCerrados.forEach((consumo) => {
          console.log(
            `  - ID: ${consumo.id} | Vecino: ${consumo.vecinoDni} | Instalación: ${consumo.instalacion}${consumo.carril ? ` C${consumo.carril}` : ''}`
          );
        });
      } else {
        console.log('[AUTO-CHECKOUT] No hay consumos vencidos');
      }
    } catch (error) {
      console.error('[AUTO-CHECKOUT] ❌ Error al ejecutar auto-checkout:', error);
    }
  });

  console.log('🤖 Auto-checkout job iniciado (ejecuta cada 5 minutos)');
}
