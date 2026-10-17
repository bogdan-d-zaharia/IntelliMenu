import React, { useState } from 'react';
import { ArrowLeft, Tag, Truck, Users, FileText, CheckCircle2, Megaphone, Clock, Store } from 'lucide-react';

interface B2BOffersProps {
  onBack: () => void;
}

interface LotData {
  id: string;
  name: string;
  qty: number;
  unit: string;
  basePrice: number;
  timeLeft: string;
  category: string;
}

// 1. Mock Data: Loturi Disponibile care au ieșit din faza de preț întreg
const availableLots = [
  { id: 'IAȘI-4521', name: 'Carne Pui (Piept dezosat)', qty: 120, unit: 'kg', basePrice: 10, timeLeft: '20h', category: 'Carne' },
  { id: 'IAȘI-7732', name: 'Iaurt Natur Pilos', qty: 350, unit: 'buc', basePrice: 4, timeLeft: '36h', category: 'Lactate' },
  { id: 'IAȘI-9011', name: 'Mere Românești (Imperfecte)', qty: 500, unit: 'kg', basePrice: 3, timeLeft: '48h', category: 'Fructe' }
];

// Mock Data: Rezervări Active (Pasul 4 din cerință)
const activeBookings = [
  { id: 'BKG-001', partner: 'Restaurant "La Crama"', type: 'HoReCa', lot: 'Carne Pui (Piept dezosat)', qty: 50, status: 'Confirmat' },
  { id: 'BKG-002', partner: 'Cantina "Liceul Nr. 4"', type: 'Educație', lot: 'Mere Românești', qty: 200, status: 'Așteptare Plată' },
];

