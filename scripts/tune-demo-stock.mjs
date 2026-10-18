import { readFileSync, writeFileSync } from 'node:fs';
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
const backupPath = new URL('../src/assets/intellimenu-firestore-modified.json', import.meta.url);
const patchPath = new URL('../src/assets/firestore-formula-patches.json', import.meta.url);
const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
const patches = JSON.parse(readFileSync(patchPath, 'utf8'));
const anchor = Date.parse(backup.demo_expiration_schedule.generated_at_utc);
const summary = [];
for (const document of backup.collections.inventory_lots) {
  // Newly received demo stock: old sales/claims are retained as sample history.
  document.data.received_at = { __firestoreType: 'Timestamp', seconds: Math.floor(anchor / 1000), nanoseconds: 0 };
  let chosen;
  for (let quantity = 40; quantity <= 20000; quantity += 10) {
    document.data.quantity = quantity;
    const data = Object.fromEntries(Object.entries(backup.collections).map(([name, docs]) => [name, docs.map(item => ({ id: item.id, ...decode(item.data) }))]));
    const source = data.inventory_lots.find(item => item.id === document.id);
    const adapted = adapter.adaptLot(source, data.stores.find(item => item.id === source.store_id), data.partners, data.claims, data.sales_history, anchor);
    const scenarios = engine.simuleazaScenariiFinanciare(adapted.lot, adapted.config);
    const result = scenarios.SCENARIU_3_HIBRID_AI;
    const wantsBulk = source.bulk_eligible;
    if (result.cantitateB2C > quantity * 0.05 && result.cantitateDonata > quantity * 0.05
        && (!wantsBulk || result.cantitateB2B > quantity * 0.15)
        && scenarios.SCENARIU_1_RAFT.cantitateRisipita > quantity * 0.1
        && result.intervale.some(row => row.canal === 'full_price' && row.cantitate > 0)
        && result.intervale.some(row => row.canal === 'discount' && row.cantitate > 0)) {
      chosen = result;
      break;
    }
  }
  if (!chosen) throw new Error(`No suitable demo stock found: ${document.id}`);
  const patch = patches.patches.find(item => item.collection === 'inventory_lots' && item.id === document.id);
  patch.replace_fields = { ...patch.replace_fields, quantity: document.data.quantity, received_at: document.data.received_at };
  summary.push({ id: document.id, category: document.data.category, quantity: document.data.quantity, unit: document.data.unit_of_measure,
    retail: Number(chosen.cantitateB2C.toFixed(2)), social: Number(chosen.cantitateB2B.toFixed(2)), donation: Number(chosen.cantitateDonata.toFixed(2)), waste: Number(chosen.cantitateRisipita.toFixed(2)) });
}
backup.demo_stock_scenarios = { evaluated_at_utc: new Date(anchor).toISOString(), note: 'Synthetic newly received lots sized to demonstrate retail, eligible bulk buyers and NGO donations. Existing sales/claims remain sample historical data.', lots: summary };
writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n');
writeFileSync(patchPath, JSON.stringify(patches, null, 2) + '\n');
console.table(summary);
console.log('Updated JSON and import patches only. No live writes.');
