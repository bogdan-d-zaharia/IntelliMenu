import React, { useState } from 'react';
import { ArrowLeft, Building2, MapPin, Phone, FileText, CheckCircle2 } from 'lucide-react';

interface DonationsProps {
  onBack: () => void;
}

interface LocationItem {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  capacity: string;
  needs: string;
}

const locations: LocationItem[] = [
  {
    id: '1',
    name: 'Cantina Socială "Sfânta Vineri"',
    type: 'Cantină Municipală',
    address: 'Str. Principală nr. 12, Piatra Neamț',
    phone: '0233 123 456',
    capacity: '250 porții zilnice',
    needs: 'Lactate, Carne de pui, Legume',
  },
  {
    id: '2',
    name: 'Asociația Umanitară "Speranța Copiilor"',
    type: 'ONG Local',
    address: 'Bd. Republicii nr. 45, Piatra Neamț',
    phone: '0233 987 654',
    capacity: '120 beneficiari',
    needs: 'Produse perisabile cu termen scurt',
  },
  {
    id: '3',
    name: 'Centrul de Urgență Noapte și Zi',
    type: 'Centru Social',
    address: 'Aleea Tipografilor nr. 3',
    phone: '0233 555 444',
    capacity: '80 persoane adăpostite',
    needs: 'Mâncare gătită, Carne, Lactate',
  },
];

const Donations: React.FC<DonationsProps> = ({ onBack }) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const handleGeneratePdf = () => {
    setPdfGenerated(true);
    setTimeout(() => {
      alert(`Actele necesare (Contract Donație, Aviz de Însoțire Mărfuri) pentru ${selectedLocation?.name} au fost generate cu succes ca PDF!`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F5] p-8 font-sans text-gray-900">
      
      {/* Buton Înapoi */}
      <button 
        onClick={onBack} 
        className="mb-6 text-gray-600 font-semibold hover:text-gray-900 flex items-center gap-2 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-max"
      >
        <ArrowLeft size={20} /> Înapoi la Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Redirecționare Produse către Donații</h1>
        <p className="text-gray-600 mb-8">Selectează o instituție sau un ONG partener pentru a genera automat documentele legale de transfer.</p>

        {!selectedLocation ? (
          // Lista de locații
          <div className="grid grid-cols-1 gap-4">
            {locations.map((loc) => (
              <div 
                key={loc.id}
                onClick={() => { setSelectedLocation(loc); setPdfGenerated(false); }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:border-green-600 hover:shadow-md transition-all flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      {loc.type}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-2">{loc.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={16} /> {loc.address}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={16} /> {loc.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-700 block">Necesar: {loc.needs}</span>
                  <span className="text-xs text-gray-400 mt-1 block">Capacitate: {loc.capacity}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Detalii locație selectată și buton de generare PDF acte
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <button 
              onClick={() => setSelectedLocation(null)}
              className="text-sm text-blue-600 font-semibold mb-6 hover:underline flex items-center gap-1"
            >
              &larr; Înapoi la lista de locații
            </button>

            <div className="border-b border-gray-100 pb-6 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                {selectedLocation.type}
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-3">{selectedLocation.name}</h2>
              <p className="text-gray-600 mt-1">{selectedLocation.address} | Tel: {selectedLocation.phone}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">Detalii Lot de Produse Pregătit pentru Transfer:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Categorie:</strong> Produse alimentare (Lactate / Carne)</li>
                <li>• <strong>Cantitate:</strong> 75 Litri / kg (Stoc Critic - Prag 3)</li>
                <li>• <strong>Valoare fiscală:</strong> Redirecționare cu titlu gratuit (Scutit de TVA conform legislației risipei alimentare)</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleGeneratePdf}
                className="w-full sm:w-auto flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow transition-all flex items-center justify-center gap-3 text-base"
              >
                <FileText size={22} /> Generează PDF Acte Donație (Aviz &amp; Contract)
              </button>
            </div>

            {pdfGenerated && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 size={24} className="text-green-600" />
                <div>
                  <strong className="block font-bold">Documente generate cu succes!</strong>
                  <span className="text-sm">Actele au fost pregătite pentru descărcare și transmisie electronică către ANAF / Partener.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations;