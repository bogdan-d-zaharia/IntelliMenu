import type { 
  LotAlimentar, 
  PraguriAxaTimp, 
  ConfigurareCategorie, 
  RezultatScenariu, 
  TipScenariu 
} from '../types/yield.types';
import { CONFIGURARI_CATEGORII } from '../data/categoryConfig';

/**
 * ============================================================================
 * SYSTEM PROMPT / AI INSTRUCTION SPEC: GENERARE PRAGURI TEMPORALE DINAMICE
 * ============================================================================
 * 
 * SYSTEM ROLE & OBJECTIVE:
 * Acționezi ca un motor de Yield Management & Dynamic Pricing pentru Retail.
 * Scopul tău este să calculezi pragurile temporale optime (exprimated în ORE RĂMASE
 * până la expirare) pentru a declanșa acțiunile operaționale:
 *  - T1 (pB2C)    : Prima reducere masivă la raft (-50% Retail).
 *  - T2 (pB2B)    : Transferul stocului excedentar pe Bursa B2B / Lichidare Bulk.
 *  - T3 (pDonatie): Rezervarea de urgență pentru ONG-uri (Donații Fiscale).
 * 
 * CORE BUSINESS RULES (RESTRICȚII CONSTANTINATE):
 * 1. Cronologie Strictă: T1 (pB2C) > T2 (pB2B) > T3 (pDonatie). Reducerea la raft 
 *    trebuie să aibă loc întotdeauna ÎNAINTEA lichidării B2B!
 * 2. Adaptabilitate la Presiune: Când stocul este supradimensionat față de vânzările 
 *    zilnice, timpul rămas la care se declanșează alerte TREBUIE SĂ CREASCĂ (alertă mai devreme).
 * 3. Prevenirea Valorilor Absurde: Niciun prag nu poate depăși T_total - 2 ore 
 *    sau să scadă sub 1 oră.
 * ============================================================================
 */