const B2BOffers: React.FC<B2BOffersProps> = ({ onBack }) => {
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [discount, setDiscount] = useState<number>(60); // Reducere default 60% pentru volum
  const [offerLaunched, setOfferLaunched] = useState<boolean>(false);
  const [downloadedDoc, setDownloadedDoc] = useState<string | null>(null);

  // Calcule financiare
  const socialPrice = selectedLot ? selectedLot.basePrice * (1 - discount / 100) : 0;
  const totalBatchValue = selectedLot ? selectedLot.qty * socialPrice : 0;

  const handleLaunchOffer = () => {
    setOfferLaunched(true);
    setTimeout(() => {
      // Modificarea este aici: selectedLot?.name în loc de selectedLot.name
      alert(`Notificări trimise! 48 de parteneri B2B (restaurante, procesatori, cantine) au fost alertați de oferta pentru ${selectedLot?.name}.`);
    }, 500);
  };

  const handleDownloadInvoice = (id: string) => {
    setDownloadedDoc(id);
    setTimeout(() => {
      alert(`Factura Proformă și Contractul de Preț Social pentru rezervarea ${id} au fost generate PDF!`);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#111827] p-8 font-sans text-gray-100 overflow-y-auto">
      
      {/* Buton Înapoi */}
      <button 
        onClick={onBack} 
        className="mb-6 text-orange-400 font-semibold hover:text-orange-300 flex items-center gap-2 transition-colors bg-[#1F2937] px-4 py-2 rounded-xl border border-gray-800 shadow-sm w-max"
      >
        <ArrowLeft size={20} /> Înapoi la Dashboard
      </button>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-orange-600/20 text-orange-400 rounded-xl border border-orange-500/30">
            <Tag size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Bursa B2B &amp; Oferte Volum</h1>
            <p className="text-gray-400">Lichidare rapidă a stocurilor critice către parteneri HoReCa, procesatori și cantine.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 mb-8">
          
          {/* SECȚIUNEA 1: Listarea Loturilor Disponibile */}
          <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
              <Store size={20} className="text-orange-400" /> Loturi Eligibile (Preț Social)
            </h3>
            
            <div className="space-y-3">
              {availableLots.map((lot) => (
                <div 
                  key={lot.id}
                  onClick={() => { setSelectedLot(lot); setOfferLaunched(false); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLot?.id === lot.id ? 'bg-orange-950/30 border-orange-500' : 'bg-[#111827] border-gray-800 hover:border-orange-500/50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white">{lot.name}</h4>
                    <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded flex items-center gap-1">
                      <Clock size={12} /> {lot.timeLeft}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Volum: <strong className="text-white">{lot.qty} {lot.unit}</strong></span>
                    <span>Preț Bază: <strong className="text-white">{lot.basePrice} RON/{lot.unit}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECȚIUNEA 2 & 3: Generarea Ofertei și Notificarea Partenerilor */}
          <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between">
            {!selectedLot ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Megaphone size={48} className="mb-4 opacity-20" />
                <p>Selectează un lot din listă pentru a configura oferta B2B.</p>
              </div>
            ) : (
              <div className="animate-fade-in flex flex-col h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-gray-700 pb-3">
                  <Megaphone size={20} className="text-blue-400" /> Configurare Batch Offer: {selectedLot.id}
                </h3>

                <div className="mb-6">
                  <label className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Discount de Volum aplicat:</span>
                    <strong className="text-orange-400">-{discount}%</strong>
                  </label>
                  <input type="range" min="30" max="90" step="5" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full accent-orange-500 bg-gray-700 h-2 rounded-lg cursor-pointer" />
                  <p className="text-xs text-gray-500 mt-2">Recomandat 60-70% pentru achiziția întregului lot.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Preț Nou B2B (Social):</span>
                    <span className="text-2xl font-bold text-emerald-400">{socialPrice.toFixed(2)} RON</span>
                  </div>
                  <div className="bg-[#111827] p-4 rounded-xl border border-gray-800 text-center">
                    <span className="text-xs text-gray-400 block mb-1">Valoare Totală Lot:</span>
                    <span className="text-2xl font-bold text-blue-400">{totalBatchValue.toFixed(0)} RON</span>
                  </div>
                </div>

                <div className="mt-auto">
                  {!offerLaunched ? (
                    <button
                      onClick={handleLaunchOffer}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
                    >
                      <Users size={20} /> Lansează Oferta &amp; Notifică Partenerii B2B
                    </button>
                  ) : (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
                      <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                      <p>
                        <strong>Ofertă Activă!</strong> Notificările push au fost trimise către rețeaua de parteneri. Așteptăm rezervări.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECȚIUNEA 4: Negociere, Rezervări Rapide și Facturare */}
        <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-3">
            <Truck size={20} className="text-emerald-400" /> Panou Status: Rezervări Active &amp; Documente
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-[#111827]">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Partener</th>
                  <th className="px-4 py-3">Produs / Lot</th>
                  <th className="px-4 py-3">Cantitate Rezervată</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Acțiune (Generare PDF)</th>
                </tr>
              </thead>
              <tbody>
                {activeBookings.map((bkg) => (
                  <tr key={bkg.id} className="border-b border-gray-800 hover:bg-[#111827]/50">
                    <td className="px-4 py-4">
                      <strong className="text-white block">{bkg.partner}</strong>
                      <span className="text-xs">{bkg.type}</span>
                    </td>
                    <td className="px-4 py-4 text-white">{bkg.lot}</td>
                    <td className="px-4 py-4 font-bold text-blue-400">{bkg.qty} unități</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${bkg.status === 'Confirmat' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
                        {bkg.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={() => handleDownloadInvoice(bkg.id)}
                        className={`flex items-center justify-end gap-2 ml-auto text-xs font-bold px-3 py-2 rounded-lg transition-colors ${downloadedDoc === bkg.id ? 'bg-emerald-600/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40'}`}
                      >
                        {downloadedDoc === bkg.id ? <><CheckCircle2 size={16}/> Generat</> : <><FileText size={16}/> Generează Proformă</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default B2BOffers;