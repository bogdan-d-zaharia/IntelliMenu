//import type { DictionarConfigurari } from '../types/yield.types';

export const CONFIGURARI_CATEGORII: Record<string, any> = {
  carne_proaspata: {
    pondereBazaB2C: 0.40,
    pondereBazaB2B: 0.65,
    sensibilitateStocB2C: 0.10,
    sensibilitateStocB2B: 0.15,
    plafonPresiuneStoc: 2,
    oreMinimeDonatie: 6,
    procentPlafonDonatie: 0.10,
    costStocarePerKgZiRON: 0.80 // Refrigerare intensivă + manipulare rapidă
  },
  lactate: {
    pondereBazaB2C: 0.55,
    pondereBazaB2B: 0.80,
    sensibilitateStocB2C: 0.05,
    sensibilitateStocB2B: 0.10,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 12,
    procentPlafonDonatie: 0.08,
    costStocarePerKgZiRON: 0.45 // Frigider standard
  },
  conserve_uscate: {
    pondereBazaB2C: 0.75,
    pondereBazaB2B: 0.90,
    sensibilitateStocB2C: 0.00,
    sensibilitateStocB2B: 0.00,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 48,
    procentPlafonDonatie: 0.05,
    costStocarePerKgZiRON: 0.15 // Depozitare uscată la raft
  }
};