export function calculeazaIntervaleAxaDinamice(
  lot: LotAlimentar,
  configCustom?: ConfigurareCategorie
): PraguriAxaTimp {
  // PROMPT STEP 1: Încarcă configurarea specifică categoriei sau folosește fallback-ul implicit
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];

  // PROMPT STEP 2: Extrage variabilele primare de timp și volum din lotul de marfă
  const Ttotal = lot.oreTotaleValabilitate;
  const Vstoc = lot.cantitateTotala;
  const Vmedie = Math.max(1, lot.vanzariMediiZilnice); // Guard against Division-by-Zero
  
  // PROMPT STEP 3: Evaluarea Presiunii Stocului
  // AI REASONING: Câte zile sunt necesare pentru a vinde stocul la ritm normal?
  // Dacă presiuneStoc > 1, avem un surplus ce riscă să expire.
  const presiuneStoc = Vstoc / Vmedie; 
  
  // AI BOUNDING: Limitează factorul de presiune conform plafonului categoriei pentru a preveni devansarea excesivă
  const factorPresiune = Math.min(config.plafonPresiuneStoc, Math.max(0, presiuneStoc - 1));

  // PROMPT STEP 4: Calculul Coeficienților Dinamici de Devansare
  // AI RULE: Cu cât factorPresiune e mai mare, cu atât măriți pragul (ore rămasă la care acționăm).
  const factorAjustareB2C = 1 + (config.sensibilitateStocB2C * factorPresiune);
  const factorAjustareB2B = 1 + (config.sensibilitateStocB2B * factorPresiune);

  // PROMPT STEP 5: Calculul Pragului B2C (T1) - Ore Rămase
  // FORMULĂ: Durata Bază % x Factor Devansare
  let pB2C = Ttotal * config.pondereBazaB2C * factorAjustareB2C;

  // PROMPT STEP 6: Calculul Pragului B2B (T2) - Ore Rămase
  // FORMULĂ: Durata Bază B2B % x Factor Devansare
  let pB2B = Ttotal * config.pondereBazaB2B * factorAjustareB2B;

  // PROMPT STEP 7: Aplicarea Sanity Checks & Secvențialității Temporale
  // AI GUARD-RAIL 1: Asigură-te că pB2C nu depășește durata totală de viață
  pB2C = Math.min(Ttotal - 2, pB2C);

  // AI GUARD-RAIL 2: Impune pB2C > pB2B cu cel puțin 2 ore diferență (Păstrează ordinea T1 > T2)
  pB2B = Math.min(pB2C - 2, pB2B);

  // PROMPT STEP 8: Calculul Pragului de Donație ONG (T3)
  // AI RULE: Selectează maximul dintre timpul minim de operare ONG și procentul din valabilitate.
  const oreDonatieGarantate = Math.max(config.oreMinimeDonatie, Ttotal * config.procentPlafonDonatie);
  
  // AI GUARD-RAIL 3: Impune pB2B > pDonatie (Păstrează ordinea T2 > T3)
  const pDonatie = Math.min(pB2B - 1, oreDonatieGarantate);

  // PROMPT STEP 9: Formatare Output (Rotunjire și garantarea valorilor pozitive >= 1h)
  const gap = Math.min(1, Ttotal / 6);
  const first = Math.max(3 * gap, Math.min(Ttotal - gap, pB2C));
  const second = Math.max(2 * gap, Math.min(first - gap, pB2B));
  const third = Math.max(gap, Math.min(second - gap, pDonatie));
  const format = (hours: number) => Ttotal >= 6 ? Math.round(hours) : hours;
  return { pB2C: format(first), pB2B: format(second), pDonatie: format(third) };
}
/**
 * ============================================================================
 * SYSTEM PROMPT / AI INSTRUCTION SPEC: CALCUL INDICE EFICIENȚĂ SUSTENABILĂ (IES)
 * ============================================================================
 * 
 * SYSTEM ROLE & OBJECTIVE:
 * Acționezi ca un Modul de Evaluare ESG & Impact Financiar Sustenabil.
 * Scopul tău este să evaluezi un scenariu financiar prin prisma compromisului optim
 * dintre Profitabilitate Netă și Amprenta Ecologică / Minimizarera Risipei.
 * 
 * CORE BUSINESS RULES & MATHEMATICAL LOGIC:
 * 1. Penalizare Diferențiată:
 *    - Deșeul Real (Incinerare/Trash) = Cost Distrugere Direct + Penalizare ESG per kg.
 *    - Donația (ONG/Food Bank) = FĂRĂ taxă de distrugere + Economie fiscală.
 * 2. Amortizarea Ecologică (Impact Factor):
 *    - Carne / Semipreparate: Impact Mediu/Carbon Mare (ImpactFactor: 3.0 - 5.0).
 *    - Lactate: Impact Mediu (ImpactFactor: 1.5 - 2.0).
 *    - Conserve / Produse Uscate: Impact Mic (ImpactFactor: 0.5 - 1.0).
 * 3. Bounding Output:
 *    - Returnează un Scor IES ajustat financiar (RON echivalent)
 *    - Opțional: Normalizat la o scară de performanță (0 - 100 pts).
 * ============================================================================
 */

export interface RezultatScorIES {
  scorIESRon: number;          // Valoare Financiară ajustată ESG (pentru algoritmul de decizie)
  scorSustenabilitatePct: number; // Scor vizual 0-100% (pentru UI / Dashboard Manager)
}

