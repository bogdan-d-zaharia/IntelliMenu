import { Timestamp } from 'firebase/firestore';
import type { LotAlimentar, CategorieAlimentara } from '../types/yield.types';

// ==========================================
// 1. DICȚIONARE DE CONVERSIE CATEGORII
// ==========================================
export const MAP_CATEGORII_TO_APP: Record<string, CategorieAlimentara> = {
  'dairy': 'Lactate & Brânzeturi',
  'meat': 'Carne & Mezeluri',
  'bakery': 'Conserve & Produse Uscate',
  'dry_goods': 'Conserve & Produse Uscate',
  'produce': 'Conserve & Produse Uscate' // Fallback pentru legume/fructe
};

export const MAP_CATEGORII_TO_FIREBASE: Record<CategorieAlimentara, string> = {
  'Lactate & Brânzeturi': 'dairy',
  'Carne & Mezeluri': 'meat',
  'Conserve & Produse Uscate': 'dry_goods'
};

// ==========================================
// 2. ADAPTER: inventory_lots -> LotAlimentar
// ==========================================
export function adaptLotFromFirebase(docData: any, docId: string): LotAlimentar {
  const now = new Date().getTime();

  // Conversie dată de expirare (Timestamp sau Date/ISO string)
  const expDate = docData.expiration_date instanceof Timestamp 
    ? docData.expiration_date.toDate() 
    : new Date(docData.expiration_date || now);

  // Calcul dinamice ore rămase până la expirare
  const diffMs = expDate.getTime() - now;
  const oreRamaseCalc = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

  // Calcul oreTotaleValabilitate pe baza atributului `received_at`
  let oreTotaleValabilitate = 120; // Valoare default de siguranță
  if (docData.received_at) {
    const recDate = docData.received_at instanceof Timestamp 
      ? docData.received_at.toDate() 
      : new Date(docData.received_at);
    const totalMs = expDate.getTime() - recDate.getTime();
    oreTotaleValabilitate = Math.max(1, Math.floor(totalMs / (1000 * 60 * 60)));
  }

  return {
    id: docId || docData.id,
    nume: docData.name || `Lot ${docData.category || 'Mărfuri'} #${docId.substring(0, 4)}`,
    categorie: MAP_CATEGORII_TO_APP[docData.category] || 'Conserve & Produse Uscate',
    cantitateTotala: Number(docData.quantity || 0),
    pretUnitarRON: Number(docData.price_per_unit || 0),
    vanzariMediiZilnice: Number(docData.avg_daily_sales || 20),
    oreTotaleValabilitate,
    dataExpirare: expDate.toISOString(),
    oreRămase: oreRamaseCalc,
    costAchizitieUnitarRON: Number(docData.cost_price_per_unit || 0)
  };
}

// ==========================================
// 3. ADAPTER: partners -> Partener (ONG / Bulk Buyer)
// ==========================================
export interface PartenerAdaptat {
  id: string;
  nume: string;
  tip: 'ngo' | 'bulk_buyer';
  locatie: { lat: number; lng: number };
  areFrigider: boolean;
  categoriiAcceptate: CategorieAlimentara[];
  capacitateZilnicaKg: number;
  timpMaximRidicareOre: number; // pickup_sla_hours
  procentPretOferit: number;     // offered_price_pct (pentru cumpărători bulk)
}

export function adaptPartnerFromFirebase(docData: any, docId: string): PartenerAdaptat {
  return {
    id: docId,
    nume: docData.name || 'Partener Neidentificat',
    tip: docData.type === 'bulk_buyer' ? 'bulk_buyer' : 'ngo',
    locatie: {
      lat: docData.location?.latitude ?? docData.location?.[0] ?? 0,
      lng: docData.location?.longitude ?? docData.location?.[1] ?? 0
    },
    areFrigider: Boolean(docData.has_refrigeration ?? true),
    categoriiAcceptate: Array.isArray(docData.accepted_categories)
      ? docData.accepted_categories.map((cat: string) => MAP_CATEGORII_TO_APP[cat] || 'Conserve & Produse Uscate')
      : ['Conserve & Produse Uscate'],
    capacitateZilnicaKg: Number(docData.daily_capacity_kg || 100),
    timpMaximRidicareOre: Number(docData.pickup_sla_hours || 12),
    procentPretOferit: Number(docData.offered_price_pct || 0.35)
  };
}

