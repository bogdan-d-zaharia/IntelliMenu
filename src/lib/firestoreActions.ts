import { collection, doc, getDocFromServer, getDocsFromServer, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { RezultatScenariu } from '../types/yield.types';
import type { InventoryRecord, PartnerRecord, StoreRecord, SaleRecord, ClaimRecord } from '../data/FirestoreProvider';
import { adaptLot, compatiblePartners } from './firestoreAdapter';
import { simuleazaScenariiFinanciare } from './yieldEngine';
import { requestAIMatchmaking, validateAIAllocations, remainingCapacity, reservationDay } from './matchmaking';

async function readCollection<T>(name: string): Promise<T[]> {
  const snapshot = await getDocsFromServer(collection(db, name));
  return snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as T);
}

export async function applyPlan(lot: InventoryRecord, requested: RezultatScenariu, onProgress?: (message: string) => void) {
  onProgress?.('Se citesc datele actuale din Firestore...');
  // Discovery reads come from the server. Transaction retries re-read partner
  // demand/priority, so simultaneous plans cannot reserve the same demand twice.
  const [partnerCandidates, sales, inventory, initialClaims] = await Promise.all([
    readCollection<PartnerRecord>('partners'), readCollection<SaleRecord>('sales_history'), readCollection<InventoryRecord>('inventory_lots'), readCollection<ClaimRecord>('claims'),
  ]);
  const initialLot = inventory.find(item => item.id === lot.id);
  if (!initialLot) throw new Error('Lotul nu mai există.');
  if (initialLot.distribution_plan || initialLot.status === 'reserved') throw new Error('Acest lot are deja un plan rezervat.');
  const startedAt = Date.now();
  if (initialLot.expiration_date.toMillis() <= startedAt) throw new Error('Lotul a expirat.');
  if (initialClaims.some(claim => claim.lot_id === lot.id && ['pending', 'accepted'].includes(claim.status))) throw new Error('Lotul are deja rezervări active.');
  const initialStore = await getDocFromServer(doc(db, 'stores', initialLot.store_id));
  if (!initialStore.exists()) throw new Error('Magazinul lotului nu există.');
  const initialPartners = compatiblePartners(initialLot, partnerCandidates, startedAt, initialClaims).filter(partner => partner.last_fulfilled_at !== undefined
    && Number.isFinite(partner.current_demand_by_category_kg?.[initialLot.category]) && partner.current_demand_by_category_kg![initialLot.category] > 0);
  if (!initialPartners.length) throw new Error('Niciun beneficiar eligibil nu are necesar real disponibil.');
  const initialAdapted = adaptLot(initialLot, { ...initialStore.data(), id: initialStore.id } as StoreRecord, initialPartners, initialClaims, sales, startedAt);
  const initialScenario = simuleazaScenariiFinanciare(initialAdapted.lot, initialAdapted.config)[requested.id];
  if (!initialScenario) throw new Error('Scenariu invalid.');
  const initialTargets = { social: initialScenario.cantitateB2B ?? 0, donation: initialScenario.cantitateDonata ?? 0 };
  const initialCapacities = new Map(initialPartners.map(partner => [partner.id, remainingCapacity(partner, initialClaims, inventory, reservationDay(startedAt))]));
  onProgress?.('AI-ul analizează lotul și propune distribuția către beneficiari...');
  // The external model call runs ONCE, outside transaction retries and locks.
  const proposal = await requestAIMatchmaking(initialLot, initialPartners, initialTargets, initialCapacities);
  const result = await runTransaction(db, async transaction => {
    onProgress?.('Se verifică lotul, necesarul și rezervările existente...');
    const reference = doc(db, 'inventory_lots', lot.id);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('Lotul nu mai există.');
    const current = { ...snapshot.data(), id: snapshot.id } as InventoryRecord;
    if (current.distribution_plan || current.status === 'reserved') throw new Error('Acest lot are deja un plan rezervat.');
    const now = Date.now();
    if (current.expiration_date.toMillis() <= now) throw new Error('Lotul a expirat.');
    const storeSnapshot = await transaction.get(doc(db, 'stores', current.store_id));
    if (!storeSnapshot.exists()) throw new Error('Magazinul lotului nu există.');
    const store = { ...storeSnapshot.data(), id: storeSnapshot.id } as StoreRecord;
    const partnerSnapshots = await Promise.all(partnerCandidates.map(partner => transaction.get(doc(db, 'partners', partner.id))));
    const partners = partnerSnapshots.filter(item => item.exists()).map(item => ({ ...item.data(), id: item.id }) as PartnerRecord);
    // Read claims AFTER partner versions. Every allocation and fulfillment writes
    // its partner too, forcing a retry if reservations change after these reads.
    const claims = await readCollection<ClaimRecord>('claims');
    if (claims.some(claim => claim.lot_id === current.id && ['pending', 'accepted'].includes(claim.status))) {
      throw new Error('Lotul are deja rezervări active. Finalizează sau rezolvă rezervările existente înainte de un plan nou.');
    }
    const eligible = compatiblePartners(current, partners, now, claims);
    const configured = eligible.filter(partner => partner.last_fulfilled_at !== undefined
      && Number.isFinite(partner.current_demand_by_category_kg?.[current.category])
      && partner.current_demand_by_category_kg![current.category] > 0);
    if (!configured.length) throw new Error('Niciun beneficiar eligibil nu are necesar real disponibil. Completează current_demand_by_category_kg și last_fulfilled_at în Firestore (null doar dacă nu a primit niciodată).');
    onProgress?.('Se recalculează distribuția și se selectează beneficiarii...');
    const day = reservationDay(now);
    const capacities = new Map(configured.map(partner => [partner.id, remainingCapacity(partner, claims, inventory, day)]));
    // Recalculate from live data and available demand; never trust client quantities/prices.
    // Keep the forecast's time anchor stable during model latency; expiry and
    // pickup eligibility above are still checked against the actual current time.
    const adapted = adaptLot(current, store, configured, claims, sales, startedAt);
    const scenario = simuleazaScenariiFinanciare(adapted.lot, adapted.config)[requested.id];
    if (!scenario) throw new Error('Scenariu invalid.');
    const allocations = validateAIAllocations(proposal, current, configured, initialTargets, capacities);
    if (current.quantity !== initialLot.quantity || current.category !== initialLot.category || current.store_id !== initialLot.store_id
      || current.weight_per_unit_kg !== initialLot.weight_per_unit_kg || !current.expiration_date.isEqual(initialLot.expiration_date)) {
      throw new Error('Lotul s-a modificat în timpul răspunsului AI. Reexecută planul.');
    }
    const currentTargets = { social: scenario.cantitateB2B ?? 0, donation: scenario.cantitateDonata ?? 0 };
    const step = current.unit_of_measure === 'buc' ? 1 : 0.001;
    if (Math.abs(currentTargets.social - initialTargets.social) > step || Math.abs(currentTargets.donation - initialTargets.donation) > step) {
      throw new Error('Datele simulării s-au modificat în timpul răspunsului AI. Reexecută planul.');
    }
    if (!allocations.length) throw new Error('Planul recalculat nu are cantități alocabile către beneficiari. Nicio rezervare nu a fost salvată.');
    if (allocations.length > 200) throw new Error('Prea mulți beneficiari pentru o singură tranzacție.');
    const claimRefs = allocations.map(item => doc(db, 'claims', `plan_${current.id}_${item.partner.id}_${item.channel}`));
    const priorClaims = await Promise.all(claimRefs.map(claimRef => transaction.get(claimRef)));
    if (priorClaims.some(item => item.exists())) throw new Error('Există deja alocări pentru acest lot.');
    const totalSocial = allocations.filter(item => item.channel === 'social').reduce((sum, item) => sum + item.quantity, 0);
    const totalDonation = allocations.filter(item => item.channel === 'donation').reduce((sum, item) => sum + item.quantity, 0);
    const reserved = totalSocial + totalDonation;
    if (reserved > current.quantity + 1e-8) throw new Error('Alocarea depășește stocul.');
    const actualRevenue = Math.round((scenario.intervale.filter(item => item.canal === 'full_price' || item.canal === 'discount').reduce((sum, item) => sum + item.venitRON, 0)
      + allocations.reduce((sum, item) => sum + item.quantity * item.price, 0)) * 100) / 100;
    const actualIntervals = scenario.intervale.flatMap(interval => interval.canal === 'social' || interval.canal === 'donation'
      ? allocations.filter(item => item.channel === (interval.canal === 'social' ? 'social' : 'donation')).map(item => ({
        ...interval, cantitate: item.quantity, pretUnitarRON: item.price, venitRON: item.quantity * item.price, partner_id: item.partner.id,
      })) : [interval]);
    let ledgerStock = current.quantity;
    const persistedIntervals = actualIntervals.map(interval => {
      const stocInitial = ledgerStock;
      ledgerStock = Math.max(0, ledgerStock - interval.cantitate);
      return { ...interval, stocInitial, stocFinal: ledgerStock };
    });
    onProgress?.(`Se salvează ${allocations.length} rezervări și statusul lotului...`);
    allocations.forEach((item, index) => {
      transaction.set(claimRefs[index], {
        lot_id: current.id, store_id: current.store_id, partner_id: item.partner.id,
        plan_id: current.id, channel: item.channel, category: current.category,
        claimed_quantity: item.quantity, claimed_weight_kg: item.weightKg, unit_of_measure: current.unit_of_measure,
        price_per_unit: item.price, total_price: Math.round(item.quantity * item.price * 100) / 100,
        claimed_at: Timestamp.fromMillis(now), reservation_day: day,
        pickup_deadline: Timestamp.fromMillis(Math.min(current.expiration_date.toMillis(), now + item.partner.pickup_sla_hours! * 3600000)),
        status: 'pending', pickup_code: claimRefs[index].id,
      });
      transaction.update(doc(db, 'partners', item.partner.id), {
        current_demand_by_category_kg: { ...item.partner.current_demand_by_category_kg,
          [current.category]: Math.max(0, item.partner.current_demand_by_category_kg![current.category] - item.weightKg) },
      });
    });
    transaction.update(reference, {
      status: 'reserved', reserved_quantity: reserved, unreserved_quantity: current.quantity - reserved,
      distribution_plan: {
        scenario: scenario.id, title: scenario.titlu, b2b_pct: totalSocial / current.quantity * 100,
        b2c_pct: scenario.procentB2C, b2b_quantity: totalSocial, b2c_quantity: scenario.cantitateB2C ?? 0,
        donation_quantity: totalDonation, donation_remaining: 0, claim_ids: claimRefs.map(item => item.id),
        projected_net_financial: Math.round((scenario.profitNetEstimatRON + actualRevenue - scenario.venitBrutEstimatRON) * 100) / 100,
        intervals: persistedIntervals,
        projected_revenue: actualRevenue, projected_waste_quantity: scenario.cantitateRisipita,
        unallocated_partner_quantity: Math.max(0, (scenario.cantitateB2B ?? 0) + (scenario.cantitateDonata ?? 0) - reserved),
        applied_at: Timestamp.fromMillis(now),
        simulated_at: Timestamp.fromMillis(startedAt),
        matchmaking_method: 'askAI',
      },
    });
    return { claimIds: claimRefs.map(item => item.id), reservedQuantity: reserved };
  });
  return result;
}

export async function completeClaim(claimId: string) {
  await runTransaction(db, async transaction => {
    const reference = doc(db, 'claims', claimId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('Rezervarea nu există.');
    const claim = snapshot.data();
    if (claim.status === 'completed') return;
    if (!['pending', 'accepted'].includes(claim.status)) throw new Error('Rezervarea nu poate fi finalizată.');
    const partnerRef = doc(db, 'partners', claim.partner_id);
    const partner = await transaction.get(partnerRef);
    if (!partner.exists()) throw new Error('Beneficiarul nu mai există.');
    const now = Timestamp.now();
    const previous = partner.data().last_fulfilled_at;
    transaction.update(reference, { status: 'completed', completed_at: now });
    transaction.update(partnerRef, { last_fulfilled_at: previous instanceof Timestamp && previous.toMillis() > now.toMillis() ? previous : now });
  });
}

// Older screens may still offer manual claiming; new plans allocate automatically.
export async function claimDonation(lot: InventoryRecord, partner: PartnerRecord) {
  const reference = doc(db, 'claims', `plan_${lot.id}_${partner.id}_donation`);
  const snapshot = await getDocFromServer(reference);
  if (snapshot.exists()) return snapshot.id;
  throw new Error('Donațiile se alocă automat la Execută plan. Nu există o rezervare pentru acest beneficiar.');
}