export function calculeazaScorIES(
  profitNetRON: number, 
  cantitateWasteKg: number,          // Marfă aruncată efectiv la deșeuri (Trash)
  cantitateDonataKg: number = 0,     // Marfă redirecționată către ONG-uri
  costAchizitieTotalRON: number = 1, // Folosit pentru normalizarea raportului de pierdere
  wasteDisposalCostPerKg: number = 1.2, 
  esgPenaltyPerKg: number = 2.5, 
  impactFactorCategorie: number = 1.0
): RezultatScorIES {
  
  // PROMPT STEP 1: Calculul Penalizării Directe pentru Deșeu Real (Waste/Distrugere)
  // AI REASONING: Fiecare kg aruncat la gunoi generează cost operațional de incinerare + penalizare ESG de carbon.
  const penalizareEcologicaPerKg = wasteDisposalCostPerKg + (esgPenaltyPerKg * impactFactorCategorie);
  const costTotalDeseu = cantitateWasteKg * penalizareEcologicaPerKg;

  // PROMPT STEP 2: Evaluarea Bonificației pentru Donație (Deductibilitate Fiscală / Economie Circulară)
  // AI RULE: Donația elimină taxa de deșeu (wasteDisposalCost = 0) și oferă un credit ESG pozitiv.
  const creditSustenabilitateDonatie = cantitateDonataKg * (wasteDisposalCostPerKg * 0.5);

  // PROMPT STEP 3: Profit Net Ajustat ESG (Valoare Absolută în RON)
  // FORMULĂ: Profit Net Real - Cost Deșeu Ecologic + Bonificație Donație
  const profitAjustatESG = profitNetRON - costTotalDeseu + creditSustenabilitateDonatie;

  // PROMPT STEP 4: Calculul Scorului Normalizat de Sustenabilitate (0 - 100%)
  // AI REASONING: Măsoară cât % din valoarea investită în lot a fost salvată din risipă ecologică.
  const penalizareProcentuală = (costTotalDeseu / Math.max(1, costAchizitieTotalRON)) * 100;
  const scorSustenabilitatePct = Math.min(100, Math.max(0, Math.round(100 - penalizareProcentuală)));

  // PROMPT STEP 5: Returnare Structurată Duală (Matematică Decizie + UI Render)
  return {
    scorIESRon: Math.round(profitAjustatESG),
    scorSustenabilitatePct: scorSustenabilitatePct
  };
}
/**
 * 2. Simulează rezultatele financiare și determină Split-ul Optim X% B2B vs (100-X)% B2C
 */
/**
 * ============================================================================
 * SYSTEM PROMPT / AI INSTRUCTION SPEC: SIMULARE SCENARII FINANCIARE & YIELD ENGINE
 * ============================================================================
 * 
 * SYSTEM ROLE & OBJECTIVE:
 * Acționezi ca un Engine Simulation de Yield Management pentru Retail Alimentar.
 * Scopul tău este să compari 3 scenarii strategice (1. Raft Pasiv, 2. B2B Total, 3. Hibrid AI)
 * și să simulezi dinamica de venituri, costuri de holding (stocare/refrigerare) și risipă.
 * 
 * CORE MATHEMATICAL LOGIC & ELASTICITY RULES:
 * 1. Elasticitatea Cererii la Raft (Boost B2C): Aplicarea unui discount B2C (50%) 
 *    mărește viteza de vânzare zilnică cu un factor de 1.4x (40% mai mulți cumpărători).
 * 2. Dinamica de Timp Rămas: Cantitatea ce mai poate fi vândută la preț întreg depinde 
 *    strict de raportul (oreRămase / oreTotaleValabilitate).
 * 3. Cost de Holding Gradual:
 *    - Marfa rămasă la raft plătește holding integral pe perioada vânzării.
 *    - Marfa transferată pe Bursa B2B este eliberată rapid din magazin (reduce holding cu 60-75%).
 * ============================================================================
 */

