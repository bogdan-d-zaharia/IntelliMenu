import type { InventoryRecord, PartnerRecord, ClaimRecord } from '../data/FirestoreProvider';

export function reservationDay(milliseconds: number): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(milliseconds);
}

export function remainingCapacity(partner: PartnerRecord, claims: ClaimRecord[], lots: InventoryRecord[], day: string): number {
  const reserved = claims.filter(claim => claim.partner_id === partner.id && ['pending', 'accepted', 'completed'].includes(claim.status)
    && (claim.reservation_day ?? (claim.pickup_deadline ? reservationDay(claim.pickup_deadline.toMillis()) : '')) === day)
    .reduce((sum, claim) => {
      const lot = lots.find(item => item.id === claim.lot_id);
      const weight = lot?.unit_of_measure === 'kg' ? 1 : lot?.weight_per_unit_kg;
      return sum + (claim.claimed_weight_kg ?? (weight ? claim.claimed_quantity * weight : partner.daily_capacity_kg));
    }, 0);
  return Math.max(0, partner.daily_capacity_kg - reserved);
}

export interface MatchAllocation { partner: PartnerRecord; channel: 'social' | 'donation'; quantity: number; weightKg: number; price: number }
/** Eligible partners are supplied by the adapter. Order depends only on last
 * fulfillment; demand determines how much they receive. ID breaks exact ties. */
export function allocatePartners(lot: InventoryRecord, partners: PartnerRecord[], targets: { social: number; donation: number }, capacities: Map<string, number>): MatchAllocation[] {
  const weight = lot.unit_of_measure === 'kg' ? 1 : lot.weight_per_unit_kg;
  if (!(weight && Number.isFinite(weight) && weight > 0)) throw new Error('Lipsește greutatea reală pe unitate.');
  const step = lot.unit_of_measure === 'buc' ? 1 : 0.001;
  const floor = (quantity: number) => Math.floor((quantity + 1e-9) / step) * step;
  const allocations: MatchAllocation[] = [];
  for (const channel of ['social', 'donation'] as const) {
    let remaining = Math.min(lot.quantity, floor(targets[channel]));
    const ordered = partners.filter(partner => partner.type === (channel === 'social' ? 'bulk_buyer' : 'ngo')
      && partner.last_fulfilled_at !== undefined
      && Number.isFinite(partner.current_demand_by_category_kg?.[lot.category])
      && (partner.current_demand_by_category_kg?.[lot.category] ?? 0) > 0)
      .sort((a, b) => (a.last_fulfilled_at?.toMillis() ?? -Infinity) - (b.last_fulfilled_at?.toMillis() ?? -Infinity) || a.id.localeCompare(b.id));
    for (const partner of ordered) {
      if (remaining < step) break;
      const priceFraction = partner.offered_price_pct;
      if (channel === 'social' && (!lot.bulk_eligible || priceFraction == null || !Number.isFinite(priceFraction) || priceFraction < 0 || priceFraction > 1)) continue;
      const quantity = floor(Math.min(remaining, partner.current_demand_by_category_kg![lot.category] / weight, (capacities.get(partner.id) ?? 0) / weight));
      if (quantity < step) continue;
      const weightKg = quantity * weight;
      allocations.push({ partner, channel, quantity, weightKg, price: channel === 'donation' ? 0 : Math.round(lot.price_per_unit * priceFraction! * 100) / 100 });
      capacities.set(partner.id, Math.max(0, (capacities.get(partner.id) ?? 0) - weightKg));
      remaining -= quantity;
    }
  }
  return allocations;
}
