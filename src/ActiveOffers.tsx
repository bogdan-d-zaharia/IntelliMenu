import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useFirestoreData } from './data/FirestoreProvider';
import { categoryLabels } from './lib/firestoreAdapter';

export default function ActiveOffers({ onBack }: { onBack: () => void }) {
  const data = useFirestoreData();
  const [donations, setDonations] = useState(false);
  const offers = data.inventory_lots.filter(lot => lot.distribution_plan);
  return <div className="min-h-screen bg-[#F9F7F5] p-8 text-gray-900">
    <button onClick={onBack} className="flex gap-2 mb-6"><ArrowLeft /> Înapoi la categorii</button>
    <h1 className="text-3xl font-bold mb-2">Urmărire Oferte Active</h1>
    <p className="mb-6 text-gray-500">Planuri salvate în Firestore · actualizare în timp real</p>
    <div className="flex gap-4 mb-6"><button onClick={() => setDonations(false)} className="p-3 rounded-xl bg-emerald-100">Raft & B2B</button><button onClick={() => setDonations(true)} className="p-3 rounded-xl bg-indigo-100">Donații & preluare</button></div>
    {!offers.length && <p>Nu există planuri aplicate. Alege un lot din analiza stocului.</p>}
    <div className="grid gap-4">{offers.map(lot => <article key={lot.id} className="bg-white rounded-2xl p-6 border border-gray-200">
      <h2 className="text-xl font-bold">{categoryLabels[lot.category]} · {lot.id}</h2>
      <p className="my-2">{data.stores.find(store => store.id === lot.store_id)?.name}</p>
      <p>{lot.distribution_plan!.title}</p>
      {!donations ? <p className="text-emerald-700 mt-3">Raft: {lot.distribution_plan!.b2c_quantity?.toFixed(1)} {lot.unit_of_measure} · B2B: {lot.distribution_plan!.b2b_quantity?.toFixed(1)} {lot.unit_of_measure}</p> : <div className="mt-3">
        <p>Disponibil pentru donație: {(lot.distribution_plan!.donation_remaining ?? 0).toFixed(1)} {lot.unit_of_measure}</p>
        {data.claims.filter(claim => claim.lot_id === lot.id).map(claim => <p key={claim.id} className="mt-2 text-indigo-700">{data.partners.find(partner => partner.id === claim.partner_id)?.name} · {claim.claimed_quantity.toFixed(1)} {lot.unit_of_measure} · {claim.status} {claim.pickup_code && `· Cod: ${claim.pickup_code}`}</p>)}
      </div>}
    </article>)}</div>
  </div>;
}
