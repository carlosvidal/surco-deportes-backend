// src/utils/config.ts

export const TARIFAS = {
  SURCO: {
    1: 5.00,
    4: 18.00,
    8: 32.00,
    12: 42.00,
  },
  OTROS: {
    1: 8.00,
    4: 28.00,
    8: 52.00,
    12: 72.00,
  },
} as const;

export const INSTALACIONES = {
  PISCINA_ADULTOS: {
    nombre: 'Piscina Adultos',
    descripcion: '25 metros',
    carriles: 8,
    icono: '🏊',
    activa: true,
  },
  PISCINA_NINOS: {
    nombre: 'Piscina Niños',
    descripcion: '',
    carriles: 5,
    icono: '🧒',
    activa: true,
  },
  PADDLE: {
    nombre: 'Cancha Paddle',
    descripcion: '',
    carriles: null,
    icono: '🎾',
    activa: true,
  },
  GIMNASIO: {
    nombre: 'Gimnasio',
    descripcion: '',
    carriles: null,
    icono: '💪',
    activa: true,
  },
  PARRILLAS: {
    nombre: 'Zona Parrillas',
    descripcion: '',
    carriles: null,
    icono: '🔥',
    activa: false, // Próximamente
  },
} as const;

export const TIEMPO_LIMITE_HORA = 60; // minutos
export const ALERTA_AMARILLA = 15; // minutos restantes
export const ALERTA_ROJA = 5; // minutos restantes

export function calcularPrecio(horas: number, esSurco: boolean): number {
  const tarifa = esSurco ? TARIFAS.SURCO : TARIFAS.OTROS;
  return tarifa[horas as keyof typeof tarifa] || horas * tarifa[1];
}

export const PAQUETES_DISPONIBLES = [1, 4, 8, 12] as const;
export type PaqueteHoras = typeof PAQUETES_DISPONIBLES[number];
