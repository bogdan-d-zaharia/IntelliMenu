import type { LotAlimentar, CategorieAlimentara } from '../types/yield.types';
import { calculeazaScorRiscS } from '../lib/yieldEngine';

// Structura pentru funcția de timp
export interface TimpRamasDetaliat {
  zile: number;
  ore: number;
  minute: number;
  oreTotale: number;
  textFormatat: string;
}

/**
 * Calculează diferența dintre data de expirare și data curentă a sistemului.
 */
export function calculeazaTimpRamas(dataExpirare: string): TimpRamasDetaliat {
  const acum = new Date().getTime();
  const expirare = new Date(dataExpirare).getTime();
  const diferentaMs = expirare - acum;

  if (diferentaMs <= 0) {
    return { zile: 0, ore: 0, minute: 0, oreTotale: 0, textFormatat: 'Expirat' };
  }

  const minuteTotale = Math.floor(diferentaMs / (1000 * 60));
  const oreTotale = Math.floor(minuteTotale / 60);

  const zile = Math.floor(oreTotale / 24);
  const ore = oreTotale % 24;
  const minute = minuteTotale % 60;

  const partiText: string[] = [];
  if (zile > 0) partiText.push(`${zile} ${zile === 1 ? 'zi' : 'zile'}`);
  if (ore > 0) partiText.push(`${ore} ${ore === 1 ? 'oră' : 'ore'}`);
  if (minute > 0 || partiText.length === 0) partiText.push(`${minute} min`);

  return {
    zile,
    ore,
    minute,
    oreTotale,
    textFormatat: partiText.join(', ')
  };
}

// Helper pentru a genera date de expirare viitoare raportate la ora curentă
function genereazaDataExpirare(oreInViitor: number): string {
  const d = new Date();
  d.setHours(d.getHours() + oreInViitor);
  return d.toISOString();
}

// 1. Configurațiile categoriilor
export const CONFIGURARI_CATEGORII: Record<CategorieAlimentara, any> = {
  'Carne & Mezeluri': {
    pondereBazaB2C: 0.50,
    pondereBazaB2B: 0.25,
    sensibilitateStocB2C: 0.12,
    sensibilitateStocB2B: 0.18,
    plafonPresiuneStoc: 2.5,
    oreMinimeDonatie: 8,
    procentPlafonDonatie: 0.12,
    costStocarePerKgZiRON: 0.25,
    wasteDisposalCostPerKg: 1.5,
    esgPenaltyPerKg: 3.5,
    impactFactor: 3.0
  },

  'Lactate & Brânzeturi': {
    pondereBazaB2C: 0.55,
    pondereBazaB2B: 0.30,
    sensibilitateStocB2C: 0.08,
    sensibilitateStocB2B: 0.12,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 12,
    procentPlafonDonatie: 0.10,
    costStocarePerKgZiRON: 0.15,
    wasteDisposalCostPerKg: 1.2,
    esgPenaltyPerKg: 2.5,
    impactFactor: 1.8
  },

  'Conserve & Produse Uscate': {
    pondereBazaB2C: 0.65,
    pondereBazaB2B: 0.35,
    sensibilitateStocB2C: 0.02,
    sensibilitateStocB2B: 0.05,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 24,
    procentPlafonDonatie: 0.05,
    costStocarePerKgZiRON: 0.05,
    wasteDisposalCostPerKg: 1.0,
    esgPenaltyPerKg: 1.5,
    impactFactor: 0.8
  }
};

// 2. Loturi simulate cu date de expirare dinamice
export const LOTURI_SIMULATE: LotAlimentar[] = [
  {
    id: 'LOT-101',
    nume: 'Parizer Țărănesc de Porc',
    categorie: 'Carne & Mezeluri',
    cantitateTotala: 40,
    pretUnitarRON: 22.0,
    vanzariMediiZilnice: 15,
    oreTotaleValabilitate: 120,
    dataExpirare: genereazaDataExpirare(48),
    oreRămase: 48,
    costAchizitieUnitarRON: 8.5
  },
  {
    id: 'LOT-102',
    nume: 'Piept de Pui Dezosat',
    categorie: 'Carne & Mezeluri',
    cantitateTotala: 60,
    pretUnitarRON: 28.0,
    vanzariMediiZilnice: 25,
    oreTotaleValabilitate: 168,
    dataExpirare: genereazaDataExpirare(96),
    oreRămase: 96,
    costAchizitieUnitarRON: 13.0
  },
  {
    id: 'LOT-201',
    nume: 'Lapte Proaspăt 3.5%',
    categorie: 'Lactate & Brânzeturi',
    cantitateTotala: 80,
    pretUnitarRON: 8.5,
    vanzariMediiZilnice: 30,
    oreTotaleValabilitate: 120,
    dataExpirare: genereazaDataExpirare(60),
    oreRămase: 60,
    costAchizitieUnitarRON: 3.2
  },
  {
    id: 'LOT-301',
    nume: 'Conservă Ton în Ulei',
    categorie: 'Conserve & Produse Uscate',
    cantitateTotala: 150,
    pretUnitarRON: 12.5,
    vanzariMediiZilnice: 20,
    oreTotaleValabilitate: 720,
    dataExpirare: genereazaDataExpirare(168),
    oreRămase: 240,
    costAchizitieUnitarRON: 4.8
  }
];

export const LOT_DEFAULT_CONFIG: LotAlimentar = LOTURI_SIMULATE[0];

export function getLoturiPrioritizate(): LotAlimentar[] {
  return [...LOTURI_SIMULATE].map(lot => {
    const timp = calculeazaTimpRamas(lot.dataExpirare);
    return {
      ...lot,
      oreRămase: timp.oreTotale
    };
  }).sort((a, b) => calculeazaScorRiscS(b) - calculeazaScorRiscS(a));
}