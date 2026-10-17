import React, { useState } from 'react';
import { ArrowLeft, BrainCircuit, Sliders, TrendingUp, CheckCircle2, ShieldCheck, ShoppingCart, Truck, HeartHandshake } from 'lucide-react';

interface AiSimulationProps {
  onBack: () => void;
}

const AiSimulation: React.FC<AiSimulationProps> = ({ onBack }) => {
  const [volume, setVolume] = useState<number>(200);
  const [daysLeft, setDaysLeft] = useState<number>(3);
  const [discount, setDiscount] = useState<number>(30);
  const [simulationApplied, setSimulationApplied] = useState<boolean>(false);

  let retailPercent = (discount * 0.8) + (daysLeft * 5);
  retailPercent = Math.max(5, Math.min(95, retailPercent)); 

  const retailQty = Math.floor(volume * (retailPercent / 100));
  const remaining = volume - retailQty;
  const b2bQty = Math.floor(remaining * 0.7);
  const donationQty = remaining - b2bQty;

  const retailRevenue = retailQty * (10 * (1 - discount / 100));
  const b2bRevenue = b2bQty * 3;
  const protectedRevenue = Math.round(retailRevenue + b2bRevenue);

  const handleApplyScenario = () => {
    setSimulationApplied(true);
  };

  return (
    <div className="min-h-screen bg-[#111827] p-8 font-sans text-gray-100 overflow-y-auto">
      <button 
        onClick={onBack} 
        className="mb-6 text-purple-400 font-semibold hover:text-purple-300 flex items-center gap-2 transition-colors bg-[#1F2937] px-4 py-2 rounded-xl border border-gray-800 shadow-sm w-max cursor-pointer"
      >
        <ArrowLeft size={20} /> Înapoi la Dashboard
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
            <BrainCircuit size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Simulare AI: Smart Split</h1>
            <p className="text-gray-400">Ajustează variabilele pentru a prezice absorbția pieței și a împărți automat lotul.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6">
          
          <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col gap-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-3">
              <Sliders size={20} className="text-purple-400" /> Variabile Scenariu
            </h3>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Volum Lot (Unități/Kg):</span>
                <strong className="text-white">{volume}</strong>
              </label>
              <input type="range" min="50" max="1000" step="10" value={volume} onChange={(e) => { setVolume(Number(e.target.value)); setSimulationApplied(false); }}
                className="w-full accent-purple-500 bg-gray-700 h-2 rounded-lg cursor-pointer" />
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Timp până la expirare:</span>
                <strong className="text-white">{daysLeft} Zile</strong>
              </label>
              <input type="range" min="1" max="10" step="1" value={daysLeft} onChange={(e) => { setDaysLeft(Number(e.target.value)); setSimulationApplied(false); }}
                className="w-full accent-purple-500 bg-gray-700 h-2 rounded-lg cursor-pointer" />
            </div>

            <div>
              <label className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Reducere la Raft (%):</span>
                <strong className="text-purple-400">-{discount}%</strong>
              </label>
              <input type="range" min="10" max="80" step="5" value={discount} onChange={(e) => { setDiscount(Number(e.target.value)); setSimulationApplied(false); }}
                className="w-full accent-purple-500 bg-gray-700 h-2 rounded-lg cursor-pointer" />
            </div>
          </div>

          <div className="bg-[#1F2937] p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-700 pb-3 mb-4">
              <TrendingUp size={20} className="text-emerald-400" /> Predicție Absorbție și Alocare
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
                <ShoppingCart className="text-emerald-400 mb-2" size={28} />
                <span className="text-xs text-gray-400 mb-1">Se va vinde la raft</span>
                <span className="text-2xl font-bold text-emerald-400">{retailQty}</span>
                <span className="text-xs font-semibold text-emerald-900 bg-emerald-400/20 px-2 py-0.5 rounded-full mt-2">
                  {Math.round((retailQty / volume) * 100)}% din Lot
                </span>
              </div>

              <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
                <Truck className="text-blue-400 mb-2" size={28} />
                <span className="text-xs text-gray-400 mb-1">Transfer Bursă B2B</span>
                <span className="text-2xl font-bold text-blue-400">{b2bQty}</span>
                <span className="text-xs font-semibold text-blue-900 bg-blue-400/20 px-2 py-0.5 rounded-full mt-2">
                  {Math.round((b2bQty / volume) * 100)}% din Lot
                </span>
              </div>

              <div className="bg-[#111827] p-4 rounded-2xl border border-gray-800 text-center flex flex-col items-center justify-center">
                <HeartHandshake className="text-amber-400 mb-2" size={28} />
                <span className="text-xs text-gray-400 mb-1">Alocare Donații</span>
                <span className="text-2xl font-bold text-amber-400">{donationQty}</span>
                <span className="text-xs font-semibold text-amber-900 bg-amber-400/20 px-2 py-0.5 rounded-full mt-2">
                  {Math.round((donationQty / volume) * 100)}% din Lot
                </span>
              </div>
            </div>

            <div className="bg-purple-950/30 p-4 rounded-2xl border border-purple-500/30 flex justify-between items-center mb-6">
              <span className="text-sm text-purple-200 font-medium flex items-center gap-2">
                <ShieldCheck size={20} className="text-purple-400" /> Venit Financiar Protejat:
              </span>
              <span className="text-2xl font-extrabold text-purple-300">{protectedRevenue} RON</span>
            </div>

            <button
              onClick={handleApplyScenario}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all text-base cursor-pointer"
            >
              Confirmă &amp; Declanșează Smart Split
            </button>

            {simulationApplied && (
              <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                <p>
                  <strong>Scenariu Activat!</strong> Etichetele de la raft au fost reduse cu {discount}%. S-au emis automat {b2bQty} unități pe bursa B2B și s-a rezervat lotul de {donationQty} unități pentru ONG-uri.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSimulation;