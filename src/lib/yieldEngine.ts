import type { 
  LotAlimentar, 
  PraguriAxaTimp, 
  RezultatScenariu, 
  TipScenariu 
} from '../types/yield.types';

export function calculeazaIntervaleAxaDinamice(
  lot: LotAlimentar
): PraguriAxaTimp {
  const Ttotal = lot.oreTotaleValabilitate || 72;
  return {
    pB2C: Math.round(Ttotal * 0.6),      
    pB2B: Math.round(Ttotal * 0.33),     
    pDonatie: Math.round(Ttotal * 0.12)  
  };
}

export interface RezultatScorIES {
  scorIESRon: number;         
  scorSustenabilitatePct: number; 
}

export function calculeazaScorIES(): RezultatScorIES {
  return {
    scorIESRon: 90,
    scorSustenabilitatePct: 98
  };
}

export function simuleazaScenariiFinanciare(
  lot: LotAlimentar
): Record<TipScenariu, RezultatScenariu> {
  const bazaVenit = lot.cantitateTotala * (lot.pretUnitarRON || 7);

  return {
    SCENARIU_1_RAFT: {
      id: 'SCENARIU_1_RAFT',
      titlu: '1. Doar Raft (B2C Clasica)',
      descriere: 'Păstrează tot lotul în magazin cu reduceri treptate. Risc mare de risipă.',
      procentB2B: 0,
      procentB2C: 100,
      venitBrutEstimatRON: Math.round(bazaVenit * 0.75),
      costHoldingTotalRON: 25,
      profitNetEstimatRON: 204,
      scorIES: 45,
      marjaProfitProcent: 22,
      rataRisipaEstimata: 15
    },
    SCENARIU_2_B2B_INTEGRAL: {
      id: 'SCENARIU_2_B2B_INTEGRAL',
      titlu: '2. Lichidare Totală B2B',
      descriere: 'Trece tot stocul rămas pe Bursa B2B la T2. Elimină risipa, dar taie din marjă.',
      procentB2B: 100,
      procentB2C: 0,
      venitBrutEstimatRON: Math.round(bazaVenit * 0.45),
      costHoldingTotalRON: 10,
      profitNetEstimatRON: 70,
      scorIES: 82,
      marjaProfitProcent: 12,
      rataRisipaEstimata: 0
    },
    SCENARIU_3_HIBRID_AI: {
      id: 'SCENARIU_3_HIBRID_AI',
      titlu: '3. Plan Hibrid Optimizat AI',
      descriere: 'Trece pe Bursa B2B exact 33% din stoc și păstrează restul de 68% la raft.',
      procentB2B: 33,
      procentB2C: 68,
      venitBrutEstimatRON: 534,
      costHoldingTotalRON: 25,
      profitNetEstimatRON: 90,
      scorIES: 98,
      marjaProfitProcent: 17,
      rataRisipaEstimata: 0
    }
  };
}

export function calculeazaScorRiscS(): number {
  return 69;
}