import type { LotAlimentar, PraguriAxaTimp, ConfigurareCategorie } from '../types/yield.types';
import { CONFIGURARI_CATEGORII } from '../data/categoryConfig';

export function calculeazaIntervaleAxaDinamice(
  lot: LotAlimentar,
  configCustom?: ConfigurareCategorie // Parametru opțional (dacă vine din DB/Euristică)
): PraguriAxaTimp {
  // 1. Extrage configurația specifică categoriei (din DB/Custom sau din fișierul de date local)
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];

  const Ttotal = lot.oreTotaleValabilitate;
  const Vstoc = lot.cantitateTotala;
  const Vmedie = Math.max(1, lot.vanzariMediiZilnice);
  
  const presiuneStoc = Vstoc / Vmedie;
  const factorPresiune = Math.min(config.plafonPresiuneStoc, presiuneStoc);

  // 2. Aplică ecuația generalizată folosind parametrii dinaționali
  const pB2C = Ttotal * config.pondereBazaB2C * (1 - config.sensibilitateStocB2C * factorPresiune);
  const pB2B = Ttotal * config.pondereBazaB2B * (1 - config.sensibilitateStocB2B * factorPresiune);
  const pDonatie = Ttotal - Math.max(config.oreMinimeDonatie, Ttotal * config.procentPlafonDonatie);

  return {
    pB2C: Math.round(pB2C),
    pB2B: Math.round(pB2B),
    pDonatie: Math.round(pDonatie)
  };
}

export function calculeazaScorRiscS(lot: LotAlimentar): number {
  const tScurs = lot.oreTotaleValabilitate - lot.oreRămase;
  const raportTimp = tScurs / Math.max(1, lot.oreTotaleValabilitate);
  
  const presiuneStoc = lot.cantitateTotala / Math.max(1, lot.vanzariMediiZilnice);
  
  let cPerisabilitate = 1.0;
  if (lot.categorie === 'carne_proaspata') cPerisabilitate = 1.8;
  if (lot.categorie === 'conserve_uscate') cPerisabilitate = 0.5;

  const componentaTimp = raportTimp * 50;
  const componentaStoc = Math.min(7, presiuneStoc) * (50 / 7) * cPerisabilitate;

  return Math.round(Math.min(100, Math.max(0, componentaTimp + componentaStoc)));
}