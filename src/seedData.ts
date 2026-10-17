import {
  collection,
  doc,
  writeBatch,
  GeoPoint,
  Timestamp,
} from "firebase/firestore";
import { db } from "firebase";

interface ProductTemplate {
  category: string;
  originalPrice: number;
  unitCost: number;
  baseDailyUnits: number;
  bulkChance: number;
}

const PRODUCTS: ProductTemplate[] = [
  { category: "dairy", originalPrice: 14.0, unitCost: 8.5, baseDailyUnits: 30, bulkChance: 0.1 },
  { category: "bakery", originalPrice: 6.5, unitCost: 3.0, baseDailyUnits: 45, bulkChance: 0.05 },
  { category: "produce", originalPrice: 5.0, unitCost: 2.8, baseDailyUnits: 60, bulkChance: 0.2 },
  { category: "meat", originalPrice: 32.0, unitCost: 21.0, baseDailyUnits: 18, bulkChance: 0.08 },
];

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
    corporate_tax_rate: 0.16,
    vat_rate: 0.09,
    donation_tax_deductibility_pct: 1.0,
    vat_exemption_on_donation: true,
  });

  // 2. PARTNERS (ONG-uri și Cantine reale din Iași)
  const partnerFoodBankRef = doc(collection(db, "partners"));
  const partnerCantinaSfSavaRef = doc(collection(db, "partners"));
  const partnerCantinaMunicipiuRef = doc(collection(db, "partners"));
  const partnerBethanyRef = doc(collection(db, "partners"));

  // Banca pentru Alimente - Hub Regional / Punct de lucru Iași
  storeBatch.set(partnerFoodBankRef, {
    name: "Banca pentru Alimente - Punct de Lucru Iași",
    type: "ngo",
    location: new GeoPoint(47.1633, 27.6015), // Zona Tudor Vladimirescu / Zona Industrială
    has_refrigeration: true,
    accepted_categories: ["dairy", "bakery", "produce", "meat", "canned"],
    daily_capacity_kg: 700,
  });

  // Cantina Socială „Sfântul Sava” - Fundația Solidaritate și Speranță Iași
  storeBatch.set(partnerCantinaSfSavaRef, {
    name: "Cantina Socială „Sfântul Sava” (Fundația Solidaritate și Speranță)",
    type: "bulk_buyer",
    location: new GeoPoint(47.1610, 27.5878), // Str. Costache Negri nr. 48, Iași
    has_refrigeration: true,
    accepted_categories: ["dairy", "produce", "meat", "bakery"],
    daily_capacity_kg: 350,
  });

  // Cantina de Ajutor Social - Direcția de Asistență Socială Iași
  storeBatch.set(partnerCantinaMunicipiuRef, {
    name: "Cantina Socială a Municipiului Iași (D.A.S.)",
    type: "bulk_buyer",
    location: new GeoPoint(47.1528, 27.5921), // Str. Mitropolit Varlaam / Cantemir
    has_refrigeration: true,
    accepted_categories: ["dairy", "produce", "meat", "canned"],
    daily_capacity_kg: 450,
  });

  // Fundația Serviciilor Sociale Bethany Iași
  storeBatch.set(partnerBethanyRef, {
    name: "Fundația Serviciilor Sociale Bethany",
    type: "ngo",
    location: new GeoPoint(47.1812, 27.5684), // Str. Vârnav nr. 9, Iași
    has_refrigeration: false,
    accepted_categories: ["bakery", "produce", "dry_goods"],
    daily_capacity_kg: 120,
  });

  // 3. INVENTORY LOTS (Loturi curente pentru testarea AI-ului)
  const lotDairyRef = doc(collection(db, "inventory_lots"));
  const lotBakeryRef = doc(collection(db, "inventory_lots"));
  const lotProduceRef = doc(collection(db, "inventory_lots"));

  storeBatch.set(lotDairyRef, {
    store_id: storeCentralRef.id,
    store_location: new GeoPoint(47.1742, 27.5744),
    category: "dairy",
    quantity: 120,
    unit_of_measure: "buc",
    expiration_date: Timestamp.fromDate(new Date("2026-10-21T18:00:00Z")),
    price_per_unit: 14.0,
    cost_price_per_unit: 8.5,
    waste_disposal_cost_per_unit: 1.5,
    bulk_eligible: true,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "discount",
      projected_net_financial: 410.0,
      suggested_discount_pct: 30,
      reasoning: "Reducere de 30% cu 3 zile înainte de expirare; probabilitate mare de lichidare rapidă pe lactate la raft.",
    },
  });

  storeBatch.set(lotBakeryRef, {
    store_id: storeCentralRef.id,
    store_location: new GeoPoint(47.1742, 27.5744),
    category: "bakery",
    quantity: 45,
    unit_of_measure: "buc",
    expiration_date: Timestamp.fromDate(new Date("2026-10-18T20:00:00Z")),
    price_per_unit: 6.5,
    cost_price_per_unit: 3.0,
    waste_disposal_cost_per_unit: 0.8,
    bulk_eligible: false,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "discount",
      projected_net_financial: 112.5,
      suggested_discount_pct: 50,
      reasoning: "Produse de panificație cu termen scurt; reducere de 50% recomandată după ora 17:00.",
    },
  });

  storeBatch.set(lotProduceRef, {
    store_id: storePacurariRef.id,
    store_location: new GeoPoint(47.1725, 27.5348),
    category: "produce",
    quantity: 260,
    unit_of_measure: "kg",
    expiration_date: Timestamp.fromDate(new Date("2026-10-20T12:00:00Z")),
    price_per_unit: 5.0,
    cost_price_per_unit: 2.8,
    waste_disposal_cost_per_unit: 0.9,
    bulk_eligible: true,
    status: "pending_ai_review",
    ai_recommendation: {
      action: "bulk_sale",
      projected_net_financial: 572.0,
      suggested_discount_pct: 40,
      reasoning: "Volum mare pentru vânzare individuală la raft; recomandare tranzacție en-gros către Cantina Sfântul Sava sau Cantina Municipală.",
    },
  });

  // 4. CLAIMS (Exemplu rezervare de donație sau ridicare bulk)
  const claimRef = doc(collection(db, "claims"));
  storeBatch.set(claimRef, {
    lot_id: lotProduceRef.id,
    partner_id: partnerCantinaSfSavaRef.id,
    claimed_quantity: 120,
    claimed_at: Timestamp.fromDate(new Date("2026-10-17T11:00:00Z")),
    pickup_deadline: Timestamp.fromDate(new Date("2026-10-18T15:00:00Z")),
    status: "pending",
  });

  await storeBatch.commit();
  console.log("Stores, partners, lots și claims din Iași au fost inserate.");

  // 5. GENERARE SERIE TEMPORALĂ: SALES HISTORY (Date fictive de cumpărare pe ultimele 60 de zile)
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
        let isOnPromotion = false;

        if (isBulk) {
          discountPct = Math.round(30 + Math.random() * 20); // discount 30% - 50%
          isOnPromotion = true;
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
          baseQuantity *= 2.5 + Math.random();
        }

        const randomFactor = 0.85 + Math.random() * 0.3;
        const quantitySold = Math.round(baseQuantity * randomFactor);

        const realizedMargin = Number(((sellingPrice - prod.unitCost) * quantitySold).toFixed(2));

        const transactionTimestamp = new Date(saleDate);
        transactionTimestamp.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

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
          realized_margin: realizedMargin,
        });
      }
    }
  }

  // Scrierea datelor de vânzări în tranșe de câte 400
  const CHUNK_SIZE = 400;
  for (let i = 0; i < salesRecords.length; i += CHUNK_SIZE) {
    const currentChunk = salesRecords.slice(i, i + CHUNK_SIZE);
    const historyBatch = writeBatch(db);

    for (const record of currentChunk) {
      const docRef = doc(collection(db, "sales_history"));
      historyBatch.set(docRef, record);
    }

    await historyBatch.commit();
    console.log(`Salvate înregistrările sales_history ${i + 1} - ${i + currentChunk.length}`);
  }

  console.log(`Seeding finalizat cu succes! Total vânzări generate: ${salesRecords.length}`);
};