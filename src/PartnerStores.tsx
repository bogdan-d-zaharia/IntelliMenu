import { useState } from 'react';
import { useFirestoreData } from './data/FirestoreProvider';
import { categoryLabels } from './lib/firestoreAdapter';
import { ArrowLeft, Store, MapPin, Phone, Mail, User, Clock, Package } from 'lucide-react';

export default function PartnerStores({ onBack }: { onBack: () => void }) {
  const data = useFirestoreData();
  const [partnerId, setPartnerId] = useState('');
  const partner = data.partners.find(item => item.id === partnerId) ?? data.partners[0];
  const claims = data.claims.filter(claim => {
    if (claim.partner_id !== partner?.id || !['pending', 'accepted'].includes(claim.status) || !(claim.claimed_quantity > 0)) return false;
    const lot = data.inventory_lots.find(item => item.id === claim.lot_id);
    return (!claim.pickup_deadline || claim.pickup_deadline.toMillis() > data.now)
      && (!lot || lot.expiration_date.toMillis() > data.now);
  });
  const groups = new Map<string, typeof claims>();
  for (const claim of claims) {
    const lot = data.inventory_lots.find(item => item.id === claim.lot_id);
    const storeId = claim.store_id ?? lot?.store_id ?? '';
    groups.set(storeId, [...(groups.get(storeId) ?? []), claim]);
  }
  return <div className="min-h-screen bg-[#F9F7F5] p-8 font-sans text-gray-900">
    <button onClick={onBack} className="mb-8 text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"><ArrowLeft size={20} /> Înapoi la Dashboard</button>
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-extrabold">Magazine Partenere</h2>
      <p className="text-gray-500 mt-2 mb-6">Produsele rezervate pentru beneficiar, din claims. Datele se actualizează în timp real.</p>
      <label className="block text-sm font-semibold mb-6">Beneficiar (ONG / cantină)
        <select value={partner?.id ?? ''} onChange={event => setPartnerId(event.target.value)} className="block mt-2 w-full bg-white border border-gray-200 rounded-xl p-3">
          {data.partners.map(item => <option key={item.id} value={item.id}>{item.name} · {item.id.slice(0, 6)}</option>)}
        </select>
      </label>
      {!partner && <p role="status">Nu există beneficiari înregistrați.</p>}
      {partner && !groups.size && <p role="status" className="bg-white border rounded-2xl p-6">Nu ai rezervări disponibile pentru preluare. Rezervările finalizate, anulate sau cu termen depășit nu sunt afișate aici.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[...groups].map(([storeId, reservations]) => {
        const store = data.stores.find(item => item.id === storeId);
        const phone = store?.contact_phone?.replace(/[^+0-9]/g, '');
        return <section key={storeId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-4 mb-5"><div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><Store size={26} /></div><div><h3 className="text-lg font-bold">{store?.name ?? 'Datele magazinului nu sunt disponibile'}</h3><span className="text-xs text-emerald-700">{reservations.length} rezervări pentru preluare</span></div></div>
          <div className="space-y-3 text-sm text-gray-600 border-b border-gray-100 pb-5">
            {store?.address && <p className="flex gap-2"><MapPin size={16} className="shrink-0" /><a className="hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`} target="_blank" rel="noreferrer">{store.address}</a></p>}
            {phone ? <p className="flex gap-2"><Phone size={16} /><a className="text-indigo-600 hover:underline" href={`tel:${phone}`}>{store?.contact_phone}</a></p> : <p>Telefon necompletat în Firestore.</p>}
            {store?.contact_email && <p className="flex gap-2"><Mail size={16} /><a href={`mailto:${store.contact_email}`} className="text-indigo-600 hover:underline">{store.contact_email}</a></p>}
            {store?.contact_person && <p className="flex gap-2"><User size={16} />{store.contact_person}</p>}
            {store?.opening_hours && <p className="flex gap-2"><Clock size={16} />Program: {store.opening_hours}</p>}
            {store?.pickup_instructions && <p>Instrucțiuni de ridicare: {store.pickup_instructions}</p>}
          </div>
          <div className="mt-5 space-y-4">{reservations.map(claim => {
            const lot = data.inventory_lots.find(item => item.id === claim.lot_id);
            const category = claim.category ?? lot?.category ?? '';
            const unit = claim.unit_of_measure ?? lot?.unit_of_measure;
            const channel = claim.channel ?? (partner?.type === 'ngo' ? 'donation' : undefined);
            return <article key={claim.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <h4 className="font-bold flex gap-2"><Package size={18} />{lot?.product_name ?? lot?.name ?? categoryLabels[category] ?? (category || 'Lot alimentar')}</h4>
              <p className="mt-2 font-semibold">{claim.claimed_quantity} {unit ?? '(unitate neprecizată)'}{claim.claimed_weight_kg != null && unit !== 'kg' ? ` · ${Number(claim.claimed_weight_kg.toFixed(3))} kg` : ''}</p>
              <p className="mt-1 text-sm">{channel === 'donation' ? 'Donație · gratuit' : channel === 'social' ? `Preț social${claim.price_per_unit != null ? ` · ${claim.price_per_unit.toFixed(2)} RON/${unit ?? 'unitate'}` : ''}` : 'Condițiile de preluare nu sunt precizate'}{claim.total_price != null && claim.total_price > 0 ? ` · Total: ${claim.total_price.toFixed(2)} RON` : ''}</p>
              {claim.pickup_deadline && <p className="text-sm text-amber-700 mt-2">Ridicare până la: {claim.pickup_deadline.toDate().toLocaleString('ro-RO')}</p>}
              {lot && <p className="text-xs text-gray-500 mt-1">Expiră: {lot.expiration_date.toDate().toLocaleString('ro-RO')}</p>}
              {claim.pickup_code && <p className="text-sm mt-2">Cod preluare: <strong>{claim.pickup_code}</strong></p>}
              <p className="text-xs text-gray-400 mt-2">Lot: {claim.lot_id} · Rezervare: {claim.id} · {claim.status === 'accepted' ? 'Acceptată' : 'Rezervată'}</p>
            </article>;
          })}</div>
        </section>;
      })}</div>
    </div>
  </div>;
}