export function simuleazaScenariiFinanciare(
  lot: LotAlimentar,
  configCustom?: ConfigurareCategorie
): Record<TipScenariu, RezultatScenariu> {
  // PROMPT STEP 1: Extragere configurare categorie & parametri financiari de bază
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];
  
  const b2bPrice = lot.pretB2BFractie ?? 0.35;
  const expired = lot.oreRămase <= 0;
  const b2bCapacity = expired ? 0 : (lot.capacitateB2B ?? lot.cantitateTotala);
  const donationCapacity = expired ? 0 : (lot.capacitateDonatie ?? 0);
  const score = (profit: number, waste: number, donated = 0) => calculeazaScorIES(
    profit, waste, donated, lot.cantitateTotala * lot.costAchizitieUnitarRON,
    lot.wasteCostPerUnit ?? 1.2, lot.esgPenaltyPerUnit ?? 2.5, lot.impactFactor ?? 1,
  );
  const zileTotal = Math.max(0.1, lot.oreTotaleValabilitate / 24);
  const zileRamase = Math.max(0, lot.oreRămase / 24);
  const raportTimpRamas = Math.min(1, zileRamase / zileTotal);

  const costAchizitieTotal = lot.cantitateTotala * lot.costAchizitieUnitarRON;
  const costHoldingBaza = lot.cantitateTotala * config.costStocarePerKgZiRON * zileRamase;

  // Factor de boost pentru cerere când produsul e la promoție B2C (-50%)
  const FACTOR_ELASTICITATE_PROMO = 1.35; 

  // ===========================================================================
  // SCENARIUL 1: DOAR RAFT B2C (PASIV / CLASIC)
  // ===========================================================================
  // PROMPT STEP 2: Estimare vânzări la raft bazate pe timpul rămas și elasticitate
  // AI RULE: Vânzarea la preț plin se poate face doar în proporție de raportTimpRamas.
  const capVanzarePretPlin = lot.vanzariMediiZilnice * zileRamase * 0.3 * raportTimpRamas;
  const capVanzarePromo = lot.vanzariMediiZilnice * zileRamase * 0.7 * FACTOR_ELASTICITATE_PROMO;
  
  const cantitatePretPlin_S1 = Math.min(lot.cantitateTotala * 0.3, capVanzarePretPlin);
  const cantitatePromo_S1 = Math.min(lot.cantitateTotala - cantitatePretPlin_S1, capVanzarePromo);
  
  const cantitateVandutaTotal_S1 = cantitatePretPlin_S1 + cantitatePromo_S1;
  const cantitateDonata_S1 = Math.max(0, lot.cantitateTotala - cantitateVandutaTotal_S1);

  const venitS1 = (cantitatePretPlin_S1 * lot.pretUnitarRON) + 
                  (cantitatePromo_S1 * lot.pretUnitarRON * 0.5);
  const profitS1 = venitS1 - costAchizitieTotal - costHoldingBaza;
  const donatedS1 = Math.min(donationCapacity, cantitateDonata_S1);
  const wasteS1 = cantitateDonata_S1 - donatedS1;
  const iesS1 = score(profitS1, wasteS1, donatedS1);

  // ===========================================================================
  // SCENARIUL 2: LICHIDARE TOTALĂ B2B (100% BULK LA T2)
  // ===========================================================================
  // PROMPT STEP 3: Trecere rapidă pe bursă. Vinde puțin B2C până la T2, restul B2B.
  const cantitateB2C_S2 = Math.min(lot.cantitateTotala * 0.25, lot.vanzariMediiZilnice * (zileRamase * 0.4));
  const cantitateB2B_S2 = Math.min(b2bCapacity, Math.max(0, lot.cantitateTotala - cantitateB2C_S2));
  const donatedS2 = Math.min(donationCapacity, lot.cantitateTotala - cantitateB2C_S2 - cantitateB2B_S2);
  const wasteS2 = Math.max(0, lot.cantitateTotala - cantitateB2C_S2 - cantitateB2B_S2 - donatedS2);

  const venitS2 = (cantitateB2C_S2 * lot.pretUnitarRON * 0.8) + 
                  (cantitateB2B_S2 * lot.pretUnitarRON * b2bPrice); // Preț mediu de lichidare B2B (35%)
  
  // AI RULE: Salvăm 70% din costul de depozitare pentru volumul dat rapid pe B2B
  const costHoldingS2 = (costHoldingBaza * (cantitateB2C_S2 / lot.cantitateTotala)) + 
                        (costHoldingBaza * (cantitateB2B_S2 / lot.cantitateTotala) * 0.3);
  
  const profitS2 = venitS2 - costAchizitieTotal - costHoldingS2;
  const iesS2 = score(profitS2, wasteS2, donatedS2);

  // ===========================================================================
  // SCENARIUL 3: HIBRID OPTIMIZAT AI (SPLIT DINAMIC X% B2B)
  // ===========================================================================
  // PROMPT STEP 4: Calculul optim al capacității de absorbție B2C și transferul surplusului pe B2B
  const capacitateAbsorbtieRaftB2C = lot.vanzariMediiZilnice * zileRamase * FACTOR_ELASTICITATE_PROMO;
  const surplusRiscRaft = Math.max(0, lot.cantitateTotala - capacitateAbsorbtieRaftB2C);

  // Dynamic Split Calculation (Limitat între 15% și 70% B2B)
  const cotaB2BRationament = surplusRiscRaft / lot.cantitateTotala;
  const procentB2BOptim = Math.min(b2bCapacity / lot.cantitateTotala, 0.70, Math.max(0.15, cotaB2BRationament));
  const procentB2COptim = 1 - procentB2BOptim;

  const cantitateB2COptim = Math.min(capacitateAbsorbtieRaftB2C, lot.cantitateTotala * procentB2COptim);
  const cantitateB2BOptim = lot.cantitateTotala * procentB2BOptim;

  // Venit S3: B2C captează preț plin + promo; B2B lichidează restul la preț superior (40% marjă datorită timing-ului optim)
  const venitB2C_S3 = (cantitateB2COptim * 0.5 * lot.pretUnitarRON) + 
                       (cantitateB2COptim * 0.5 * lot.pretUnitarRON * 0.5);
  const venitB2B_S3 = cantitateB2BOptim * (lot.pretUnitarRON * b2bPrice);

  const venitS3 = venitB2C_S3 + venitB2B_S3;

  // Cost Holding S3: Eficientizat proporțional cu volumul B2B
  const costHoldingS3 = (costHoldingBaza * procentB2COptim * 0.7) + 
                        (costHoldingBaza * procentB2BOptim * 0.25);

  const profitS3 = venitS3 - costAchizitieTotal - costHoldingS3;
  const donatedS3 = Math.min(donationCapacity, Math.max(0, lot.cantitateTotala - cantitateB2COptim - cantitateB2BOptim));
  const cantitateRisipitaS3 = Math.max(0, lot.cantitateTotala - cantitateB2COptim - cantitateB2BOptim - donatedS3); // Sub 0.5% risipă
  const iesS3 = score(profitS3, cantitateRisipitaS3, donatedS3);

  // ===========================================================================
  // PROMPT STEP 5: Formatare și Răspuns Structurat
  // ===========================================================================
  return {
    SCENARIU_1_RAFT: {
      id: 'SCENARIU_1_RAFT',
      titlu: '1. Doar Raft (B2C Clasica)',
      descriere: 'Păstrează tot lotul în magazin cu reduceri treptate. Risc mare de risipă.',
      procentB2B: 0,
      procentB2C: 100,
      venitBrutEstimatRON: Math.round(venitS1),
      costHoldingTotalRON: Math.round(costHoldingBaza),
      profitNetEstimatRON: Math.round(profitS1),
      scorIES: iesS1.scorIESRon,
      scorSustenabilitatePct: iesS1.scorSustenabilitatePct,
      marjaProfitProcent: Math.round((profitS1 / Math.max(1, venitS1)) * 100),
      cantitateDonata: donatedS1, cantitateB2B: 0, cantitateB2C: cantitateVandutaTotal_S1,
      rataRisipaEstimata: Math.round((wasteS1 / lot.cantitateTotala) * 100)
    },
    SCENARIU_2_B2B_INTEGRAL: {
      id: 'SCENARIU_2_B2B_INTEGRAL',
      titlu: '2. Lichidare Totală B2B',
      descriere: 'Trece tot stocul rămas pe Bursa B2B la T2. Elimină risipa, dar taie din marjă.',
      procentB2B: Math.round(cantitateB2B_S2 / lot.cantitateTotala * 100),
      procentB2C: Math.round(cantitateB2C_S2 / lot.cantitateTotala * 100),
      venitBrutEstimatRON: Math.round(venitS2),
      costHoldingTotalRON: Math.round(costHoldingS2),
      profitNetEstimatRON: Math.round(profitS2),
      scorIES: iesS2.scorIESRon,
      scorSustenabilitatePct: iesS2.scorSustenabilitatePct,
      marjaProfitProcent: Math.round((profitS2 / Math.max(1, venitS2)) * 100),
      cantitateDonata: donatedS2, cantitateB2B: cantitateB2B_S2, cantitateB2C: cantitateB2C_S2,
      rataRisipaEstimata: Math.round(wasteS2 / lot.cantitateTotala * 100)
    },
    SCENARIU_3_HIBRID_AI: {
      id: 'SCENARIU_3_HIBRID_AI',
      titlu: '3. Plan Hibrid Optimizat AI',
      descriere: `Trece pe Bursa B2B exact ${Math.round(procentB2BOptim * 100)}% din stoc și păstrează restul de ${Math.round(procentB2COptim * 100)}% la raft.`,
      procentB2B: Math.round(procentB2BOptim * 100),
      procentB2C: Math.round(cantitateB2COptim / lot.cantitateTotala * 100),
      venitBrutEstimatRON: Math.round(venitS3),
      costHoldingTotalRON: Math.round(costHoldingS3),
      profitNetEstimatRON: Math.round(profitS3),
      scorIES: iesS3.scorIESRon,
      scorSustenabilitatePct: iesS3.scorSustenabilitatePct,
      marjaProfitProcent: Math.round((profitS3 / Math.max(1, venitS3)) * 100),
      cantitateDonata: donatedS3, cantitateB2B: cantitateB2BOptim, cantitateB2C: cantitateB2COptim,
      rataRisipaEstimata: Math.round(cantitateRisipitaS3 / lot.cantitateTotala * 100)
    }
  };
}

