import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { Timestamp } from 'firebase/firestore';

function moduleUrl(path, replacements = {}) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8');
  for (const [from, to] of Object.entries(replacements)) source = source.replaceAll(`'${from}'`, `'${to}'`);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023 } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const configUrl = moduleUrl('../src/data/categoryConfig.ts');
const engine = await import(moduleUrl('../src/lib/yieldEngine.ts', { '../data/categoryConfig': configUrl }));
const matchmakingUrl = moduleUrl('../src/lib/matchmaking.ts');
const adapter = await import(moduleUrl('../src/lib/firestoreAdapter.ts', { '../data/categoryConfig': configUrl, './matchmaking': matchmakingUrl }));
function decode(value) {
  if (value?.__firestoreType === 'Timestamp') return new Timestamp(value.seconds, value.nanoseconds);
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));
  return value;
}
const backup = JSON.parse(readFileSync(new URL('../src/assets/intellimenu-firestore-modified.json', import.meta.url), 'utf8'));
const data = Object.fromEntries(Object.entries(backup.collections).map(([name, docs]) => [name, docs.map(document => ({ id: document.id, ...decode(document.data) }))]));
const now = Date.parse(backup.demo_stock_scenarios?.evaluated_at_utc ?? '2026-10-18T07:30:00Z');
let count = 0;
for (const source of data.inventory_lots) {
  const adapted = adapter.adaptLot(source, data.stores.find(store => store.id === source.store_id), data.partners, data.claims, data.sales_history, now);
  assert.equal(adapted.lot.id, source.id);
  assert.equal(adapted.config.costStocarePerKgZiRON, source.holding_cost_per_day);
  const thresholds = engine.calculeazaIntervaleAxaDinamice(adapted.lot, adapted.config);
  assert.ok(thresholds.pB2C > thresholds.pB2B && thresholds.pB2B > thresholds.pDonatie);
  for (const variant of [adapted.lot, { ...adapted.lot, oreRămase: 0 }, { ...adapted.lot, capacitateB2B: 0, capacitateDonatie: 0 }]) {
    for (const scenario of Object.values(engine.simuleazaScenariiFinanciare(variant, adapted.config))) {
      for (const [key, value] of Object.entries(scenario)) if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
      const allocated = scenario.cantitateB2B + scenario.cantitateB2C + scenario.cantitateDonata;
      assert.ok(allocated <= variant.cantitateTotala + 1e-8);
      assert.ok(allocated >= 0);
      assert.ok(Math.abs(allocated + scenario.cantitateRisipita - variant.cantitateTotala) < 1e-8, 'inventory conservation');
      const revenue = scenario.intervale.reduce((sum, row) => sum + row.cantitate * row.pretUnitarRON, 0);
      assert.ok(Math.abs(revenue - scenario.venitBrutEstimatRON) <= 0.0051, 'revenue must equal the interval ledger');
      let stock = variant.cantitateTotala;
      for (const row of scenario.intervale) {
        assert.ok(Math.abs(row.stocInitial - stock) < 1e-8, 'stock ledger must be continuous');
        assert.ok(row.deLaOre >= row.panaLaOre && row.panaLaOre >= 0);
        assert.ok(Math.abs(row.stocInitial - row.cantitate - row.stocFinal) < 1e-8);
        assert.ok(Math.abs(row.venitRON - row.cantitate * row.pretUnitarRON) < 1e-8);
        if (row.canal === 'donation' || row.canal === 'waste') assert.equal(row.venitRON, 0);
        if (row.canal === 'full_price' && row.cantitate > 0) assert.ok(row.deLaOre > thresholds.pB2C);
        stock = row.stocFinal;
      }
      assert.ok(Math.abs(stock) < 1e-8);
      assert.ok(scenario.cantitateB2B <= (variant.capacitateB2B ?? variant.cantitateTotala));
      if (!variant.oreRămase) assert.equal(allocated, 0, 'expired inventory must not be sold/donated');
      if (!variant.capacitateB2B) assert.equal(scenario.cantitateB2B, 0);
      count++;
    }
  }
  if (source.unit_of_measure !== 'kg' && !source.weight_per_unit_kg) assert.ok(adapted.warning);
}
assert.ok(engine.calculeazaScorIES(-100, 10).scorIESRon < 0, 'losses must remain negative');
const handConfig = { pondereBazaB2C: 0.5, pondereBazaB2B: 0.25, sensibilitateStocB2C: 0, sensibilitateStocB2B: 0, plafonPresiuneStoc: 3, oreMinimeDonatie: 6, procentPlafonDonatie: 0.1, costStocarePerKgZiRON: 0 };
const handLot = { id: 'manual', nume: 'Manual', categorie: 'lactate', cantitateTotala: 100, vanzariMediiZilnice: 24, oreTotaleValabilitate: 144, oreRămase: 96, pretUnitarRON: 10, costAchizitieUnitarRON: 2, capacitateB2B: 0, capacitateDonatie: 0, wasteCostPerUnit: 1 };
const handResult = engine.simuleazaScenariiFinanciare(handLot, handConfig).SCENARIU_1_RAFT;
// 24h full-price: 24 x 10; remaining 76 units at 50%: 76 x 5.
assert.equal(handResult.venitBrutEstimatRON, 620);
assert.equal(handResult.profitNetEstimatRON, 420);
assert.equal(handResult.cantitateRisipita, 0);
const zeroDemand = engine.simuleazaScenariiFinanciare({ ...handLot, vanzariMediiZilnice: 0 }, handConfig).SCENARIU_1_RAFT;
assert.equal(zeroDemand.venitBrutEstimatRON, 0);
assert.equal(zeroDemand.cantitateRisipita, 100);
assert.equal(zeroDemand.costDeseuriRON, 100);
assert.equal(zeroDemand.profitNetEstimatRON, -300);
assert.ok(engine.calculeazaScorIES(100, 10, 0, 100, 1, 5, 4).scorIESRon < engine.calculeazaScorIES(100, 10, 0, 100, 1, 1, 1).scorIESRon);
console.log(`Passed: ${data.inventory_lots.length} exported lots, ${count} scenario cases, expiry/capacity/allocation/ESG checks. No live database writes.`);
