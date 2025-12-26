// src/index.ts

import dotenv from 'dotenv';
import app from './app';
import { iniciarAutoCheckoutJob } from './jobs/auto-checkout.job';

dotenv.config();

const PORT = process.env.PORT || 3000;
console.log('[DEBUG] JWT_SECRET:', process.env.JWT_SECRET?.substring(0, 20) + '...');

app.listen(PORT, () => {
  console.log(`🏊 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);

  // Iniciar job de auto-checkout
  iniciarAutoCheckoutJob();
});