/**
 * ============================================================================
 * SYSTEM PROMPT / AI INSTRUCTION SPEC: CALCUL SCOR DE RISC EXPIRARE S (0 - 100)
 * ============================================================================
 * 
 * SYSTEM ROLE & OBJECTIVE:
 * Acționezi ca un Modul de Alertă Timpurie (Early Warning Indicator) pentru Retail.
 * Scopul tău este să evaluezi Urgența Operațională a unui lot pe o scară de la 0 la 100:
 *  - 0 - 35  : Risc Scăzut (Verde) - Stocul se vinde în ritm normal la raft.
 *  - 36 - 65 : Risc Mediu (Portocaliu) - Necesită decizie DSS (Discount B2C / Bursa B2B).
 *  - 66 - 100: Risc Critic (Roșu) - Iminență de expirare / Urgență Lichidare sau Donație.
 * 
 * CORE MATHEMATICAL FACTORS:
 * 1. Componenta Temporală (Pondere 60%): Cu cât orele rămase scad raportat la valabilitate, 
 *    cu atât scorul crește accelerat.
 * 2. Componenta Volum vs Viteza (Pondere 40%): Măsoară dacă timpul rămas este suficient 
 *    pentru a absorbi cantitatea la viteza medie zilnică de vânzare.
 * 3. Factorul de Perisabilitate: Amplifică urgența pentru produsele cu risc microbiologic (carne, lactate).
 * ============================================================================
 */

