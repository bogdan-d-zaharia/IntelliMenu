// src/data/categoryConfig.ts

export const CONFIGURARI_CATEGORII: Record<string, any> = {
  carne_proaspata: {
    // PRAGURI AXĂ DINAMICĂ (Ponderea din timpul total de valabilitate când se activează trigger-ul)
    pondereBazaB2C: 0.50,         // T1: La 50% timp rămas -> Reducere 50% la Raft
    pondereBazaB2B: 0.25,         // T2: La 25% timp rămas -> Transfer pe Bursa B2B
    sensibilitateStocB2C: 0.12,   // Devansare alertă în caz de presiune mare stoc
    sensibilitateStocB2B: 0.18,
    plafonPresiuneStoc: 2.5,
    oreMinimeDonatie: 8,          // T3: Minim 8 ore înainte de expirare pentru ONG
    procentPlafonDonatie: 0.12,

    // PARAMETRI FINANCIARI & ESG
    costStocarePerKgZiRON: 0.25,  // Cost realist de refrigerare intensivă (ajustat)
    wasteDisposalCostPerKg: 1.5,  // Cost distrugere/incinerare per kg
    esgPenaltyPerKg: 3.5,         // Penalizare amprentă carbon ridicată (carne)
    impactFactor: 3.0             // Factor de ponderare mediu
  },

  lactate: {
    pondereBazaB2C: 0.55,         // T1: La 55% timp rămas -> Reducere la Raft
    pondereBazaB2B: 0.30,         // T2: La 30% timp rămas -> Transfer B2B
    sensibilitateStocB2C: 0.08,
    sensibilitateStocB2B: 0.12,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 12,
    procentPlafonDonatie: 0.10,

    costStocarePerKgZiRON: 0.15,  // Cost frigorific mediu
    wasteDisposalCostPerKg: 1.2,
    esgPenaltyPerKg: 2.5,
    impactFactor: 1.8
  },

  conserve_uscate: {
    pondereBazaB2C: 0.65,         // T1: La 65% timp rămas -> Promoție Raft
    pondereBazaB2B: 0.35,         // T2: La 35% timp rămas -> Lichidare Bulk
    sensibilitateStocB2C: 0.02,
    sensibilitateStocB2B: 0.05,
    plafonPresiuneStoc: 3,
    oreMinimeDonatie: 24,
    procentPlafonDonatie: 0.05,

    costStocarePerKgZiRON: 0.05,  // Depozitare simplă la raft (foarte ieftină)
    wasteDisposalCostPerKg: 1.0,
    esgPenaltyPerKg: 1.5,
    impactFactor: 0.8
  }
};