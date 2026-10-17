import type { ConfigurareCategorie, CategorieAlimentara } from '../types/yield.types';
import { CONFIGURARI_CATEGORII } from '../data/categoryConfig';

export interface LotIstoric {
  categorie: CategorieAlimentara;
  cantitateInitiala: number;
  vanzariMediiZilnice: number;
  durataTotalaOre: number;
  orePanaLaBlocajVanzareRaft: number;
  rataRisipa: number; // Ex: 0.05 pentru 5%
  timpRidicariCantineOre: number;
}

/**
 * Calculează parametrii optimi din datele istorice ale vânzărilor pentru o anumită categorie.
 * Dacă nu există date istorice suficente, folosește configurația de bază definită în categoryConfig.
 */
export function calculeazaEuristicaDinDate(
  istoricLoturi: LotIstoric[],
  categorieTarget: CategorieAlimentara = 'carne_proaspata'
): ConfigurareCategorie {
  const configBaza = CONFIGURARI_CATEGORII[categorieTarget];

  // Filtram doar loturile din categoria specificată
  const loturiCategorie = (istoricLoturi || []).filter(lot => lot.categorie === categorieTarget);

  if (loturiCategorie.length === 0) {
    // Fallback: Returnăm parametrii din baza de date / fișierul de configurare
    return configBaza;
  }

  let sumaProcenteBlocajRaft = 0;
  let sumaTimpRaspunsB2B = 0;
  let sumaCorelatieStocRisipa = 0;

  loturiCategorie.forEach(lot => {
    const procentEpuizat = lot.orePanaLaBlocajVanzareRaft / Math.max(1, lot.durataTotalaOre);
    sumaProcenteBlocajRaft += procentEpuizat;
    sumaTimpRaspunsB2B += lot.timpRidicariCantineOre;

    const presiune = lot.cantitateInitiala / Math.max(1, lot.vanzariMediiZilnice);
    if (presiune > 1) {
      sumaCorelatieStocRisipa += (lot.rataRisipa / presiune);
    }
  });

  const total = loturiCategorie.length;
  
  // Recalculăm ponderile dinamice pe baza istoricului real
  const pondereB2CCalculata = sumaProcenteBlocajRaft / total;
  const sensibilitateCalculata = sumaCorelatieStocRisipa / total;
  const oreRidicaiMedii = Math.round(sumaTimpRaspunsB2B / total);

  return {
    pondereBazaB2C: Number(pondereB2CCalculata.toFixed(2)) || configBaza.pondereBazaB2C,
    pondereBazaB2B: Number((pondereB2CCalculata + 0.25).toFixed(2)) || configBaza.pondereBazaB2B,
    sensibilitateStocB2C: Number(sensibilitateCalculata.toFixed(2)) || configBaza.sensibilitateStocB2C,
    sensibilitateStocB2B: Number((sensibilitateCalculata * 1.5).toFixed(2)) || configBaza.sensibilitateStocB2B,
    plafonPresiuneStoc: configBaza.plafonPresiuneStoc,
    oreMinimeDonatie: oreRidicaiMedii || configBaza.oreMinimeDonatie,
    procentPlafonDonatie: configBaza.procentPlafonDonatie,
    costStocarePerKgZiRON: configBaza.costStocarePerKgZiRON // <--- ADaugă ACEASTĂ LINIE
  };
}