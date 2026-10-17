import React, { useState, useMemo } from 'react';
import { ArrowLeft, Activity, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot
} from 'recharts';

import type { LotAlimentar, CategorieAlimentara, TipScenariu } from './types/yield.types';
import { calculeazaIntervaleAxaDinamice, calculeazaScorRiscS, simuleazaScenariiFinanciare } from './lib/yieldEngine';
import { calculeazaEuristicaDinDate } from './lib/heuristics';

const StockAnalysis: React.FC<{ categoryName?: string; onBack: () => void }> = ({ categoryName, onBack }) => {
  const [scenariuSelectat, setScenariuSelectat] = useState<TipScenariu>('SCENARIU_3_HIBRID_AI');

  // 1. Identificăm categoria
  const categorieDetectata: CategorieAlimentara = useMemo(() => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('carne')) return 'carne_proaspata';
    if (name.includes('lactat')) return 'lactate';
    return 'conserve_uscate';
  }, [categoryName]);

  // 2. Definirea datelor lotului
  const lotCurent: LotAlimentar = useMemo(() => {
    const esteCarne = categorieDetectata === 'carne_proaspata';
    const esteLactate = categorieDetectata === 'lactate';

    return {
      id: 'IAȘI-4521',
      nume: `Lot ${categoryName || (esteCarne ? 'Pui' : esteLactate ? 'Lactate' : 'Conserve')}`,
      categorie: categorieDetectata,
      cantitateTotala: 120,
      vanzariMediiZilnice: esteCarne ? 25 : esteLactate ? 40 : 60,
      oreTotaleValabilitate: esteCarne ? 48 : esteLactate ? 72 : 120,
      oreRămase: esteCarne ? 20 : esteLactate ? 36 : 80,
      pretUnitarRON: esteCarne ? 10 : esteLactate ? 6 : 4,
      costAchizitieUnitarRON: esteCarne ? 5 : esteLactate ? 3 : 2
    };
  }, [categoryName, categorieDetectata]);

  // 3. Calculăm algoritmii și scenariile financiare
  const euristica = useMemo(() => calculeazaEuristicaDinDate([]), []);
  const praguri = useMemo(() => calculeazaIntervaleAxaDinamice(lotCurent, euristica), [lotCurent, euristica]);
  const scorRisc = useMemo(() => calculeazaScorRiscS(lotCurent), [lotCurent]);
  const scenarii = useMemo(() => simuleazaScenariiFinanciare(lotCurent, euristica), [lotCurent, euristica]);

  const scenariuCurent = scenarii[scenariuSelectat];

  // 4. Calculăm orele pentru axa X
  const T = lotCurent.oreTotaleValabilitate;
  const t1Hours = Math.round(T - praguri.pB2C);
  const t2Hours = Math.round(T - praguri.pB2B);
  const t3Hours = Math.round(T - praguri.pDonatie);

  const labelStart = `-${T}h (Recepție)`;
  const labelT1 = `-${t1Hours}h (T1)`;
  const labelT2 = `-${t2Hours}h (T2)`;
  const labelT3 = `-${t3Hours}h (T3)`;
  const labelEnd = `0h (Expirare)`;

  const pretFull = lotCurent.pretUnitarRON;
  const pretB2C = Number((pretFull * 0.5).toFixed(2));
  const pretB2B = Number((pretFull * 0.3).toFixed(2));
  const pretDonatie = 0;

  // Modificăm prețurile din grafic în funcție de scenariul selectat
  const chartData = useMemo(() => {
    let priceT2 = pretB2B;
    let priceT3 = pretDonatie;

    if (scenariuSelectat === 'SCENARIU_1_RAFT') {
      priceT2 = pretB2C; // În scenariul 1 nu există trecere B2B la T2
    }

    return [
      { time: labelStart, price: pretFull },
      { time: labelT1, price: pretFull },
      { time: labelT1 + " ", price: pretB2C },
      { time: labelT2, price: pretB2C },
      { time: labelT2 + " ", price: priceT2 },
      { time: labelT3, price: priceT2 },
      { time: labelT3 + " ", price: priceT3 },
      { time: labelEnd, price: priceT3 },
    ];
  }, [scenariuSelectat, pretFull, pretB2C, pretB2B, pretDonatie, labelStart, labelT1, labelT2, labelT3, labelEnd]);

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
          <h1 className="text-xl font-bold text-white">Bursa Risipei: Planificator & DSS Lot</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Retail Manager</span>
          <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow text-white ${scorRisc > 70 ? 'bg-red-600' : scorRisc > 40 ? 'bg-orange-500' : 'bg-emerald-600'}`}>
            <Activity size={18} /> Risc Expirare (S = {scorRisc}/100)
          </div>
        </div>
      </div>

      {/* SELECȚIE TAB-URI SCENARII STRATEGICE */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(scenarii) as TipScenariu[]).map((key) => {
          const sc = scenarii[key];
          const esteSelectat = scenariuSelectat === key;
          const esteAI = key === 'SCENARIU_3_HIBRID_AI';

          return (
            <button
              key={key}
              onClick={() => setScenariuSelectat(key)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                esteSelectat 
                  ? 'bg-[#1F2937] border-emerald-500 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/50' 
                  : 'bg-[#182232] border-gray-800 hover:border-gray-700 opacity-80'
              }`}
            >
              {esteAI && (
                <span className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                  RECOMANDAT AI
                </span>
              )}
              <h3 className="text-sm font-bold text-white mb-1">{sc.titlu}</h3>
              <p className="text-xs text-gray-400 mb-3 min-h-[32px]">{sc.descriere}</p>
              
              <div className="flex justify-between items-end border-t border-gray-800 pt-2">
                <div>
                  <span className="text-[10px] text-gray-400 block">Profit Net Estimat</span>
                  <span className={`text-base font-extrabold ${sc.profitNetEstimatRON > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {sc.profitNetEstimatRON} RON
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Split B2B / Raft</span>
                  <span className="text-xs font-bold text-blue-400">
                    {sc.procentB2B}% B2B / {sc.procentB2C}% B2C
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* Zona Grafic */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col relative">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm lg:text-base font-bold text-gray-100 flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={18} />
              Simulare Traiectorie Preț: {scenariuCurent.titlu} ({lotCurent.nume})
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
                
                {/* 4 ZONE DE FUNDAL */}
                <ReferenceArea x1={labelStart} x2={labelT1} fill="#065f46" fillOpacity={0.25} />
                <ReferenceArea x1={labelT1} x2={labelT2} fill="#b45309" fillOpacity={0.25} />
                <ReferenceArea x1={labelT2} x2={labelT3} fill="#1e3a8a" fillOpacity={0.25} />
                <ReferenceArea x1={labelT3} x2={labelEnd} fill="#7f1d1d" fillOpacity={0.3} />

                {/* LINIA ÎN TREPTE STEP-AFTER */}
                <Line 
                  type="stepAfter" 
                  dataKey="price" 
                  stroke="#34D399" 
                  strokeWidth={3} 
                  dot={false} 
                />

                {/* PUNCTELE DE TRIGGER */}
                <ReferenceDot x={labelT1} y={pretFull} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={labelT2} y={pretB2C} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={labelT3} y={scenariuSelectat === 'SCENARIU_1_RAFT' ? pretB2C : pretB2B} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* ETICHETE FLOTANTE */}
            <div className="absolute top-6 left-[15%] bg-[#065f46]/90 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/40">
              Faza 1: Preț Întreg
            </div>

            <div className="absolute top-[28%] left-[32%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[210px]">
              <span className="text-yellow-400 font-bold">● T1: Trigger -{Math.round((t1Hours/T)*100)}% Timp.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Promovare B2C (-50%)</p>
            </div>

            <div className="absolute top-[48%] left-[58%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[220px]">
              <span className="text-blue-400 font-bold">● T2: Trigger -{Math.round((t2Hours/T)*100)}% Timp.</span>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {scenariuSelectat === 'SCENARIU_1_RAFT' 
                  ? 'Menținere la Raft B2C' 
                  : `Split B2B: ${scenariuCurent.procentB2B}% pe Bursă`}
              </p>
            </div>
          </div>
        </div>

        {/* Panoul Lateral Financiar */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white mb-3 pb-2 border-b border-gray-700 flex items-center justify-between">
              <span>Bilanț Financiar Lot</span>
              <span className="text-xs text-gray-400 font-normal">{lotCurent.cantitateTotala} kg</span>
            </h3>

            <div className="space-y-3 mb-6">
              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-400">Venit Brut Estimat:</span>
                <span className="text-sm font-bold text-white">{scenariuCurent.venitBrutEstimatRON} RON</span>
              </div>

              <div className="bg-[#111827] p-3 rounded-xl border border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-400">Cost Depozitare/Holding:</span>
                <span className="text-sm font-bold text-red-400">-{scenariuCurent.costHoldingTotalRON} RON</span>
              </div>

              <div className="bg-[#111827] p-3 rounded-xl border border-emerald-500/30 flex justify-between items-center">
                <span className="text-xs text-emerald-400 font-semibold">Profit Net Real:</span>
                <span className="text-lg font-extrabold text-emerald-400">{scenariuCurent.profitNetEstimatRON} RON</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-300 bg-[#182232] p-3 rounded-xl border border-gray-800">
              <div className="flex justify-between">
                <span>Marjă Profit:</span>
                <strong className="text-white">{scenariuCurent.marjaProfitProcent}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Estimare Risipă (Donații):</span>
                <strong className={scenariuCurent.rataRisipaEstimata > 10 ? 'text-red-400' : 'text-emerald-400'}>
                  {scenariuCurent.rataRisipaEstimata}%
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> Aplică Planul {scenariuCurent.titlu}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockAnalysis;