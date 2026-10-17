import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot
} from 'recharts';

const data = [
  { time: '-48h (Recepție)', price: 10, zone: 'green' },
  { time: '-38h', price: 10, zone: 'green' },
  { time: '-36h (T1)', price: 5, zone: 'orange' }, 
  { time: '-24h', price: 5, zone: 'orange' },
  { time: '-12h (T2)', price: 4, zone: 'red' },    
  { time: '-2h', price: 4, zone: 'red' },
  { time: '0h (Expirare)', price: 0, zone: 'red' },
];

const StockAnalysis: React.FC<{ categoryName?: string; onBack: () => void }> = ({ categoryName, onBack }) => {
  return (
    <div className="min-h-screen bg-[#111827] p-6 font-sans text-gray-100 overflow-y-auto">
      
      {/* Buton Înapoi */}
      <button 
        onClick={onBack} 
        className="mb-4 text-blue-400 font-bold hover:text-blue-300 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft size={20} /> Înapoi la Meniul de Categorii
      </button>

      {/* Header Top */}
      <div className="flex items-center justify-between bg-[#1F2937] p-4 rounded-xl shadow-md mb-6 border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-blue-950 font-extrabold p-2 rounded-lg border-2 border-blue-900 flex items-center justify-center w-10 h-10 shadow">
            Lidl
          </div>
          <h1 className="text-xl font-bold text-white">Bursa Risipei: Panou de Optimizare Stocuri</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Retail Manager</span>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow">
            Algoritm AI Activ <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* Zona Grafic */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col relative">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm lg:text-base font-bold text-gray-100">
              Analiză {categoryName || "Produse"}: Ciclul de Viață &amp; Trigger-ele Strategice (Lot #IAȘI-4521)
            </h2>
          </div>

          <div className="h-[430px] w-full mt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 30, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                  label={{ value: 'Timp Rămas până la Expirare (ore)', position: 'bottom', offset: 0, fill: '#9CA3AF' }} 
                />
                <YAxis 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                  domain={[0, 12]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  label={{ value: 'Preț Unitar (RON)', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} 
                />
                
                {/* Zonele de fundal colorate pe etape */}
                <ReferenceArea x1="-48h (Recepție)" x2="-36h (T1)" fill="#065f46" fillOpacity={0.25} />
                <ReferenceArea x1="-36h (T1)" x2="-12h (T2)" fill="#b45309" fillOpacity={0.25} />
                <ReferenceArea x1="-12h (T2)" x2="0h (Expirare)" fill="#991b1b" fillOpacity={0.25} />

                {/* Linia de preț dinamică în trepte */}
                <Area type="stepAfter" dataKey="price" fill="#10B981" stroke="#10B981" fillOpacity={0.15} strokeWidth={3} />
                <Line type="stepAfter" dataKey="price" stroke="#34D399" strokeWidth={3} dot={false} />

                {/* Puncte de Trigger Exacte */}
                <ReferenceDot x="-36h (T1)" y={5} r={5} fill="#F59E0B" stroke="#fff" strokeWidth={1} />
                <ReferenceDot x="-12h (T2)" y={4} r={5} fill="#3B82F6" stroke="#fff" strokeWidth={1} />
                <ReferenceDot x="0h (Expirare)" y={0} r={5} fill="#EF4444" stroke="#fff" strokeWidth={1} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Etichete Text flotante stilizate ca în imaginea de referință */}
            <div className="absolute top-6 left-[18%] bg-[#065f46]/80 text-emerald-200 text-xs font-semibold px-2 py-0.5 rounded border border-emerald-500/40">
              Faza 1: Preț Întreg
            </div>

            <div className="absolute top-[32%] left-[43%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[200px]">
              <span className="text-yellow-400 font-bold">● T1: Trigger -25% Timp Rămas.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Începe Promovare B2C (-50%)</p>
            </div>

            <div className="absolute top-[42%] left-[68%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[210px]">
              <span className="text-blue-400 font-bold">● T2: Trigger -75% Timp Rămas.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Trecere pe Bursă (Preț Social B2B)</p>
            </div>

            <div className="absolute top-[52%] right-[8%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[170px]">
              <span className="text-red-400 font-bold">● T3: Trigger Critic.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Donație Fiscală</p>
            </div>
          </div>
        </div>

        {/* Panoul Lateral cu Detalii și Butoane */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white mb-3 pb-2 border-b border-gray-700">Lot Details</h3>
            <div className="space-y-2 text-sm text-gray-300 mb-4">
              <p><span className="text-gray-400">Volume:</span> <strong className="text-white">120 kg</strong></p>
              <p className="flex items-center gap-2">
                <span className="text-gray-400">Status:</span> 
                <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Trecere pe Bursă (B2B)
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-xs text-gray-400 block mb-1">Venit Protejat:</span>
                <span className="text-lg font-bold text-emerald-400">850 RON</span>
              </div>
              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 text-center">
                <span className="text-xs text-gray-400 block mb-1">Marjă Protejată:</span>
                <span className="text-lg font-bold text-blue-400">65%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2">
              Activează Promovare -50% (Raft)
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2">
              Rezervă B2B: Preț Social (Cantine)
            </button>
            <button className="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2">
              Donație Fiscală (Instantanee)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
            <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 text-center">
              <span className="text-xs text-gray-400 block mb-1">Venit Protejat:</span>
              <span className="text-base font-bold text-emerald-400">850 RON</span>
            </div>
            <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 text-center">
              <span className="text-xs text-gray-400 block mb-1">Marjă Protejată:</span>
              <span className="text-base font-bold text-blue-400">65%</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockAnalysis;