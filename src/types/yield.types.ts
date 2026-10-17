export type CategorieAlimentara = 'carne_proaspata' | 'lactate' | 'conserve_uscate';

// Parametrii matematici extensibili pentru o categorie
export interface ConfigurareCategorie {
  pondereBazaB2C: number;           // ex: 0.40 pentru carne
  pondereBazaB2B: number;           // ex: 0.65 pentru carne
  sensibilitateStocB2C: number;     // ex: 0.10
  sensibilitateStocB2B: number;     // ex: 0.15
  plafonPresiuneStoc: number;      // ex: 2 sau 3
  oreMinimeDonatie: number;         // ex: 6, 12, 48 ore
  procentPlafonDonatie: number;     // ex: 0.10, 0.08, 0.05
}
export interface ParametriEuristici {
  pondereBazaB2C: number;
  pondereBazaB2B: number;
  pondereBazaDonatie: number;
  sensibilitateStocB2C: number;
  sensibilitateStocB2B: number;
  maxPresiuneStocAdmis: number;
  oreMinimeSigurantaDonatie: number;
}
export type DictionarConfigurari = Record<CategorieAlimentara, ConfigurareCategorie>;

export interface LotAlimentar {
  id: string;
  nume: string;
  categorie: CategorieAlimentara;
  cantitateTotala: number;
  vanzariMediiZilnice: number;
  oreTotaleValabilitate: number;
  oreRămase: number;
  pretUnitarRON: number;
}

export interface PraguriAxaTimp {
  pB2C: number;
  pB2B: number;
  pDonatie: number;
}