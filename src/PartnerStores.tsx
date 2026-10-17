import React from 'react';
import { ArrowLeft, Store, MapPin } from 'lucide-react';

interface PartnerStoresProps {
  onBack: () => void;
}

const stores = [
  { id: 1, name: 'Kaufland', branch: 'Tudor Vladimirescu', address: 'Str. Tudor Vladimirescu nr. 42, Iași', status: 'Activ' },
  { id: 2, name: 'Lidl', branch: 'Nicolina', address: 'Șos. Nicolina nr. 2, Iași', status: 'Activ' },
  { id: 3, name: 'Profi', branch: 'Copou', address: 'B-dul Carol I, Iași', status: 'Activ' },
  { id: 4, name: 'Carrefour', branch: 'Felicia', address: 'Str. Bucium nr. 36, Iași', status: 'În curând' }
];

const PartnerStores: React.FC<PartnerStoresProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-[#F9F7F5] p-8 font-sans">
      <button 
        onClick={onBack} 
        className="mb-8 text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-2 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-max"
      >
        <ArrowLeft size={20} /> Înapoi la Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Magazine Partenere - Iași</h2>
          <p className="text-gray-500 mt-2 font-medium">Rețeaua de magazine din Iași de la care puteți prelua loturi alimentare.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {stores.map(store => (
            <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${store.status === 'Activ' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Store size={26} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{store.name} {store.branch}</h3>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mt-1 inline-block ${store.status === 'Activ' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {store.status}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <MapPin size={16} className="text-gray-400" />
                {store.address}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerStores;