import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { RezultatScenariu } from '../types/yield.types';
import type { InventoryRecord, PartnerRecord } from '../data/FirestoreProvider';

export async function applyPlan(lot: InventoryRecord, scenario: RezultatScenariu) {
  await runTransaction(db, async transaction => {
    const reference = doc(db, 'inventory_lots', lot.id);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) throw new Error('Lotul nu mai există.');
    const current = snapshot.data();
    if (current.distribution_plan) throw new Error('Acest lot are deja un plan aplicat.');
    if (current.quantity !== lot.quantity || current.status !== lot.status) throw new Error('Lotul s-a modificat. Reîncarcă analiza.');
    if (current.expiration_date.toMillis() <= Date.now()) throw new Error('Lotul a expirat.');
    transaction.update(reference, {
      status: 'plan_active',
      distribution_plan: {
        scenario: scenario.id, title: scenario.titlu,
        b2b_pct: scenario.procentB2B, b2c_pct: scenario.procentB2C,
        b2b_quantity: scenario.cantitateB2B ?? 0,
        b2c_quantity: scenario.cantitateB2C ?? 0,
        donation_quantity: scenario.cantitateDonata ?? 0,
        donation_remaining: scenario.cantitateDonata ?? 0,
        projected_net_financial: scenario.profitNetEstimatRON,
        intervals: scenario.intervale,
        projected_revenue: scenario.venitBrutEstimatRON,
        projected_waste_quantity: scenario.cantitateRisipita,
        applied_at: Timestamp.now(),
      },
    });
  });
}

export async function claimDonation(lot: InventoryRecord, partner: PartnerRecord) {
  const claimRef = doc(db, 'claims', `donation_${lot.id}_${partner.id}`);
  await runTransaction(db, async transaction => {
    const lotRef = doc(db, 'inventory_lots', lot.id);
    const partnerRef = doc(db, 'partners', partner.id);
    const [lotSnapshot, partnerSnapshot, priorClaim] = await Promise.all([transaction.get(lotRef), transaction.get(partnerRef), transaction.get(claimRef)]);
    if (priorClaim.exists()) throw new Error('Ai rezervat deja o donație din acest lot.');
    if (!lotSnapshot.exists() || !partnerSnapshot.exists()) throw new Error('Lotul sau partenerul nu mai există.');
    const current = lotSnapshot.data();
    const recipient = partnerSnapshot.data();
    const weight = current.unit_of_measure === 'kg' ? 1 : current.weight_per_unit_kg;
    const hours = recipient.pickup_sla_hours;
    const now = Date.now();
    if (recipient.type !== 'ngo' || !recipient.accepted_categories.includes(current.category)
      || (['dairy', 'meat'].includes(current.category) && !recipient.has_refrigeration)
      || !weight || !(hours > 0) || now + hours * 3600000 > current.expiration_date.toMillis()) {
      throw new Error('Partenerul nu poate prelua acest lot înainte de expirare.');
    }
    const remaining = current.distribution_plan?.donation_remaining ?? 0;
    const quantity = Math.min(remaining, recipient.daily_capacity_kg / weight);
    if (!(quantity > 0)) throw new Error('Nu mai există cantitate disponibilă pentru donație.');
    transaction.update(lotRef, { 'distribution_plan.donation_remaining': remaining - quantity });
    transaction.set(claimRef, {
      lot_id: lot.id, partner_id: partner.id, claimed_quantity: quantity,
      claimed_at: Timestamp.fromMillis(now), pickup_deadline: Timestamp.fromMillis(now + hours * 3600000),
      status: 'pending', pickup_code: `${lot.id.slice(0, 4)}${partner.id.slice(0, 4)}`.toUpperCase(),
    });
  });
  return claimRef.id;
}
