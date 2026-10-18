import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface StoreRecord { id: string; name: string; address: string; avg_daily_sales_by_category?: Record<string, number>; esg_waste_penalty_per_kg?: number }
export interface InventoryRecord {
  id: string; store_id: string; category: string; quantity: number; unit_of_measure: string;
  expiration_date: Timestamp; received_at?: Timestamp; price_per_unit: number; cost_price_per_unit: number;
  holding_cost_per_day?: number; environmental_impact_factor?: number; waste_disposal_cost_per_unit?: number;
  bulk_eligible: boolean; status: string; weight_per_unit_kg?: number;
  distribution_plan?: { scenario: string; title: string; b2b_pct: number; b2c_pct: number; applied_at?: Timestamp; b2b_quantity?: number; b2c_quantity?: number; donation_quantity?: number; donation_remaining?: number };
}
export interface PartnerRecord { id: string; name: string; type: string; accepted_categories: string[]; has_refrigeration: boolean; daily_capacity_kg: number; pickup_sla_hours?: number; offered_price_pct?: number }
export interface ClaimRecord { id: string; lot_id: string; partner_id: string; claimed_quantity: number; status: string; avg_processing_time_hours?: number; pickup_deadline?: Timestamp; pickup_code?: string }
export interface SaleRecord { id: string; store_id: string; category: string; is_bulk: boolean; quantity_sold: number; time_to_first_discount_hours?: number | null }
interface Data {
  stores: StoreRecord[]; inventory_lots: InventoryRecord[]; partners: PartnerRecord[]; claims: ClaimRecord[]; sales_history: SaleRecord[];
}
const empty: Data = { stores: [], inventory_lots: [], partners: [], claims: [], sales_history: [] };
const Context = createContext<Data & { now: number }>({ ...empty, now: Date.now() });

export function FirestoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(empty);
  const [loaded, setLoaded] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    const unsubscribes = Object.keys(empty).map(name => onSnapshot(collection(db, name), snapshot => {
      setData(current => ({ ...current, [name]: snapshot.docs.map(document => ({ ...document.data(), id: document.id })) }));
      setLoaded(current => current.includes(name) ? current : [...current, name]);
    }, failure => setError(`${name}: ${failure.message}`)));
    return () => { clearInterval(timer); unsubscribes.forEach(unsubscribe => unsubscribe()); };
  }, [attempt]);
  if (error) return <div className="min-h-screen bg-gray-900 text-white p-10"><h1 className="text-2xl mb-4">Datele Firestore nu pot fi încărcate</h1><p role="alert">{error}</p><p className="my-4">Verifică accesul la colecții și configurarea Firebase App Check.</p><button onClick={() => { setError(''); setLoaded([]); setAttempt(value => value + 1); }}>Reîncearcă</button></div>;
  if (loaded.length < 5) return <div className="min-h-screen bg-gray-900 text-white p-10" role="status">Se încarcă datele Firestore ({loaded.length}/5)...</div>;
  return <Context.Provider value={{ ...data, now }}>{children}</Context.Provider>;
}

// Shared subscription: navigation never triggers a fresh collection download.
// eslint-disable-next-line react-refresh/only-export-components
export function useFirestoreData() { return useContext(Context); }
