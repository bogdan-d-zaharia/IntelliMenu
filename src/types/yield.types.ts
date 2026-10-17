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
  procentB2B: number;
  procentB2C: number;
  venitBrutEstimatRON: number;
  costHoldingTotalRON: number;
  profitNetEstimatRON: number;
  scorIES: number; // <--- Adaugi acest câmp nou
  marjaProfitProcent: number;
  rataRisipaEstimata: number;
  esteRecomandatAI?: boolean; // <--- Flag opțional
}

export interface PraguriAxaTimp {
  pB2C: number;
  pB2B: number;
  pDonatie: number;
}