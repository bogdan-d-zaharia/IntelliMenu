import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, Store, ShieldCheck, RefreshCw, Tag, HeartHandshake } from 'lucide-react';
import { obtineOferteActive } from './lib/activeOffersStore';
import type { OfertaActiva } from './lib/activeOffersStore';

interface ActiveOffersProps {
  onBack: () => void;
}

// Date simulate pentru ofertele comerciale la raft / B2B generate de AI
interface OfertaComerciala {
  id: string;
  magazin: string;
  produs: string;
  cantitate: string;
  reducere: string;
  pretNou: string;
  tipCanal: 'B2C (Reducere Raft)' | 'B2B (Bursă Comerț)';
  status: 'ACTIV_IN_PIATA' | 'VANDUT';
}

const oferteComercialeSimulate: OfertaComerciala[] = [
  {
    id: 'COM-301',
    magazin: 'Kaufland Iași - Tudor Vladimirescu',
    produs: 'Lapte UHT 1.5% (Palet 100 buc)',
    cantitate: '100 buc',
    reducere: '-50% (Trigger T1)',
    pretNou: '3.50 RON',
    tipCanal: 'B2C (Reducere Raft)',
    status: 'ACTIV_IN_PIATA'
  },
  {
    id: 'COM-302',
    magazin: 'Lidl - Nicolina',
    produs: 'Cascafal Clasic Vrac',
    cantitate: '45 kg',
    reducere: '-60% (Trigger T2 - Bursă)',
    pretNou: '18.00 RON/kg',
    tipCanal: 'B2B (Bursă Comerț)',
    status: 'ACTIV_IN_PIATA'
  }
];

const ActiveOffers: React.FC<ActiveOffersProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'ong' | 'comercial'>('comercial');
  const [oferteOng, setOferteOng] = useState<OfertaActiva[]>(() => obtineOferteActive());
  const [oferteComerciale] = useState<OfertaComerciala[]>(oferteComercialeSimulate);

  const reincarcaDatele = () => {
    setOferteOng(obtineOferteActive());
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <button 
        onClick={onBack}
        className="text-gray-600 font-semibold hover:text-gray-900 flex items-center gap-2 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-max cursor-pointer"
      >
        <ArrowLeft size={20} /> Înapoi la Categorii
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Urmărire Oferte Active & Status Preluare Piață</h2>
          <p className="text-sm text-gray-500 mt-1">Gestionează produsele trimise la reducere comercială și loturile redirecționate către ONG-uri.</p>
        </div>
        <button 
          onClick={reincarcaDatele}
          className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors cursor-pointer flex items-center gap-2 text-sm font-semibold w-max"
        >
          <RefreshCw size={18} /> Actualizează
        </button>
      </div>

      {/* Meniu mic cu două opțiuni (Tab-uri) */}
      <div className="flex bg-gray-200/70 p-1.5 rounded-2xl w-max gap-2">
        <button
          onClick={() => setActiveTab('comercial')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'comercial'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag size={18} className="text-emerald-600" />
          <span>1. Oferte Comerciale (Raft & B2B)</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
            {oferteComerciale.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ong')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'ong'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HeartHandshake size={18} className="text-indigo-600" />
          <span>2. Donații & Preluare ONG</span>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
            {oferteOng.length}
          </span>
        </button>
      </div>

      {/* Conținut în funcție de tab-ul selectat */}
      {activeTab === 'comercial' ? (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
          {oferteComerciale.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase">{item.id}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">{item.tipCanal}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{item.produs}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Store size={16} /> {item.magazin}</span>
                  <span className="bg-gray-100 px-3 py-0.5 rounded-lg font-medium">Cantitate: {item.cantitate}</span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-3 py-0.5 rounded-lg">{item.reducere}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[220px]">
                <div className="text-right space-y-1 w-full">
                  <span className="text-xs text-gray-400 block uppercase font-bold">Preț Nou Aplicat AI</span>
                  <span className="text-2xl font-black text-gray-900">{item.pretNou}</span>
                  <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-xs mt-1">
                    <CheckCircle2 size={16} /> Activ pe raft / bursa B2B
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-200">
          {oferteOng.map((oferta) => (
            <div key={oferta.id} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">{oferta.id}</span>
                  <span className="text-xs font-semibold text-gray-500">{oferta.dataAdaugare}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{oferta.produs}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Store size={16} /> {oferta.magazin}</span>
                  <span className="bg-gray-100 px-3 py-0.5 rounded-lg font-medium">Cantitate: {oferta.cantitate}</span>
                  <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-0.5 rounded-lg">{oferta.tipPlan}</span>
                </div>
              </div>

              <div className="flex flex-col items-end justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[240px]">
                {oferta.status === 'DISPONIBIL_PIATA' ? (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 w-full justify-center font-semibold text-sm">
                    <Clock size={18} /> În așteptare preluare ONG
                  </div>
                ) : (
                  <div className="space-y-1 text-right w-full">
                    <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-bold text-sm">
                      <CheckCircle2 size={18} /> Revendicat de {oferta.ongPartener}
                    </div>
                    <p className="text-xs text-gray-500">Cod preluare: <strong className="text-gray-900">{oferta.codPreluare}</strong></p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md mt-1">
                      <ShieldCheck size={14} /> Proces-verbal generat
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveOffers;