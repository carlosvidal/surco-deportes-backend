-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('RECEPCION', 'ADMIN_SEDE', 'ADMIN_MUNICIPAL');

-- CreateEnum
CREATE TYPE "Parentesco" AS ENUM ('HIJO', 'HIJA', 'CONYUGE', 'OTRO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'YAPE', 'PLIN', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "Instalacion" AS ENUM ('PISCINA_ADULTOS', 'PISCINA_NINOS', 'PADDLE', 'GIMNASIO', 'PARRILLAS');

-- CreateTable
CREATE TABLE "staff" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'RECEPCION',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vecinos" (
    "dni" VARCHAR(8) NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "distrito" TEXT NOT NULL,
    "es_surco" BOOLEAN NOT NULL DEFAULT false,
    "contacto_emergencia" TEXT,
    "telefono_emergencia" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vecinos_pkey" PRIMARY KEY ("dni")
);

-- CreateTable
CREATE TABLE "familias" (
    "id" SERIAL NOT NULL,
    "titular_dni" TEXT NOT NULL,
    "miembro_dni" TEXT NOT NULL,
    "parentesco" "Parentesco" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" SERIAL NOT NULL,
    "vecino_dni" TEXT NOT NULL,
    "horas" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo_pago" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "staff_id" INTEGER NOT NULL,
    "caja_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumos" (
    "id" SERIAL NOT NULL,
    "vecino_dni" TEXT NOT NULL,
    "instalacion" "Instalacion" NOT NULL,
    "carril" INTEGER,
    "entrada_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salida_at" TIMESTAMP(3),
    "salida_auto" BOOLEAN NOT NULL DEFAULT false,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "staff_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "saldo_inicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_final" DECIMAL(10,2),
    "saldo_declarado" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "observaciones" TEXT,
    "cerrada_at" TIMESTAMP(3),
    "staff_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "datos" JSONB,
    "staff_id" INTEGER,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_usuario_key" ON "staff"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "familias_titular_dni_miembro_dni_key" ON "familias"("titular_dni", "miembro_dni");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_fecha_key" ON "cajas"("fecha");

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_titular_dni_fkey" FOREIGN KEY ("titular_dni") REFERENCES "vecinos"("dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_miembro_dni_fkey" FOREIGN KEY ("miembro_dni") REFERENCES "vecinos"("dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_vecino_dni_fkey" FOREIGN KEY ("vecino_dni") REFERENCES "vecinos"("dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_caja_id_fkey" FOREIGN KEY ("caja_id") REFERENCES "cajas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos" ADD CONSTRAINT "consumos_vecino_dni_fkey" FOREIGN KEY ("vecino_dni") REFERENCES "vecinos"("dni") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos" ADD CONSTRAINT "consumos_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