export function calculeazaScorRiscS(
  lot: LotAlimentar
): number {
  // PROMPT STEP 1: Încărcarea configurării și extragerea coeficientului de perisabilitate

  
  // AI RULE: Determinăm factorul dinamic de perisabilitate (Default: 1.0)
  let cPerisabilitate = 1.0;
  if (lot.categorie === 'carne_proaspata') cPerisabilitate = 1.6;
  else if (lot.categorie === 'lactate') cPerisabilitate = 1.2;
  else if (lot.categorie === 'conserve_uscate') cPerisabilitate = 0.5;

  // PROMPT STEP 2: Evaluarea Risc Temporal (Timpul Scurs %)
  const tScurs = Math.max(0, lot.oreTotaleValabilitate - lot.oreRămase);
  const raportTimpScurs = tScurs / Math.max(1, lot.oreTotaleValabilitate);
  
  // AI REASONING: Creștere non-liniară a riscului temporal (exponențială spre finalul valabilității)
  const componentaTimp = Math.pow(raportTimpScurs, 1.2) * 55; // Pondere max 55 puncte

  // PROMPT STEP 3: Evaluarea Raportului Capacitate Absorbție vs Stoc Actual
  const zileRamase = Math.max(0.1, lot.oreRămase / 24);
  const capacitateVanzareRamasa = lot.vanzariMediiZilnice * zileRamase;
  
  // Dacă Stocul > Capacitatea de Vânzare Rămasă, calculăm raportul de supra-stoc
  const raportSurplusStoc = lot.cantitateTotala / Math.max(1, capacitateVanzareRamasa);
  
  // AI BOUNDING: Măsurăm presiunea și o înmulțim cu factorul categoriei
  const componentaStoc = Math.min(45, (raportSurplusStoc - 0.5) * 25 * cPerisabilitate);

  // PROMPT STEP 4: Sumare și Bounding (Garantat între 0 și 100)
  const scorFinal = Math.round(componentaTimp + Math.max(0, componentaStoc));

  return Math.min(100, Math.max(0, scorFinal));
}

