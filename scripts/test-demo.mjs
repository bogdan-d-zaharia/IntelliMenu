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
const adapter = await import(moduleUrl('../src/lib/firestoreAdapter.ts', { '../data/categoryConfig': configUrl }));
function decode(value) {
  if (value?.__firestoreType === 'Timestamp') return new Timestamp(value.seconds, value.nanoseconds);
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));
  return value;
}
const backup = JSON.parse(readFileSync(new URL('../src/assets/intellimenu-firestore-modified.json', import.meta.url), 'utf8'));
const data = Object.fromEntries(Object.entries(backup.collections).map(([name, docs]) => [name, docs.map(document => ({ id: document.id, ...decode(document.data) }))]));
const now = Date.parse('2026-10-18T07:30:00Z');
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
      assert.ok(scenario.cantitateB2B <= (variant.capacitateB2B ?? variant.cantitateTotala));
      if (!variant.oreRămase) assert.equal(allocated, 0, 'expired inventory must not be sold/donated');
      if (!variant.capacitateB2B) assert.equal(scenario.cantitateB2B, 0);
      count++;
    }
  }
  if (source.unit_of_measure !== 'kg' && !source.weight_per_unit_kg) assert.ok(adapted.warning);
}
assert.ok(engine.calculeazaScorIES(-100, 10).scorIESRon < 0, 'losses must remain negative');
assert.ok(engine.calculeazaScorIES(100, 10, 0, 100, 1, 5, 4).scorIESRon < engine.calculeazaScorIES(100, 10, 0, 100, 1, 1, 1).scorIESRon);
console.log(`Passed: ${data.inventory_lots.length} exported lots, ${count} scenario cases, expiry/capacity/allocation/ESG checks. No live database writes.`);
