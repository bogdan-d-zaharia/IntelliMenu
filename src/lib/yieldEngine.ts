import type { LotAlimentar, PraguriAxaTimp, ConfigurareCategorie, RezultatScenariu, TipScenariu } from '../types/yield.types';
import { CONFIGURARI_CATEGORII } from '../data/categoryConfig';

export function calculeazaIntervaleAxaDinamice(
  lot: LotAlimentar,
  configCustom?: ConfigurareCategorie
): PraguriAxaTimp {
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];

  const Ttotal = lot.oreTotaleValabilitate;
  const Vstoc = lot.cantitateTotala;
  const Vmedie = Math.max(1, lot.vanzariMediiZilnice);
  
  const presiuneStoc = Vstoc / Vmedie;
  const factorPresiune = Math.min(config.plafonPresiuneStoc, presiuneStoc);

  const pB2C = Ttotal * config.pondereBazaB2C * (1 - config.sensibilitateStocB2C * factorPresiune);
  const pB2B = Ttotal * config.pondereBazaB2B * (1 - config.sensibilitateStocB2B * factorPresiune);
  const pDonatie = Ttotal - Math.max(config.oreMinimeDonatie, Ttotal * config.procentPlafonDonatie);

  return {
    pB2C: Math.round(pB2C),
    pB2B: Math.round(pB2B),
    pDonatie: Math.round(pDonatie)
  };
}

/**
 * Calculează Split-ul Optim B2B (X%) și simulează rezultatele financiare pentru cele 3 scenarii.
 */
export function simuleazaScenariiFinanciare(
  lot: LotAlimentar,
  configCustom?: ConfigurareCategorie
): Record<TipScenariu, RezultatScenariu> {
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];
  
  const zileTotal = lot.oreTotaleValabilitate / 24;
  const costAchizitieTotal = lot.cantitateTotala * (lot.costAchizitieUnitarRON || lot.pretUnitarRON * 0.5);
  const costHoldingBaza = lot.cantitateTotala * config.costStocarePerKgZiRON * zileTotal;

  // --- SCENARIUL 1: Doar Raft (B2C + Promo + Donație) ---
  const cantitateVandutaB2C_S1 = Math.min(lot.cantitateTotala, lot.vanzariMediiZilnice * (zileTotal * 0.7));
  const cantitateRasa_S1 = Math.max(0, lot.cantitateTotala - cantitateVandutaB2C_S1);
  
  const venitS1 = (cantitateVandutaB2C_S1 * 0.6 * lot.pretUnitarRON) + (cantitateVandutaB2C_S1 * 0.4 * lot.pretUnitarRON * 0.5);
  const profitS1 = venitS1 - costAchizitieTotal - costHoldingBaza;

  // --- SCENARIUL 2: B2B Integral (100% din stocul rămas la T2 trece pe bursă) ---
  // Holding cost scade deoarece stocul părăsește magazinul devreme (la momentul T2, ~60% din timp)
  const costHoldingS2 = costHoldingBaza * 0.6; 
  const cantitateB2C_S2 = lot.cantitateTotala * 0.35;
  const cantitateB2B_S2 = lot.cantitateTotala * 0.65;
  
  const venitS2 = (cantitateB2C_S2 * lot.pretUnitarRON) + (cantitateB2B_S2 * lot.pretUnitarRON * 0.35);
  const profitS2 = venitS2 - costAchizitieTotal - costHoldingS2;

  // --- SCENARIUL 3: Hibrid Optimizat AI (Calcul X% optim) ---
  // Calculăm absorpția maximă estimată la raft B2C
  const capacitateAbsorbtieB2C = lot.vanzariMediiZilnice * (lot.oreRămase / 24) * 0.8;
  const surplusRisc = Math.max(0, lot.cantitateTotala - capacitateAbsorbtieB2C);
  
  // Procentul X% de marfă ce trebuie scoasă de pe raft și pusă pe Bursă
  const procentB2BOptim = Math.min(0.80, Math.max(0.20, surplusRisc / lot.cantitateTotala));
  const procentB2COptim = 1 - procentB2BOptim;

  const costHoldingS3 = costHoldingBaza * (0.4 + 0.6 * procentB2COptim);
  const venitS3 = (lot.cantitateTotala * procentB2COptim * lot.pretUnitarRON * 0.85) + 
                  (lot.cantitateTotala * procentB2BOptim * lot.pretUnitarRON * 0.40);
  
  const profitS3 = venitS3 - costAchizitieTotal - costHoldingS3;

  return {
    SCENARIU_1_RAFT: {
      id: 'SCENARIU_1_RAFT',
      titlu: '1. Doar Raft (B2C Clasica)',
      descriere: 'Păstrează tot lotul în magazin cu reduceri la raft. Risc mare de risipă.',
      procentB2B: 0,
      procentB2C: 100,
      venitBrutEstimatRON: Math.round(venitS1),
      costHoldingTotalRON: Math.round(costHoldingBaza),
      profitNetEstimatRON: Math.round(profitS1),
      marjaProfitProcent: Math.round((profitS1 / venitS1) * 100) || 0,
      rataRisipaEstimata: Math.round((cantitateRasa_S1 / lot.cantitateTotala) * 100)
    },
    SCENARIU_2_B2B_INTEGRAL: {
      id: 'SCENARIU_2_B2B_INTEGRAL',
      titlu: '2. Lichidare Totală B2B',
      descriere: 'Mute tot stocul rămas pe Bursa B2B la T2. Elimină risipa, dar taie din marjă.',
      procentB2B: 100,
      procentB2C: 0,
      venitBrutEstimatRON: Math.round(venitS2),
      costHoldingTotalRON: Math.round(costHoldingS2),
      profitNetEstimatRON: Math.round(profitS2),
      marjaProfitProcent: Math.round((profitS2 / venitS2) * 100) || 0,
      rataRisipaEstimata: 0
    },
    SCENARIU_3_HIBRID_AI: {
      id: 'SCENARIU_3_HIBRID_AI',
      titlu: '3. Plan Hibrid Optimizat AI',
      descriere: `Trece pe Bursa B2B exact ${Math.round(procentB2BOptim * 100)}% din stoc și păstrează restul la raft.`,
      procentB2B: Math.round(procentB2BOptim * 100),
      procentB2C: Math.round(procentB2COptim * 100),
      venitBrutEstimatRON: Math.round(venitS3),
      costHoldingTotalRON: Math.round(costHoldingS3),
      profitNetEstimatRON: Math.round(profitS3),
      marjaProfitProcent: Math.round((profitS3 / venitS3) * 100) || 0,
      rataRisipaEstimata: 2
    }
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