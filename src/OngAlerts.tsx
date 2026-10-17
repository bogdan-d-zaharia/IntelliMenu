import React, { useState } from 'react';
import { Store, MapPin, Clock, ArrowRight, Milk, Beef, Croissant, Apple, BellRing, CheckCircle, X, ArrowLeft } from 'lucide-react';

interface AlertItem {
  id: number;
  category: string;
  product: string;
  qty: string;
  time: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  storeName?: string;
}

interface OngAlertsProps {
  onBack?: () => void;
}

const storeAlerts = [
  {
    id: 'store-1',
    name: 'Kaufland Iași - Tudor Vladimirescu',
    address: 'Str. Tudor Vladimirescu nr. 42',
    alerts: [
      { id: 101, category: 'Lactate & Brânzeturi', product: 'Iaurt Natur (Bax 24)', qty: '50 buc', time: '24h', icon: <Milk size={20} />, color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-200' },
      { id: 102, category: 'Mezeluri & Carne', product: 'Pui Grill Calitatea I', qty: '15 kg', time: '12h', icon: <Beef size={20} />, color: 'bg-red-100 text-red-600', borderColor: 'border-red-200' },
    ]
  },
  {
    id: 'store-2',
    name: 'Lidl - Nicolina',
    address: 'Șos. Nicolina nr. 2',
    alerts: [
      { id: 201, category: 'Patiserie & Panificație', product: 'Pâine integrală', qty: '30 buc', time: '6h', icon: <Croissant size={20} />, color: 'bg-amber-100 text-amber-600', borderColor: 'border-amber-200' },
      { id: 202, category: 'Fructe & Legume', product: 'Mere românești cal. II', qty: '20 kg', time: '48h', icon: <Apple size={20} />, color: 'bg-emerald-100 text-emerald-600', borderColor: 'border-emerald-200' }
    ]
  }
];

const OngAlerts: React.FC<OngAlertsProps> = ({ onBack }) => {
  const [claimedLot, setClaimedLot] = useState<AlertItem | null>(null);

  return (
    <div className="space-y-6 relative">

      {/* Buton de Înapoi elegant */}
      {onBack && (
        <button 
          onClick={onBack}
          className="text-gray-600 font-semibold hover:text-gray-900 flex items-center gap-2 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-max cursor-pointer mb-4"
        >
          <ArrowLeft size={20} /> Înapoi la Dashboard
        </button>
      )}
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
          <BellRing size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Alertor AI: Donații în Timp Real</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Loturi și notificări trimise de magazinele partenere, gata de preluare.</p>
        </div>
      </div>

      <div className="space-y-8">
        {storeAlerts.map(store => (
          <div key={store.id} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
            
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200 text-gray-700">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{store.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                    <MapPin size={14} />
                    <span>{store.address}</span>
                  </div>
                </div>
              </div>
              <span className="text-sm font-bold text-indigo-700 bg-indigo-100 px-4 py-1.5 rounded-full w-max">
                {store.alerts.length} loturi disponibile
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {store.alerts.map(alert => (
                <div key={alert.id} className={`flex flex-col justify-between p-5 rounded-2xl border ${alert.borderColor} bg-white hover:shadow-md transition-shadow`}>
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`p-3 rounded-xl ${alert.color}`}>
                      {alert.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{alert.category}</span>
                      <h4 className="text-xl font-bold text-gray-900 mt-0.5">{alert.product}</h4>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                          Cantitate: {alert.qty}
                        </span>
                        <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-lg ${alert.time === '12h' || alert.time === '6h' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>
                          <Clock size={14} />
                          {alert.time === '12h' || alert.time === '6h' ? `Urgent: ${alert.time}` : `SLA: ${alert.time}`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setClaimedLot({ ...alert, storeName: store.name })}
                    className="w-full mt-auto py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                  >
                    Revendică Lotul <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {claimedLot && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
            
            <div className="bg-emerald-500 p-8 flex flex-col items-center justify-center text-center relative">
              <button 
                onClick={() => setClaimedLot(null)}
                className="absolute top-4 right-4 text-white hover:bg-black/20 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <CheckCircle size={56} className="text-white mb-3" />
              <h3 className="text-3xl font-extrabold text-white mb-1">Lot revendicat cu succes!</h3>
              <p className="text-emerald-50 font-medium text-base mt-2">Ai rezervat {claimedLot.qty} de {claimedLot.product}.</p>
            </div>

            <div className="p-8 space-y-6">
              
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3">
                <Clock size={24} className="text-orange-600 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-orange-900 leading-relaxed">
                  <strong className="font-bold text-orange-700">Atenție:</strong> Ai la dispoziție <strong className="font-bold text-orange-700">{claimedLot.time} (SLA)</strong> pentru a ridica marfa de la rampa magazinului {claimedLot.storeName}.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div className="bg-emerald-500 rounded-full p-1 shrink-0 mt-0.5">
                  <CheckCircle size={16} className="text-white" />
                </div>
                <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                  Sistemul AI a citit datele asociației tale și a generat automat Procesul-Verbal de Predare-Primire. Documentul a fost trimis direct la managerul magazinului.
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 mb-2 font-bold uppercase tracking-wider">Codul tău de Preluare</p>
                <div className="inline-block bg-gray-100 px-8 py-4 rounded-2xl border border-gray-200 shadow-inner">
                  <p className="text-4xl font-black tracking-widest text-gray-900">#KF-8922</p>
                </div>
              </div>

              <button 
                onClick={() => setClaimedLot(null)}
                className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-lg transition-colors shadow-md active:scale-[0.98] cursor-pointer"
              >
                Am înțeles
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
};

export default OngAlerts;