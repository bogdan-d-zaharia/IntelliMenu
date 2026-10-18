import {
  collection,
  doc,
  writeBatch,
  GeoPoint,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface ProductTemplate {
  category: string;
  originalPrice: number;
  unitCost: number;
  baseDailyUnits: number;
  bulkChance: number;
}

const PRODUCTS: ProductTemplate[] = [
  { category: "dairy", originalPrice: 14.0, unitCost: 8.5, baseDailyUnits: 30, bulkChance: 0.15 },
  { category: "bakery", originalPrice: 6.5, unitCost: 3.0, baseDailyUnits: 45, bulkChance: 0.1 },
  { category: "produce", originalPrice: 5.0, unitCost: 2.8, baseDailyUnits: 60, bulkChance: 0.25 },
  { category: "meat", originalPrice: 32.0, unitCost: 21.0, baseDailyUnits: 18, bulkChance: 0.12 },
];

// Valori sintetice pentru demonstra?ie, nu m?sur?tori opera?ionale.
// ATEN?IE: fiecare apel creeaz? documente noi; nu actualizeaz? datele existente.
export const seedDatabaseExtended = async () => {
  // 1. STORES (Supermarketuri din Iași)
  const storeBatch = writeBatch(db);

  const storeCentralRef = doc(collection(db, "stores"));
  const storePacurariRef = doc(collection(db, "stores"));

  storeBatch.set(storeCentralRef, {
    name: "Supermarket Central Copou",
    address: "Bd. Carol I nr. 12, Iași",
    contact_phone: "+40232123456",
    location: new GeoPoint(47.1742, 27.5744),
    esg_waste_penalty_per_kg: 2.5, // RON/kg
    avg_daily_sales_by_category: { dairy: 30, bakery: 45, produce: 60, meat: 18, dry_goods: 60 },
    corporate_tax_rate: 0.16,
    vat_rate: 0.09,
    donation_tax_deductibility_pct: 1.0,
    vat_exemption_on_donation: true,
  });

  storeBatch.set(storePacurariRef, {
    name: "Supermarket Păcurari Express",
    address: "Șoseaua Păcurari nr. 121, Iași",
    contact_phone: "+40232987654",
    location: new GeoPoint(47.1725, 27.5348),
    esg_waste_penalty_per_kg: 2.5, // RON/kg
    avg_daily_sales_by_category: { dairy: 30, bakery: 45, produce: 60, meat: 18, dry_goods: 60 },
    corporate_tax_rate: 0.16,
    vat_rate: 0.09,
    donation_tax_deductibility_pct: 1.0,
    vat_exemption_on_donation: true,
  });

  // 2. PARTNERS: ONG-uri pentru Donații & Cantine pentru Cumpărături Bulk din Iași
  const partnerFoodBankRef = doc(collection(db, "partners"));
  const partnerSalvatiCopiiiRef = doc(collection(db, "partners"));
  const partnerCentruUrgentaRef = doc(collection(db, "partners"));
  const partnerBethanyRef = doc(collection(db, "partners"));

  const partnerCantinaSfSavaRef = doc(collection(db, "partners"));
  const partnerCantinaTuiasiRef = doc(collection(db, "partners"));
  const partnerCantinaMunicipiuRef = doc(collection(db, "partners"));

  // --- ONG-URI ÎNREGISTRATE (Destinații Donații) ---
  storeBatch.set(partnerFoodBankRef, {
    name: "Banca pentru Alimente - Hub Regional Iași",
    type: "ngo",
    pickup_sla_hours: 6,
    address: "Calea Chișinăului nr. 22, Iași",
    contact_phone: "+40232210100",
    location: new GeoPoint(47.1510, 27.6080),
    has_refrigeration: true,
    accepted_categories: ["dairy", "bakery", "produce", "meat", "canned"],
    daily_capacity_kg: 800,
  });

  storeBatch.set(partnerSalvatiCopiiiRef, {
    name: "Organizația „Salvați Copiii” - Filiala Iași",
    type: "ngo",
    pickup_sla_hours: 6,
    address: "Str. Roman Vodă nr. 1, Iași",
    contact_phone: "+40232211990",
    location: new GeoPoint(47.1585, 27.5890),
    has_refrigeration: true,
    accepted_categories: ["dairy", "bakery", "produce"],
    daily_capacity_kg: 180,
  });

  storeBatch.set(partnerCentruUrgentaRef, {
    name: "Centrul de Urgență Noapte și Zi Iași",
    type: "ngo",
    pickup_sla_hours: 6,
    address: "Str. Canta nr. 60, Iași",
    contact_phone: "+40232267770",
    location: new GeoPoint(47.1680, 27.5510),
    has_refrigeration: true,
    accepted_categories: ["meat", "dairy", "bakery", "canned"],
    daily_capacity_kg: 220,
  });

  storeBatch.set(partnerBethanyRef, {
    name: "Fundația Serviciilor Sociale Bethany Iași",
    type: "ngo",
    pickup_sla_hours: 6,
    address: "Str. Vârnav nr. 9, Iași",
    contact_phone: "+40232278535",
    location: new GeoPoint(47.1812, 27.5684),
    has_refrigeration: false,
    accepted_categories: ["bakery", "produce", "dry_goods"],
    daily_capacity_kg: 120,
  });

  // --- CANTINE (Cumpărători de Volume Mari / Bulk Buyers) ---
  storeBatch.set(partnerCantinaSfSavaRef, {
    name: "Cantina Socială „Sfântul Sava” (Fundația Solidaritate și Speranță)",
    type: "bulk_buyer",
    pickup_sla_hours: 4,
    offered_price_pct: 0.35, // Frac?ie din pre?ul de raft (35%), nu procent ?ntreg.
    address: "Str. Costache Negri nr. 48, Iași",
    contact_phone: "+40232220541",
    location: new GeoPoint(47.1610, 27.5878),
    has_refrigeration: true,
    accepted_categories: ["dairy", "produce", "meat", "bakery"],
    daily_capacity_kg: 400,
  });

  storeBatch.set(partnerCantinaTuiasiRef, {
    name: "Cantina Studențească „Tudor Vladimirescu”",
    type: "bulk_buyer",
    pickup_sla_hours: 4,
    offered_price_pct: 0.35, // Frac?ie din pre?ul de raft (35%), nu procent ?ntreg.
    address: "Bulevardul Profesor Dimitrie Mangeron, Campus Tudor, Iași",
    contact_phone: "+40232278683",
    location: new GeoPoint(47.1565, 27.6042),
    has_refrigeration: true,
    accepted_categories: ["dairy", "meat", "produce", "bakery"],
    daily_capacity_kg: 900,
  });

  storeBatch.set(partnerCantinaMunicipiuRef, {
    name: "Cantina de Ajutor Social Iași (D.A.S.)",
    type: "bulk_buyer",
    pickup_sla_hours: 4,
    offered_price_pct: 0.35, // Frac?ie din pre?ul de raft (35%), nu procent ?ntreg.
    address: "Str. Mitropolit Varlaam nr. 54, Iași",
    contact_phone: "+40232242100",
    location: new GeoPoint(47.1528, 27.5921),
    has_refrigeration: true,
    accepted_categories: ["dairy", "produce", "meat", "canned"],
    daily_capacity_kg: 500,
  });

  // 3. INVENTORY LOTS
  const lotDairyRef = doc(collection(db, "inventory_lots"));
  const lotBakeryRef = doc(collection(db, "inventory_lots"));
  const lotProduceRef = doc(collection(db, "inventory_lots"));
  const lotMeatRef = doc(collection(db, "inventory_lots"));

  storeBatch.set(lotDairyRef, {
    store_id: storeCentralRef.id,
    store_location: new GeoPoint(47.1742, 27.5744),
    category: "dairy",
    received_at: Timestamp.fromDate(new Date("2026-10-16T18:00:00Z")),
    holding_cost_per_day: 0.45, // RON/unitate/zi
    environmental_impact_factor: 1.2, // Impact ecologic per kg, valoare demo.
    quantity: 140,
    unit_of_measure: "buc",
    expiration_date: Timestamp.fromDate(new Date("2026-10-21T18:00:00Z")),
    price_per_unit: 14.0,
    cost_price_per_unit: 8.5,
    waste_disposal_cost_per_unit: 1.5,
    bulk_eligible: true,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "discount",
      projected_net_financial: 450.0,
      suggested_discount_pct: 30,
      reasoning: "Reducere de 30% cu 4 zile înainte de expirare; recomandare vânzare directă la raft.",
    },
  });

  storeBatch.set(lotBakeryRef, {
    store_id: storeCentralRef.id,
    store_location: new GeoPoint(47.1742, 27.5744),
    category: "bakery",
    received_at: Timestamp.fromDate(new Date("2026-10-17T06:00:00Z")),
    holding_cost_per_day: 0.10, // RON/unitate/zi
    environmental_impact_factor: 0.6, // Impact ecologic per kg, valoare demo.
    quantity: 60,
    unit_of_measure: "buc",
    expiration_date: Timestamp.fromDate(new Date("2026-10-18T20:00:00Z")),
    price_per_unit: 6.5,
    cost_price_per_unit: 3.0,
    waste_disposal_cost_per_unit: 0.8,
    bulk_eligible: false,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "donate",
      projected_net_financial: 180.0,
      suggested_discount_pct: 0,
      reasoning: "Termen extrem de scurt; recomandare redirecționare ca donație către Salvați Copiii Iași sau Centrul de Urgență.",
    },
  });

  storeBatch.set(lotProduceRef, {
    store_id: storePacurariRef.id,
    store_location: new GeoPoint(47.1725, 27.5348),
    category: "produce",
    received_at: Timestamp.fromDate(new Date("2026-10-16T12:00:00Z")),
    holding_cost_per_day: 0.20, // RON/unitate/zi
    environmental_impact_factor: 0.8, // Impact ecologic per kg, valoare demo.
    quantity: 320,
    unit_of_measure: "kg",
    expiration_date: Timestamp.fromDate(new Date("2026-10-20T12:00:00Z")),
    price_per_unit: 5.0,
    cost_price_per_unit: 2.8,
    waste_disposal_cost_per_unit: 0.9,
    bulk_eligible: true,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "bulk_sale",
      projected_net_financial: 704.0,
      suggested_discount_pct: 40,
      reasoning: "Volum prea ridicat pentru vânzare la bucată; recomandare contractare en-gros către Cantina Tudor sau Cantina Sfântul Sava.",
    },
  });

  storeBatch.set(lotMeatRef, {
    store_id: storePacurariRef.id,
    store_location: new GeoPoint(47.1725, 27.5348),
    category: "meat",
    received_at: Timestamp.fromDate(new Date("2026-10-16T14:00:00Z")),
    holding_cost_per_day: 0.65, // RON/unitate/zi
    environmental_impact_factor: 4.5, // Impact ecologic per kg, valoare demo.
    quantity: 85,
    unit_of_measure: "kg",
    expiration_date: Timestamp.fromDate(new Date("2026-10-19T14:00:00Z")),
    price_per_unit: 32.0,
    cost_price_per_unit: 21.0,
    waste_disposal_cost_per_unit: 4.5,
    bulk_eligible: true,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "bulk_sale",
      projected_net_financial: 1615.0,
      suggested_discount_pct: 35,
      reasoning: "Risc ridicat de perisabilitate; reducere de 35% pentru achiziție imediată în regim cantină.",
    },
  });

  // 4. CLAIMS (Donații active sau rezervări de loturi)
  const claim1Ref = doc(collection(db, "claims"));
  const claim2Ref = doc(collection(db, "claims"));

  storeBatch.set(claim1Ref, {
    lot_id: lotBakeryRef.id,
    partner_id: partnerSalvatiCopiiiRef.id,
    claimed_quantity: 60,
    avg_processing_time_hours: 12, // Medie istoric? demonstrativ? a partenerului.
    claimed_at: Timestamp.fromDate(new Date("2026-10-17T09:30:00Z")),
    pickup_deadline: Timestamp.fromDate(new Date("2026-10-18T14:00:00Z")),
    status: "pending",
  });

  storeBatch.set(claim2Ref, {
    lot_id: lotProduceRef.id,
    partner_id: partnerFoodBankRef.id,
    claimed_quantity: 150,
    avg_processing_time_hours: 5, // Medie istoric? demonstrativ? a partenerului.
    claimed_at: Timestamp.fromDate(new Date("2026-10-16T16:00:00Z")),
    pickup_deadline: Timestamp.fromDate(new Date("2026-10-17T18:00:00Z")),
    status: "completed",
  });

  await storeBatch.commit();
  console.log("Magazinele, partenerii (ONG-uri + cantine) și loturile din Iași au fost salvate.");

  // 5. GENERARE SALES HISTORY: vânzări zilnice cu achiziții bulk atribuite cantinelor
  const bulkBuyers = [
    { id: partnerCantinaSfSavaRef.id, name: "Cantina Sfântul Sava" },
    { id: partnerCantinaTuiasiRef.id, name: "Cantina TUIASI Tudor" },
    { id: partnerCantinaMunicipiuRef.id, name: "Cantina D.A.S. Iași" },
  ];

  const salesRecords: Array<Record<string, unknown>> = [];
  const storeIds = [storeCentralRef.id, storePacurariRef.id];
  const currentDate = new Date("2026-10-17T12:00:00Z");

  for (let daysAgo = 60; daysAgo >= 1; daysAgo--) {
    const saleDate = new Date(currentDate);
    saleDate.setDate(currentDate.getDate() - daysAgo);

    const isWeekend = saleDate.getDay() === 0 || saleDate.getDay() === 6;
    const weekendMultiplier = isWeekend ? 1.35 : 1.0;

    for (const storeId of storeIds) {
      for (const prod of PRODUCTS) {
        const isBulk = Math.random() < prod.bulkChance;
        let discountPct = 0;
        let isOnPromotion: boolean;
        let buyerPartnerId: string | null = null;

        if (isBulk) {
          discountPct = Math.round(30 + Math.random() * 20); // 30% - 50% discount pentru cantine
          isOnPromotion = true;
          // Asociem tranzacția cu o cantină reală
          buyerPartnerId = bulkBuyers[Math.floor(Math.random() * bulkBuyers.length)].id;
        } else {
          isOnPromotion = Math.random() < 0.25;
          if (isOnPromotion) {
            discountPct = [15, 25, 35, 50][Math.floor(Math.random() * 4)];
          }
        }

        const sellingPrice = Number((prod.originalPrice * (1 - discountPct / 100)).toFixed(2));

        let baseQuantity = prod.baseDailyUnits * weekendMultiplier;
        if (isOnPromotion) {
          baseQuantity *= 1 + (discountPct / 100) * 1.5;
        }
        if (isBulk) {
          baseQuantity *= 3.0 + Math.random() * 1.5; // cerere substanțială specifică unei cantine
        }

        const randomFactor = 0.85 + Math.random() * 0.3;
        const quantitySold = Math.round(baseQuantity * randomFactor);
        const realizedMargin = Number(((sellingPrice - prod.unitCost) * quantitySold).toFixed(2));

        const transactionTimestamp = new Date(saleDate);
        transactionTimestamp.setHours(8 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));

        salesRecords.push({
          store_id: storeId,
          category: prod.category,
          date: Timestamp.fromDate(transactionTimestamp),
          quantity_sold: quantitySold,
          original_price: prod.originalPrice,
          selling_price: sellingPrice,
          unit_cost: prod.unitCost,
          is_on_promotion: isOnPromotion,
          discount_percentage: discountPct,
          is_bulk: isBulk,
          buyer_partner_id: buyerPartnerId,
          realized_margin: realizedMargin,
          // Observa?ie disponibil? doar pentru prima reducere B2C simulat?.
          // null ?nseamn? neobservat / neaplicabil, nu zero ore.
          time_to_first_discount_hours: !isBulk && isOnPromotion
            ? ({ dairy: 48, bakery: 12, produce: 36, meat: 24 }[prod.category] ?? 24)
            : null,
        });
      }
    }
  }

  // Scriem istoricul în calupuri de 400
  const CHUNK_SIZE = 400;
  for (let i = 0; i < salesRecords.length; i += CHUNK_SIZE) {
    const currentChunk = salesRecords.slice(i, i + CHUNK_SIZE);
    const historyBatch = writeBatch(db);

    for (const record of currentChunk) {
      const docRef = doc(collection(db, "sales_history"));
      historyBatch.set(docRef, record);
    }

    await historyBatch.commit();
  }

  console.log(`Seeding finalizat cu succes! Total vânzări generate: ${salesRecords.length}`);
};
