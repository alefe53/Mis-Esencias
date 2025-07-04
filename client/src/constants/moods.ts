// src/constants/moods.ts
import type { Mood } from '../types/index.ts';

export const availableMoods: Mood[] = [
  { id: 1, name: 'Apocalíptico' },
  { id: 2, name: 'Surfeando la ola' },
  { id: 3, name: 'Pa pegarse un tiro' },
  { id: 4, name: 'Llevándola' },
  { id: 5, name: 'Lo que sea' },
  { id: 6, name: 'A Flashearla' },
];

// Mapa de colores para el hover de cada mood
export const moodColors: { [key: string]: string } = {
  'Apocalíptico': '#EF4444',      // Rojo
  'Pa pegarse un tiro': '#3B82F6', // Azul
  'Surfeando la ola': '#22C55E',  // Verde
  'Llevándola': '#EAB308',         // Amarillo
  'A Flashearla': '#A855F7',      // Púrpura
  'Lo que sea': '#FFFFFF',         // Blanco
};