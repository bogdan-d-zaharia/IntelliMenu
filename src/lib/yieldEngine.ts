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
  const config = configCustom || CONFIGURARI_CATEGORII[lot.categorie];
  const praguri = calculeazaIntervaleAxaDinamice(lot, config);
  const remaining = Math.max(0, Math.min(lot.oreRămase, lot.oreTotaleValabilitate));
  const quantity = lot.cantitateTotala;
  if (!(quantity > 0) || !Number.isFinite(quantity)) throw new Error('Cantitate invalidă.');
  // Existing graphs model assumptions, overridden when supplied by Firestore.
  const discount = lot.retailDiscountPct ?? 0.5;
  const elasticity = lot.promoDemandMultiplier ?? 1.35;
  const socialPrice = lot.pretUnitarRON * (lot.pretB2BFractie ?? 0.35);
  const capacityB2B = remaining > 0 ? Math.max(0, lot.capacitateB2B ?? quantity) : 0;
  const capacityDonation = remaining > 0 ? Math.max(0, lot.capacitateDonatie ?? 0) : 0;
  const daily = Math.max(0, lot.vanzariMediiZilnice);
  const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const ids: TipScenariu[] = ['SCENARIU_1_RAFT', 'SCENARIU_2_B2B_INTEGRAL', 'SCENARIU_3_HIBRID_AI'];
  const results = {} as Record<TipScenariu, RezultatScenariu>;
  for (const id of ids) {
    const baseline = id === 'SCENARIU_1_RAFT';
    const hybrid = id === 'SCENARIU_3_HIBRID_AI';
    const donationEnabled = !baseline && capacityDonation > 0;
    const donationTime = donationEnabled ? Math.min(remaining, praguri.pDonatie) : 0;
    const fullHours = Math.max(0, remaining - praguri.pB2C);
    const promoHours = Math.max(0, Math.min(remaining, praguri.pB2C) - donationTime);
    const retailCapacity = daily * (fullHours + promoHours * elasticity) / 24;
    // Retain the stock-pressure split from graphs (15%-70% B2B), bounded by partners.
    const surplusShare = Math.max(0, quantity - retailCapacity) / quantity;
    const targetB2B = baseline ? 0 : hybrid
      ? Math.min(capacityB2B, quantity * Math.min(0.7, Math.max(0.15, surplusShare)))
      : Math.min(capacityB2B, quantity);
    let stock = quantity;
    let holding = 0;
    let b2bDone = false;
    let donationDone = false;
    const intervale: RezultatScenariu['intervale'] = [];
    const record = (from: number, to: number, canal: RezultatScenariu['intervale'][number]['canal'], price: number, requested: number) => {
      const taken = Math.min(stock, Math.max(0, requested));
      const initial = stock;
      stock = Math.max(0, stock - taken);
      const entry = { deLaOre: from, panaLaOre: to, canal, pretUnitarRON: round(price), cantitate: taken, venitRON: taken * round(price), stocInitial: initial, stocFinal: stock };
      intervale.push(entry);
      return taken;
    };
    const times = [...new Set([remaining, praguri.pB2C, praguri.pB2B, praguri.pDonatie, 0].filter(hours => hours <= remaining))].sort((a, b) => b - a);
    for (let index = 0; index < times.length - 1; index++) {
      const from = times[index];
      const to = times[index + 1];
      // Bulk and donation are discrete pickups at their trigger; zero-duration rows.
      if (!baseline && !b2bDone && from <= praguri.pB2B) {
        record(from, from, 'social', socialPrice, targetB2B);
        b2bDone = true;
      }
      if (donationEnabled && !donationDone && from <= praguri.pDonatie) {
        record(from, from, 'donation', 0, capacityDonation);
        donationDone = true;
      }
      const discounted = from <= praguri.pB2C;
      const price = lot.pretUnitarRON * (discounted ? 1 - discount : 1);
      const rate = daily * (discounted ? elasticity : 1) / 24;
      const initial = stock;
      // After the donation trigger, stock is reserved for collection/disposal.
      const sold = record(from, to, discounted ? 'discount' : 'full_price', price,
        donationEnabled && from <= praguri.pDonatie ? 0 : rate * (from - to));
      // Exact integral under constant-rate sales, including early stock exhaustion.
      const sellHours = rate > 0 ? Math.min(from - to, sold / rate) : 0;
      holding += config.costStocarePerKgZiRON / 24 * (initial * sellHours - rate * sellHours * sellHours / 2 + stock * (from - to - sellHours));
    }
    const waste = stock;
    record(0, 0, 'waste', 0, waste);
    const sum = (channels: string[]) => intervale.filter(entry => channels.includes(entry.canal)).reduce((total, entry) => total + entry.cantitate, 0);
    const retail = sum(['full_price', 'discount']);
    const bulk = sum(['social']);
    const donated = sum(['donation']);
    const revenue = intervale.reduce((total, entry) => total + entry.venitRON, 0);
    const acquisition = quantity * lot.costAchizitieUnitarRON;
    const disposal = waste * (lot.wasteCostPerUnit ?? 0);
    const profit = revenue - acquisition - holding - disposal;
    // Disposal was already deducted from net profit: apply ESG only once here.
    const ies = calculeazaScorIES(profit, waste, donated, acquisition, 0, lot.esgPenaltyPerUnit ?? 2.5, lot.impactFactor ?? 1);
    results[id] = {
      id, titlu: baseline ? '1. Doar Raft (B2C)' : hybrid ? '3. Plan Hibrid Optimizat AI' : '2. Lichidare B2B la T2',
      descriere: `Raft: ${retail.toFixed(1)} · B2B: ${bulk.toFixed(1)} · Donații: ${donated.toFixed(1)} · Risipă: ${waste.toFixed(1)} (unitatea lotului).`,
      procentB2B: Math.round(bulk / quantity * 100), procentB2C: Math.round(retail / quantity * 100),
      venitBrutEstimatRON: round(revenue), costHoldingTotalRON: round(holding), profitNetEstimatRON: round(profit),
      scorIES: ies.scorIESRon, scorSustenabilitatePct: ies.scorSustenabilitatePct,
      marjaProfitProcent: Math.round(profit / Math.max(1, revenue) * 100),
      rataRisipaEstimata: round(waste / quantity * 100),
      cantitateDonata: donated, cantitateB2B: bulk, cantitateB2C: retail,
      cantitateRisipita: waste, costDeseuriRON: round(disposal), intervale,
    };
  }
  return results;
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

