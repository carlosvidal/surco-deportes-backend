// src/types/index.ts

import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    usuario: string;
    rol: string;
  };
}

export interface VecinoConSaldo {
  dni: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  email: string | null;
  distrito: string;
  esSurco: boolean;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
  saldo: number;
  horasCompradas: number;
  horasConsumidas: number;
}

export interface ConsumoActivo {
  id: number;
  vecinoDni: string;
  vecino: {
    nombre: string;
    apellidos: string;
  };
  instalacion: string;
  carril: number | null;
  entradaAt: Date;
  tiempoTranscurrido: number; // en minutos
  tiempoRestante: number; // en minutos
}

export interface ResumenCaja {
  fecha: Date;
  saldoInicial: number;
  totalVentas: number;
  ventasEfectivo: number;
  ventasYape: number;
  ventasPlin: number;
  ventasTransferencia: number;
  efectivoEsperado: number;
  transacciones: Array<{
    hora: string;
    vecino: string;
    horas: number;
    monto: number;
    metodoPago: string;
  }>;
}
