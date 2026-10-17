import React from 'react';
import { ArrowLeft, UploadCloud, FileText, ShieldCheck, CheckCircle, Bot, Zap, Box, FileDigit } from 'lucide-react';

interface OngContractsProps {
  onBack: () => void;
}

const OngContracts: React.FC<OngContractsProps> = ({ onBack }) => {
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
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Contracte & Fiscalitate</h2>
          <p className="text-gray-500 mt-2 font-medium">
            Zona securizată pentru acreditarea asociației și generarea actelor prin API-uri inteligente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Certificat ONG</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Încarcă actul constitutiv. Un API de tip OCR va extrage automat datele asociației.
            </p>
            <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
              <UploadCloud size={18} /> Încarcă Document
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShieldCheck size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Cod Fiscal (CUI)</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Încarcă certificatul fiscal pentru validarea tranzacțiilor B2B și a donațiilor.
            </p>
            <button className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors">
              <UploadCloud size={18} /> Încarcă Document
            </button>
          </div>
        </div>

        <div className="bg-[#1F2937] rounded-2xl p-8 shadow-md text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/5">
            <Bot size={180} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Bot size={28} className="text-emerald-400" /> Asistent Fiscal & Logistic AI
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed max-w-2xl text-lg">
              Nu mai completați acte manual. Platforma utilizează <strong className="text-white">inteligența artificială (OCR)</strong> pentru a citi documentele încărcate și preia metadatele loturilor de la manager pentru a genera actele legale de transport.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <FileDigit size={18}/> 1. Extragere Date (OCR)
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  CUI, Denumire și Adresă extrase automat și inserate în antetul avizelor de expediție.
                </p>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <Box size={18}/> 2. Condiții Transport (DSVSA)
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  AI-ul verifică tipul produsului revendicat și tipărește automat pe act temperatura de tranzit (ex: 2-4°C pentru carne).
                </p>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <CheckCircle size={18}/> 3. Trasabilitate Lot
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Se mapează instant greutatea totală, numărul lotului și data de expirare preluată din baza de date a magazinului.
                </p>
              </div>

              <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-sm">
                  <Zap size={18}/> 4. Calcul Deducere Fiscală
                </div>
                <p className="text-xs text-gray-400 font-medium leading-relaxed">
                  Calcularea valorii contabile reziduale, generând Anexa 1 necesară contabilului magazinului pentru deducerea de 20%.
                </p>
              </div>
            </div>

            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95">
              <Zap size={20} className="fill-white" /> Generează Contract & Aviz (AI Demo)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OngContracts;