// ==========================================
// 4. ADAPTER: stores -> Magazin
// ==========================================
export interface MagazinAdaptat {
  id: string;
  nume: string;
  adresa: string;
  telefon: string;
  locatie: { lat: number; lng: number };
  taxaCorporativa: number;
  cotaTVA: number;
  deductibilitateDonatiePct: number;
  scutireTVADonatie: boolean;
  penalizareEsgPerKg: number;
  vanzariMediiPeCategorie: Record<string, number>;
}

export function adaptStoreFromFirebase(docData: any, docId: string): MagazinAdaptat {
  return {
    id: docId,
    nume: docData.name || 'Magazin Central',
    adresa: docData.address || '',
    telefon: docData.contact_phone || '',
    locatie: {
      lat: docData.location?.latitude ?? docData.location?.[0] ?? 0,
      lng: docData.location?.longitude ?? docData.location?.[1] ?? 0
    },
    taxaCorporativa: Number(docData.corporate_tax_rate || 0.16),
    cotaTVA: Number(docData.vat_rate || 0.09),
    deductibilitateDonatiePct: Number(docData.donation_tax_deductibility_pct || 1.0),
    scutireTVADonatie: Boolean(docData.vat_exemption_on_donation ?? true),
    penalizareEsgPerKg: Number(docData.esg_waste_penalty_per_kg || 2.5),
    vanzariMediiPeCategorie: docData.avg_daily_sales_by_category || {
      dairy: 40,
      meat: 25,
      dry_goods: 60
    }
  };
}

// ==========================================
// 5. ADAPTER: claims -> Rezervare / Donație
// ==========================================
export interface ClaimAdaptat {
  id: string;
  lotId: string;
  partenerId: string;
  cantitateRezervata: number;
  dataRezervariiISO: string;
  dataLimitaRidicareISO: string;
  status: 'pending' | 'picked_up' | 'cancelled';
  timpMediuProcesareOre: number; // avg_processing_time_hours
}

export function adaptClaimFromFirebase(docData: any, docId: string): ClaimAdaptat {
  const claimedAtDate = docData.claimed_at instanceof Timestamp 
    ? docData.claimed_at.toDate() 
    : new Date(docData.claimed_at || Date.now());

  const deadlineDate = docData.pickup_deadline instanceof Timestamp 
    ? docData.pickup_deadline.toDate() 
    : new Date(docData.pickup_deadline || Date.now());

  return {
    id: docId,
    lotId: docData.lot_id || '',
    partenerId: docData.partner_id || '',
    cantitateRezervata: Number(docData.claimed_quantity || 0),
    dataRezervariiISO: claimedAtDate.toISOString(),
    dataLimitaRidicareISO: deadlineDate.toISOString(),
    status: docData.status || 'pending',
    timpMediuProcesareOre: Number(docData.avg_processing_time_hours || 12)
  };
}

// ==========================================
// 6. ADAPTER: sales_history -> Tranzacție Istorică
// ==========================================
export interface TranzactieIstoricaAdaptata {
  id: string;
  magazinId: string;
  categorie: CategorieAlimentara;
  dataTranzactieISO: string;
  cantitateVanduta: number;
  pretOriginal: number;
  pretVanzareEfectiv: number;
  costUnitaraAchizitie: number;
  esteLaPromotie: boolean;
  procentDiscount: number;
  esteVanzareBulk: boolean;
  marjaRealizataRON: number;
  orePanaLaPrimaReducere: number; // time_to_first_discount_hours
}

export function adaptSalesHistoryFromFirebase(docData: any, docId: string): TranzactieIstoricaAdaptata {
  const saleDate = docData.date instanceof Timestamp 
    ? docData.date.toDate() 
    : new Date(docData.date || Date.now());

  return {
    id: docId,
    magazinId: docData.store_id || '',
    categorie: MAP_CATEGORII_TO_APP[docData.category] || 'Conserve & Produse Uscate',
    dataTranzactieISO: saleDate.toISOString(),
    cantitateVanduta: Number(docData.quantity_sold || 0),
    pretOriginal: Number(docData.original_price || 0),
    pretVanzareEfectiv: Number(docData.selling_price || 0),
    costUnitaraAchizitie: Number(docData.unit_cost || 0),
    esteLaPromotie: Boolean(docData.is_on_promotion ?? false),
    procentDiscount: Number(docData.discount_percentage || 0),
    esteVanzareBulk: Boolean(docData.is_bulk ?? false),
    marjaRealizataRON: Number(docData.realized_margin || 0),
    orePanaLaPrimaReducere: Number(docData.time_to_first_discount_hours || 24)
  };
}