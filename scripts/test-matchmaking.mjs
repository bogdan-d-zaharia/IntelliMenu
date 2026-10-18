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
process.on('uncaughtException', error => { console.error(error.message); process.exitCode = 1; });
const mockAi = `data:text/javascript;base64,${Buffer.from('export async function askAI(prompt){return globalThis.matchTest.askAI(prompt);}').toString('base64')}`;
const matchingUrl = moduleUrl('../src/lib/matchmaking.ts', { '../ai': mockAi });
const matching = await import(matchingUrl);
const configUrl = moduleUrl('../src/data/categoryConfig.ts');
const engineUrl = moduleUrl('../src/lib/yieldEngine.ts', { '../data/categoryConfig': configUrl });
const adapterUrl = moduleUrl('../src/lib/firestoreAdapter.ts', { '../data/categoryConfig': configUrl, './matchmaking': matchingUrl });
function clone(value) {
  if (value instanceof Timestamp) return value;
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  return value;
}
let documents = new Map();
let versions = new Map();
let failCommit = false;
function snapshot(path) {
  return { id: path.split('/').at(-1), exists: () => documents.has(path), data: () => clone(documents.get(path)) };
}
globalThis.matchTest = {
  Timestamp,
  askAI: async prompt => {
    const input = JSON.parse(prompt.slice(prompt.lastIndexOf('\n') + 1));
    const lot = { ...documents.get(`inventory_lots/${input.lot.id}`), id: input.lot.id };
    const partners = input.partners.map(item => ({ ...documents.get(`partners/${item.id}`), id: item.id }));
    const allocations = matching.allocatePartners(lot, partners, input.targets, new Map(input.partners.map(item => [item.id, item.available_capacity_kg])));
    return JSON.stringify({ allocations: allocations.map(item => ({ partner_id: item.partner.id, channel: item.channel, quantity: item.quantity })) });
  },
  doc: (_db, name, id) => ({ id, path: `${name}/${id}` }),
  collection: (_db, name) => name,
  getDocFromServer: async ref => snapshot(ref.path),
  getDocsFromServer: async name => ({ docs: [...documents.keys()].filter(path => path.startsWith(`${name}/`)).map(snapshot) }),
  runTransaction: async (_db, callback) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const reads = new Map();
      const writes = [];
      const result = await callback({
        get: async ref => { reads.set(ref.path, versions.get(ref.path) ?? 0); return snapshot(ref.path); },
        update: (ref, data) => writes.push({ ref, data, update: true }),
        set: (ref, data) => writes.push({ ref, data, update: false }),
      });
      if ([...reads].some(([path, version]) => (versions.get(path) ?? 0) !== version)) continue;
      if (failCommit) throw new Error('Injected commit failure');
      for (const write of writes) {
        documents.set(write.ref.path, clone(write.update ? { ...documents.get(write.ref.path), ...write.data } : write.data));
        versions.set(write.ref.path, (versions.get(write.ref.path) ?? 0) + 1);
      }
      return result;
    }
    throw new Error('Too much contention');
  },
};
const mockFirestore = `data:text/javascript;base64,${Buffer.from('export const {Timestamp,doc,collection,getDocFromServer,getDocsFromServer,runTransaction}=globalThis.matchTest;').toString('base64')}`;
const mockDb = `data:text/javascript;base64,${Buffer.from('export const db={};').toString('base64')}`;
const actions = await import(moduleUrl('../src/lib/firestoreActions.ts', {
  'firebase/firestore': mockFirestore, '../firebase': mockDb,
  './firestoreAdapter': adapterUrl, './yieldEngine': engineUrl, './matchmaking': matchingUrl,
}));
const now = Date.now();
const stamp = ms => Timestamp.fromMillis(ms);
const sourceLot = { id: 'lot', store_id: 'store', category: 'dairy', quantity: 500, unit_of_measure: 'kg', expiration_date: stamp(now + 7 * 86400000), received_at: stamp(now - 3600000), price_per_unit: 10, cost_price_per_unit: 2, holding_cost_per_day: 0.1, bulk_eligible: true, status: 'pending_ai_review' };
const partner = (id, type, demand, last, price = 0.35) => ({ id, name: id, type, accepted_categories: ['dairy'], has_refrigeration: true, daily_capacity_kg: 1000, pickup_sla_hours: 4, offered_price_pct: price, current_demand_by_category_kg: { dairy: demand }, last_fulfilled_at: last });
const candidates = [partner('a', 'bulk_buyer', 100, null), partner('b', 'bulk_buyer', 500, stamp(now - 86400000), 0.4), partner('ngo', 'ngo', 1000, null)];
function reset(partners = candidates) {
  documents = new Map([
    ['inventory_lots/lot', clone(sourceLot)],
    ['stores/store', { id: 'store', name: 'Store', avg_daily_sales_by_category: { dairy: 1 }, esg_waste_penalty_per_kg: 2.5 }],
    ...partners.map(item => [`partners/${item.id}`, clone(item)]),
  ]);
  versions = new Map(); failCommit = false;
}
const request = { id: 'SCENARIU_3_HIBRID_AI', cantitateB2B: 999999, cantitateDonata: 999999 };
reset();
const result = await actions.applyPlan(sourceLot, request);
assert.ok(result.claimIds.length >= 3, 'split between multiple real beneficiaries');
assert.equal(documents.get('inventory_lots/lot').status, 'reserved');
const claims = [...documents].filter(([path]) => path.startsWith('claims/')).map(([, data]) => data);
assert.equal(claims.find(claim => claim.partner_id === 'a').claimed_quantity, 100, 'never fulfilled partner first, demand caps allocation');
assert.ok(claims.reduce((sum, claim) => sum + claim.claimed_quantity, 0) <= sourceLot.quantity);
for (const claim of claims) {
  const initial = candidates.find(item => item.id === claim.partner_id);
  assert.equal(documents.get(`partners/${initial.id}`).current_demand_by_category_kg.dairy, initial.current_demand_by_category_kg.dairy - claim.claimed_weight_kg);
  assert.equal(documents.get(`partners/${initial.id}`).last_fulfilled_at, initial.last_fulfilled_at, 'reservation must not change fulfillment priority');
  assert.equal(claim.price_per_unit, claim.channel === 'donation' ? 0 : sourceLot.price_per_unit * initial.offered_price_pct);
}
await assert.rejects(() => actions.applyPlan(sourceLot, request), /deja/);
const claimId = result.claimIds[0];
await actions.completeClaim(claimId);
assert.equal(documents.get(`claims/${claimId}`).status, 'completed');
const fulfilled = documents.get('partners/a').last_fulfilled_at;
assert.ok(fulfilled instanceof Timestamp);
await actions.completeClaim(claimId);
assert.equal(documents.get('partners/a').last_fulfilled_at, fulfilled);
reset();
const race = await Promise.allSettled([actions.applyPlan(sourceLot, request), actions.applyPlan(sourceLot, request)]);
assert.equal(race.filter(item => item.status === 'fulfilled').length, 1, 'duplicate simultaneous click commits once');
reset();
documents.set('inventory_lots/other', { ...clone(sourceLot), id: 'other' });
await Promise.allSettled([actions.applyPlan(sourceLot, request), actions.applyPlan({ ...sourceLot, id: 'other' }, request)]);
for (const initial of candidates) {
  const total = [...documents].filter(([path, data]) => path.startsWith('claims/') && data.partner_id === initial.id).reduce((sum, [, data]) => sum + data.claimed_weight_kg, 0);
  assert.ok(total <= initial.current_demand_by_category_kg.dairy + 1e-8, 'two lots cannot consume the same demand twice');
  assert.ok(total <= initial.daily_capacity_kg + 1e-8, 'two lots share the daily capacity');
  assert.ok(documents.get(`partners/${initial.id}`).current_demand_by_category_kg.dairy >= 0);
}
reset(); failCommit = true;
await assert.rejects(() => actions.applyPlan(sourceLot, request), /Injected/);
assert.equal(documents.get('inventory_lots/lot').status, 'pending_ai_review');
assert.equal(documents.get('partners/a').current_demand_by_category_kg.dairy, 100);
assert.equal([...documents.keys()].filter(path => path.startsWith('claims/')).length, 0);
reset(candidates.map(({ current_demand_by_category_kg, last_fulfilled_at, ...item }) => item));
await assert.rejects(() => actions.applyPlan(sourceLot, request), /necesar real/);
assert.equal(documents.get('inventory_lots/lot').status, 'pending_ai_review');
reset(); documents.get('inventory_lots/lot').expiration_date = stamp(now - 1);
await assert.rejects(() => actions.applyPlan(sourceLot, request), /expirat/);
const piece = { ...sourceLot, unit_of_measure: 'buc', weight_per_unit_kg: 0.5 };
const allocated = matching.allocatePartners(piece, candidates, { social: 18.7, donation: 2.8 }, new Map(candidates.map(item => [item.id, 1000])));
assert.ok(allocated.every(item => Number.isInteger(item.quantity)));
assert.equal(allocated.reduce((sum, item) => sum + item.quantity, 0), 20);
console.log('Passed: live-input recomputation, priority, splitting, demand deduction, prices, whole units, fulfillment, idempotency, concurrent clicks, atomic failure, missing data and expiry (mock transactions; no live writes).');

reset();
const actualAsk = globalThis.matchTest.askAI;
globalThis.matchTest.askAI = async () => '{"allocations":[{"partner_id":"invented","channel":"social","quantity":99999}]}';
await assert.rejects(() => actions.applyPlan(sourceLot, request), /Propunerea AI/);
assert.equal(documents.get('inventory_lots/lot').status, 'pending_ai_review');
assert.equal([...documents.keys()].filter(path => path.startsWith('claims/')).length, 0);
globalThis.matchTest.askAI = async () => { throw new Error('AI unavailable'); };
await assert.rejects(() => actions.applyPlan(sourceLot, request), /AI unavailable/);
assert.equal(documents.get('inventory_lots/lot').status, 'pending_ai_review');
globalThis.matchTest.askAI = actualAsk;
console.log('Passed: askAI is invoked, invalid AI allocations rejected and AI failures do not write to Firestore.');
