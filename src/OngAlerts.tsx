import { useState } from 'react';
import { ArrowLeft, BellRing } from 'lucide-react';
import { useFirestoreData } from './data/FirestoreProvider';
import { categoryLabels, compatiblePartners } from './lib/firestoreAdapter';
import { claimDonation } from './lib/firestoreActions';

export default function OngAlerts({ onBack }: { onBack?: () => void }) {
  const data = useFirestoreData();
  const ngos = data.partners;
  const [partnerId, setPartnerId] = useState('');
  const partner = ngos.find(item => item.id === partnerId) ?? ngos[0];
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const available = data.inventory_lots.filter(lot => (lot.distribution_plan?.donation_remaining ?? 0) > 0 && partner && compatiblePartners(lot, [partner], data.now, data.claims).length);
  return <div className="space-y-6 text-gray-900">
    <button onClick={onBack} className="flex gap-2"><ArrowLeft /> Înapoi la Dashboard</button>
    <h1 className="text-3xl font-bold flex gap-3"><BellRing /> Donații în timp real</h1>
    <label className="block">Beneficiar<select className="block mt-2 p-3 bg-white border rounded-xl w-full" value={partner?.id ?? ''} onChange={event => { setPartnerId(event.target.value); setMessage(''); }}>{ngos.map(ngo => <option key={ngo.id} value={ngo.id}>{ngo.name} · {ngo.id.slice(0, 6)}</option>)}</select></label>
    <p className="text-gray-500">Donații compatibile cu categoria, refrigerarea și timpul de ridicare al beneficiarului selectat.</p>
    {message && <p role="status" className="p-4 bg-indigo-50 rounded-xl">{message}</p>}
    {!available.length && <p>Nu există donații disponibile pentru acest beneficiar.</p>}
    {available.map(lot => <article key={lot.id} className="p-6 bg-white border rounded-2xl">
      <p className="text-gray-500">{data.stores.find(store => store.id === lot.store_id)?.name}</p>
      <h2 className="text-xl font-bold my-3">{categoryLabels[lot.category]}</h2>
      <p>{lot.distribution_plan!.donation_remaining!.toFixed(1)} {lot.unit_of_measure} · expiră {lot.expiration_date.toDate().toLocaleString('ro-RO')}</p>
      <button disabled={saving} className="mt-4 bg-gray-900 text-white p-3 rounded-xl disabled:opacity-50" onClick={async () => {
        if (!partner) return;
        setSaving(true); setMessage('');
        try { await claimDonation(lot, partner); setMessage(`Rezervare salvată. Cod de preluare: ${lot.id.slice(0, 4)}${partner.id.slice(0, 4)}`.toUpperCase()); }
        catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
        finally { setSaving(false); }
      }}>{saving ? 'Se salvează...' : 'Revendică donația'}</button>
    </article>)}
    <h2 className="text-xl font-bold">Rezervările beneficiarului</h2>
    {data.claims.filter(claim => claim.partner_id === partner?.id).map(claim => <div key={claim.id} className="bg-white p-4 rounded-xl border">Lot {claim.lot_id} · {claim.claimed_quantity} {claim.unit_of_measure ?? ''} · {claim.channel === 'social' ? 'Preț social' : 'Donație'} · {claim.status}{claim.pickup_deadline && ` · Ridicare până la ${claim.pickup_deadline.toDate().toLocaleString('ro-RO')}`}</div>)}
  </div>;
}
