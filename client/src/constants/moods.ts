// src/constants/moods.ts
import type { Mood } from '../types/index.ts'

export const availableMoods: Mood[] = [
  { id: 1, name: 'Apocalíptico' },
  { id: 2, name: 'Surfeando la ola' },
  { id: 3, name: 'Pa pegarse un tiro' },
  { id: 4, name: 'Llevándola' },
  { id: 5, name: 'Lo que sea' },
  { id: 6, name: 'A Flashearla' },
]

// Mapa de colores para el hover de cada mood
export const moodColors: { [key: string]: string } = {
  Apocalíptico: '#cc0202ff', // Rojo
  'Pa pegarse un tiro': '#024ec8ff', // Azul
  'Surfeando la ola': '#5A8D6B', // Verde
  Llevándola: '#d3a415ff', // Amarillo
  'A Flashearla': '#821de0ff', // Púrpura
  'Lo que sea': '#FFFFFF', // Blanco
}
