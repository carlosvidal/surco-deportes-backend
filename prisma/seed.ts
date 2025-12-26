// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear staff de prueba
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminMunicipal = await prisma.staff.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: {
      nombre: 'Administrador Municipal',
      usuario: 'admin',
      password: hashedPassword,
      rol: 'ADMIN_MUNICIPAL',
    },
  });

  const recepcionista = await prisma.staff.upsert({
    where: { usuario: 'maria.garcia' },
    update: {},
    create: {
      nombre: 'María García',
      usuario: 'maria.garcia',
      password: await bcrypt.hash('recepcion123', 10),
      rol: 'RECEPCION',
    },
  });

  console.log('✅ Staff creado:', {
    adminMunicipal: adminMunicipal.usuario,
    recepcionista: recepcionista.usuario,
  });

  // Crear vecinos de prueba
  const vecino1 = await prisma.vecino.upsert({
    where: { dni: '12345678' },
    update: {},
    create: {
      dni: '12345678',
      nombre: 'Carlos',
      apellidos: 'Mendoza Torres',
      telefono: '999888777',
      email: 'carlos@example.com',
      distrito: 'Santiago de Surco',
      esSurco: true,
      contactoEmergencia: 'Ana Mendoza',
      telefonoEmergencia: '987654321',
    },
  });

  const vecino2 = await prisma.vecino.upsert({
    where: { dni: '87654321' },
    update: {},
    create: {
      dni: '87654321',
      nombre: 'María',
      apellidos: 'López García',
      telefono: '988777666',
      email: 'maria@example.com',
      distrito: 'Santiago de Surco',
      esSurco: true,
    },
  });

  const vecino3 = await prisma.vecino.upsert({
    where: { dni: '11223344' },
    update: {},
    create: {
      dni: '11223344',
      nombre: 'Pedro',
      apellidos: 'Ruiz Sánchez',
      telefono: '977666555',
      distrito: 'Miraflores',
      esSurco: false,
    },
  });

  console.log('✅ Vecinos de prueba creados:', {
    vecino1: vecino1.dni,
    vecino2: vecino2.dni,
    vecino3: vecino3.dni,
  });

  // Crear caja del día
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const caja = await prisma.caja.upsert({
    where: { fecha: hoy },
    update: {},
    create: {
      fecha: hoy,
      saldoInicial: 100,
      staffId: recepcionista.id,
    },
  });

  console.log('✅ Caja del día creada');

  // Crear algunas compras de prueba
  const compra1 = await prisma.compra.create({
    data: {
      vecinoDni: vecino1.dni,
      horas: 4,
      monto: 18,
      metodoPago: 'EFECTIVO',
      staffId: recepcionista.id,
      cajaId: caja.id,
    },
  });

  const compra2 = await prisma.compra.create({
    data: {
      vecinoDni: vecino2.dni,
      horas: 8,
      monto: 32,
      metodoPago: 'YAPE',
      referencia: 'YAPE-123456',
      staffId: recepcionista.id,
      cajaId: caja.id,
    },
  });

  console.log('✅ Compras de prueba creadas');

  console.log('🎉 Seed completado!');
  console.log('\n📝 Credenciales de prueba:');
  console.log('  Admin Municipal: usuario=admin, password=admin123');
  console.log('  Recepcionista: usuario=maria.garcia, password=recepcion123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
