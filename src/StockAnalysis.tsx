import React, { useMemo } from 'react';
import { Settings, ArrowLeft, Activity } from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot
} from 'recharts';

import type { LotAlimentar, CategorieAlimentara } from './types/yield.types';
import { calculeazaIntervaleAxaDinamice, calculeazaScorRiscS } from './lib/yieldEngine';
import { calculeazaEuristicaDinDate } from './lib/heuristics';

const StockAnalysis: React.FC<{ categoryName?: string; onBack: () => void }> = ({ categoryName, onBack }) => {
  
  // 1. Identificăm categoria din props
  const categorieDetectata: CategorieAlimentara = useMemo(() => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('carne')) return 'carne_proaspata';
    if (name.includes('lactat')) return 'lactate';
    return 'conserve_uscate';
  }, [categoryName]);

  // 2. Configurarea datelor lotului în funcție de categorie
  const lotCurent: LotAlimentar = useMemo(() => {
    const esteCarne = categorieDetectata === 'carne_proaspata';
    const esteLactate = categorieDetectata === 'lactate';

    return {
      id: 'IAȘI-4521',
      nume: `Lot ${categoryName || (esteCarne ? 'Pui' : esteLactate ? 'Lactate' : 'Conserve')}`,
      categorie: categorieDetectata,
      cantitateTotala: 120,
      vanzariMediiZilnice: esteCarne ? 25 : esteLactate ? 40 : 60, // Presiune mai mare pe carne
      oreTotaleValabilitate: esteCarne ? 48 : esteLactate ? 72 : 120,
      oreRămase: esteCarne ? 20 : esteLactate ? 36 : 80,
      pretUnitarRON: esteCarne ? 10 : esteLactate ? 6 : 4
    };
  }, [categoryName, categorieDetectata]);

  // 3. Rulăm algoritmii matematici
  const euristica = useMemo(() => calculeazaEuristicaDinDate([]), []);
  const praguri = useMemo(() => calculeazaIntervaleAxaDinamice(lotCurent, euristica), [lotCurent, euristica]);
  const scorRisc = useMemo(() => calculeazaScorRiscS(lotCurent), [lotCurent]);

  // 4. Calculăm orele exacte ale fiecărui Trigger T1, T2, T3
  const T = lotCurent.oreTotaleValabilitate;
  const t1Hours = Math.round(T - praguri.pB2C);
  const t2Hours = Math.round(T - praguri.pB2B);
  const t3Hours = Math.round(T - praguri.pDonatie);

  // Etichete pentru Axa X
  const labelStart = `-${T}h (Recepție)`;
  const labelT1 = `-${t1Hours}h (T1)`;
  const labelT2 = `-${t2Hours}h (T2)`;
  const labelT3 = `-${t3Hours}h (T3)`;
  const labelEnd = `0h (Expirare)`;

  // Prețuri pe etape
  const pretFull = lotCurent.pretUnitarRON;
  const pretB2C = Number((pretFull * 0.5).toFixed(2));  // 50% Reducere
  const pretB2B = Number((pretFull * 0.3).toFixed(2));  // Preț Social B2B
  const pretDonatie = 0;                                // Donație Fiscală

  // 5. Structura de date în trepte (Step-Chart) pentru Recharts
  const chartData = [
    { time: labelStart, price: pretFull, zone: 'Baza' },
    { time: labelT1, price: pretFull, zone: 'T1_Pre' },
    { time: labelT1 + " ", price: pretB2C, zone: 'T1_Post' }, // Pasul în jos T1
    { time: labelT2, price: pretB2C, zone: 'T2_Pre' },
    { time: labelT2 + " ", price: pretB2B, zone: 'T2_Post' }, // Pasul în jos T2
    { time: labelT3, price: pretB2B, zone: 'T3_Pre' },
    { time: labelT3 + " ", price: pretDonatie, zone: 'T3_Post' }, // Pasul în jos T3
    { time: labelEnd, price: pretDonatie, zone: 'Final' },
  ];

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
          <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow text-white ${scorRisc > 70 ? 'bg-red-600' : scorRisc > 40 ? 'bg-orange-500' : 'bg-emerald-600'}`}>
            <Activity size={18} /> Algoritm AI Activ (S = {scorRisc}/100)
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* Zona Grafic */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col relative">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm lg:text-base font-bold text-gray-100">
              Evoluția Dinamică a Prețului: Ciclul de Viață al Produsului &amp; Trigger-ele Strategice ({lotCurent.nume} #{lotCurent.id})
            </h2>
          </div>

          <div className="h-[430px] w-full mt-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 30, right: 30, bottom: 20, left: 10 }}>
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
                  domain={[0, pretFull + 2]}
                  ticks={[0, 2, 4, 6, 8, pretFull]}
                  label={{ value: 'Preț Unitar (RON)', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF' }} 
                />

                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} 
                  formatter={(val: any) => [`${val} RON`, 'Preț Unitar']}
                />
                
                {/* 4 ZONE DE FUNDAL COLORATE PE FIECARE ETAPĂ */}
                {/* Faza 1: Preț Întreg (Verde) */}
                <ReferenceArea x1={labelStart} x2={labelT1} fill="#065f46" fillOpacity={0.25} />
                
                {/* Faza 2: Promovare B2C (Portocaliu) */}
                <ReferenceArea x1={labelT1} x2={labelT2} fill="#b45309" fillOpacity={0.25} />
                
                {/* Faza 3: Preț Social B2B (Albastru) */}
                <ReferenceArea x1={labelT2} x2={labelT3} fill="#1e3a8a" fillOpacity={0.25} />
                
                {/* Faza 4: Donație Fiscală (Roșu) */}
                <ReferenceArea x1={labelT3} x2={labelEnd} fill="#7f1d1d" fillOpacity={0.3} />

                {/* LINIA DE PREȚ MULTICOLORĂ ÎN TREPTE */}
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#34D399" 
                  strokeWidth={3} 
                  dot={false} 
                />

                {/* PUNCTELE DE TRIGGER DE PE GRAFIC */}
                <ReferenceDot x={labelT1} y={pretFull} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={labelT2} y={pretB2C} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={labelT3} y={pretB2B} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* ETICHETE TEXT FLOTANTE STRUCTURATE EXACT CA ÎN POZĂ */}
            <div className="absolute top-6 left-[15%] bg-[#065f46]/90 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/40">
              Faza 1: Preț Întreg
            </div>

            <div className="absolute top-[28%] left-[32%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[210px]">
              <span className="text-yellow-400 font-bold">● T1: Trigger -{Math.round((t1Hours/T)*100)}% Timp Rămas.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Începe Promovare B2C (-50%)</p>
            </div>

            <div className="absolute top-[48%] left-[58%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[220px]">
              <span className="text-blue-400 font-bold">● T2: Trigger -{Math.round((t2Hours/T)*100)}% Timp Rămas.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Trecere pe Bursă (Preț Social B2B)</p>
            </div>

            <div className="absolute top-[68%] right-[5%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[180px]">
              <span className="text-red-400 font-bold">● T3: Trigger Critic.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Donație Fiscală (Instantanee)</p>
            </div>
          </div>
        </div>

        {/* Panoul Lateral cu Detalii și Butoane */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white mb-3 pb-2 border-b border-gray-700">Lot Details</h3>
            <div className="space-y-2 text-sm text-gray-300 mb-4">
              <p><span className="text-gray-400">Volume:</span> <strong className="text-white">{lotCurent.cantitateTotala} kg</strong></p>
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