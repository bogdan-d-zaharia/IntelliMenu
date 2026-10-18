import type { InventoryRecord, StoreRecord, PartnerRecord, ClaimRecord, SaleRecord } from '../data/FirestoreProvider';
import type { CategorieAlimentara, LotAlimentar, ConfigurareCategorie } from '../types/yield.types';
import { CONFIGURARI_CATEGORII } from '../data/categoryConfig';
import { remainingCapacity, reservationDay } from './matchmaking';

export const categoryLabels: Record<string, string> = { dairy: 'Lactate & Brânzeturi', meat: 'Mezeluri & Carne', bakery: 'Patiserie & Panificație', produce: 'Fructe & Legume', dry_goods: 'Produse Uscate & Conserve', canned: 'Conserve' };
const categoryMap: Record<string, CategorieAlimentara> = { dairy: 'lactate', meat: 'carne_proaspata', bakery: 'panificatie', produce: 'fructe_legume', dry_goods: 'conserve_uscate', canned: 'conserve_uscate' };

export function compatiblePartners(lot: InventoryRecord, partners: PartnerRecord[], now: number, claims: ClaimRecord[] = []) {
  return partners.filter(partner => {
    const durations = claims.filter(claim => claim.partner_id === partner.id && typeof claim.avg_processing_time_hours === 'number').map(claim => claim.avg_processing_time_hours!);
    const observed = durations.length ? durations.reduce((sum, hours) => sum + hours, 0) / durations.length : 0;
    const pickup = Math.max(partner.pickup_sla_hours ?? Infinity, observed);
    return partner.accepted_categories?.includes(lot.category)
      && (!['dairy', 'meat'].includes(lot.category) || partner.has_refrigeration)
      && pickup <= (lot.expiration_date.toMillis() - now) / 3600000;
  });
}

export function adaptLot(lot: InventoryRecord, store: StoreRecord | undefined, partners: PartnerRecord[], claims: ClaimRecord[], sales: SaleRecord[], now: number): { lot: LotAlimentar; config: ConfigurareCategorie; warning: string } {
  if (!store || !lot.received_at || lot.holding_cost_per_day == null) throw new Error('Lipsesc magazinul, data recepției sau costul de depozitare.');
  const category = categoryMap[lot.category];
  if (!category) throw new Error(`Categorie neconfigurată: ${lot.category}`);
  const totalHours = (lot.expiration_date.toMillis() - lot.received_at.toMillis()) / 3600000;
  const dailySales = store.avg_daily_sales_by_category?.[lot.category];
  if (!(totalHours > 0) || dailySales == null || dailySales < 0 || !(lot.quantity > 0)) throw new Error('Valabilitatea, cantitatea sau media zilnică de vânzări sunt invalide.');
  const eligible = compatiblePartners(lot, partners, now, claims)
    .filter(partner => partner.last_fulfilled_at !== undefined
      && Number.isFinite(partner.current_demand_by_category_kg?.[lot.category]))
    .map(partner => ({ ...partner, daily_capacity_kg: Math.min(
      Math.max(0, partner.current_demand_by_category_kg?.[lot.category] ?? 0),
      remainingCapacity(partner, claims, [lot], reservationDay(now)),
    ) })).filter(partner => partner.daily_capacity_kg > 0);
  const buyers = eligible.filter(partner => partner.type === 'bulk_buyer' && lot.bulk_eligible && partner.offered_price_pct != null);
  const ngos = eligible.filter(partner => partner.type === 'ngo');
  const weight = lot.unit_of_measure === 'kg' ? 1 : lot.weight_per_unit_kg;
  const history = sales.filter(sale => sale.store_id === store.id && sale.category === lot.category && !sale.is_bulk && typeof sale.time_to_first_discount_hours === 'number').map(sale => sale.time_to_first_discount_hours!);
  const config = { ...CONFIGURARI_CATEGORII[category], costStocarePerKgZiRON: lot.holding_cost_per_day };
  if (history.length) {
    const elapsed = history.reduce((sum, hours) => sum + hours, 0) / history.length;
    config.pondereBazaB2C = Math.max(0.1, Math.min(0.9, 1 - elapsed / totalHours));
    config.pondereBazaB2B = Math.min(config.pondereBazaB2B, config.pondereBazaB2C * 0.65);
  }
  if (ngos.length) config.oreMinimeDonatie = Math.min(...ngos.map(partner => partner.pickup_sla_hours!));
  return {
    lot: {
      id: lot.id, nume: categoryLabels[lot.category] ?? lot.category, categorie: category,
      cantitateTotala: lot.quantity, vanzariMediiZilnice: dailySales,
      oreTotaleValabilitate: totalHours, oreRămase: Math.max(0, (lot.expiration_date.toMillis() - now) / 3600000),
      pretUnitarRON: lot.price_per_unit, costAchizitieUnitarRON: lot.cost_price_per_unit,
      retailDiscountPct: store.retail_discount_pct,
      promoDemandMultiplier: store.promo_demand_multiplier,
      pretB2BFractie: buyers.length ? buyers.reduce((sum, partner) => sum + partner.offered_price_pct! * partner.daily_capacity_kg, 0) / Math.max(1, buyers.reduce((sum, partner) => sum + partner.daily_capacity_kg, 0)) : 0,
      capacitateB2B: weight ? buyers.reduce((sum, partner) => sum + partner.daily_capacity_kg / weight, 0) : 0,
      capacitateDonatie: weight ? ngos.reduce((sum, partner) => sum + partner.daily_capacity_kg / weight, 0) : 0,
      wasteCostPerUnit: lot.waste_disposal_cost_per_unit ?? 0,
      esgPenaltyPerUnit: weight ? (store.esg_waste_penalty_per_kg ?? 0) * weight : 0,
      impactFactor: lot.environmental_impact_factor ?? 1,
    }, config,
    warning: weight ? '' : 'Greutatea pe bucată lipsește: capacitatea B2B/donații și penalizarea ESG per kg nu pot fi calculate pentru acest lot.',
  };
}
