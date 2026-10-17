export type CategorieAlimentara = 'carne_proaspata' | 'lactate' | 'conserve_uscate';

export type TipScenariu = 'SCENARIU_1_RAFT' | 'SCENARIU_2_B2B_INTEGRAL' | 'SCENARIU_3_HIBRID_AI';

export interface ConfigurareCategorie {
  pondereBazaB2C: number;
  pondereBazaB2B: number;
  sensibilitateStocB2C: number;
  sensibilitateStocB2B: number;
  plafonPresiuneStoc: number;
  oreMinimeDonatie: number;
  procentPlafonDonatie: number;
  costStocarePerKgZiRON: number; // Ex: 0.50 RON/kg/zi (depozitare + frig)
}

export interface LotAlimentar {
  id: string;
  nume: string;
  categorie: CategorieAlimentara;
  cantitateTotala: number;
  vanzariMediiZilnice: number;
  oreTotaleValabilitate: number;
  oreRămase: number;
  pretUnitarRON: number;
  costAchizitieUnitarRON: number; // Pentru calculul marjei reale
}

export interface RezultatScenariu {
  id: TipScenariu;
  titlu: string;
  descriere: string;
  procentB2B: number;           // X% direcționat pe bursă
  procentB2C: number;           // (100 - X)% păstrat la raft
  venitBrutEstimatRON: number;
  costHoldingTotalRON: number;  // Cost stocare/manipulare acumulat
  profitNetEstimatRON: number;
  marjaProfitProcent: number;
  rataRisipaEstimata: number;   // % marfă donată/expirată
}

export interface PraguriAxaTimp {
  pB2C: number;
  pB2B: number;
  pDonatie: number;
}