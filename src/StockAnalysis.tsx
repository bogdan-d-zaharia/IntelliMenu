import React, { useState, useMemo } from 'react';
import { ArrowLeft, Activity, TrendingUp, ShieldCheck, Leaf } from 'lucide-react';
import { adaugaOfertaNoua } from './lib/activeOffersStore';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot
} from 'recharts';

import type { LotAlimentar, CategorieAlimentara, TipScenariu } from './types/yield.types';
import { calculeazaIntervaleAxaDinamice, calculeazaScorRiscS, simuleazaScenariiFinanciare } from './lib/yieldEngine';

interface StockAnalysisProps {
  categoryName?: string;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({ categoryName, onBack, onNavigate }) => {
  const [succesAplicat, setSuccesAplicat] = useState(false);
  const [scenariuSelectat, setScenariuSelectat] = useState<TipScenariu>('SCENARIU_3_HIBRID_AI');

  const categorieDetectata: CategorieAlimentara = useMemo(() => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('carne')) return 'carne_proaspata';
    if (name.includes('lactat')) return 'lactate';
    return 'conserve_uscate';
  }, [categoryName]);

  const lotCurent: LotAlimentar = useMemo(() => {
    const esteCarne = categorieDetectata === 'carne_proaspata';
    const esteLactate = categorieDetectata === 'lactate';

    const numeCategorieFormatat = categoryName 
      ? categoryName 
      : (esteCarne ? 'Carne Proaspătă' : esteLactate ? 'Lactate & Brânzeturi' : 'Produse Uscate & Conserve');

    return {
      id: 'IAȘI-4521',
      nume: `Lot ${numeCategorieFormatat}`,
      categorie: categorieDetectata,
      cantitateTotala: 120,
      vanzariMediiZilnice: esteCarne ? 25 : esteLactate ? 40 : 50,
      oreTotaleValabilitate: esteCarne ? 48 : esteLactate ? 72 : 96,
      oreRămase: esteCarne ? 20 : esteLactate ? 36 : 60,
      pretUnitarRON: esteCarne ? 12 : esteLactate ? 7 : 6,
      costAchizitieUnitarRON: esteCarne ? 6 : esteLactate ? 3.5 : 2.5
    };
  }, [categoryName, categorieDetectata]);

  const praguri = useMemo(() => calculeazaIntervaleAxaDinamice(lotCurent), [lotCurent]);
  const scorRisc = useMemo(() => calculeazaScorRiscS(), []);
  const scenarii = useMemo(() => simuleazaScenariiFinanciare(lotCurent), [lotCurent]);

  const cheieScenariuRecomandat = useMemo(() => {
    return (Object.keys(scenarii) as TipScenariu[]).reduce((maxKey, currentKey) => {
      return scenarii[currentKey].scorIES > scenarii[maxKey].scorIES ? currentKey : maxKey;
    }, 'SCENARIU_3_HIBRID_AI' as TipScenariu);
  }, [scenarii]);

  const scenariuCurent = scenarii[scenariuSelectat];

  const handleAplicaPlan = () => {
    // 1. Înregistrează oferta în piață și trimite notificarea automată către beneficiari/ONG
    adaugaOfertaNoua({
      magazin: 'Kaufland Iași - Tudor Vladimirescu',
      categorie: categoryName || 'Lactate & Brânzeturi',
      produs: 'Lot critic - ' + scenariuCurent.titlu,
      cantitate: '120 kg',
      tipPlan: scenariuCurent.titlu
    });
    
    setSuccesAplicat(true);
    
    // 2. Redirecționare automată către pagina de oferte active a managerului
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('active-offers');
      }
    }, 700);
  };

  const T = lotCurent.oreTotaleValabilitate;
  const pB2C_hours = praguri.pB2C;      
  const pB2B_hours = praguri.pB2B;      
  const pDonatie_hours = praguri.pDonatie; 

  const pretFull = lotCurent.pretUnitarRON;
  const pretB2C = Number((pretFull * 0.5).toFixed(2));
  const pretB2B = Number((pretFull * 0.40).toFixed(2));
  const pretDonatie = 0;

  const chartData = useMemo(() => {
    let priceT2 = pretB2B;
    const priceT3 = pretDonatie;

    if (scenariuSelectat === 'SCENARIU_1_RAFT') {
      priceT2 = pretB2C;
    }

    return [
      { time: -T, price: pretFull, label: `${T}h (Recepție)` },
      { time: -pB2C_hours, price: pretFull, label: `${pB2C_hours}h (T1)` },
      { time: -pB2C_hours, price: pretB2C, label: `${pB2C_hours}h (T1)` },
      { time: -pB2B_hours, price: pretB2C, label: `${pB2B_hours}h (T2)` },
      { time: -pB2B_hours, price: priceT2, label: `${pB2B_hours}h (T2)` },
      { time: -pDonatie_hours, price: priceT2, label: `${pDonatie_hours}h (T3)` },
      { time: -pDonatie_hours, price: priceT3, label: `${pDonatie_hours}h (T3)` },
      { time: 0, price: priceT3, label: '0h (Expirare)' },
    ];
  }, [scenariuSelectat, T, pB2C_hours, pB2B_hours, pDonatie_hours, pretFull, pretB2C, pretB2B, pretDonatie]);

  return (
    <div className="min-h-screen bg-[#111827] p-6 font-sans text-gray-100 overflow-y-auto">
      <button 
        onClick={onBack} 
        className="mb-4 text-blue-400 font-bold hover:text-blue-300 flex items-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} /> Înapoi la Meniul de Categorii
      </button>

      <div className="flex items-center justify-between bg-[#1F2937] p-4 rounded-xl shadow-md mb-6 border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-blue-950 font-extrabold p-2 rounded-lg border-2 border-blue-900 flex items-center justify-center w-10 h-10 shadow">
            Lidl
          </div>
          <h1 className="text-xl font-bold text-white">Bursa Risipei: Planificator &amp; DSS Lot</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Retail Manager</span>
          <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow text-white ${scorRisc > 70 ? 'bg-red-600' : scorRisc > 40 ? 'bg-orange-500' : 'bg-emerald-600'}`}>
            <Activity size={18} /> Risc Expirare (S = {scorRisc}/100)
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(scenarii) as TipScenariu[]).map((key) => {
          const sc = scenarii[key];
          const esteSelectat = scenariuSelectat === key;
          const esteRecomandatAI = key === cheieScenariuRecomandat;

          return (
            <button
              key={key}
              onClick={() => setScenariuSelectat(key)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                esteSelectat 
                  ? 'bg-[#1F2937] border-emerald-500 shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-500/50' 
                  : 'bg-[#182232] border-gray-800 hover:border-gray-700 opacity-80'
              }`}
            >
              {esteRecomandatAI && (
                <span className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                  <Leaf size={10} /> RECOMANDAT AI
                </span>
              )}
              
              <h3 className="text-sm font-bold text-white mb-1">{sc.titlu}</h3>
              <p className="text-xs text-gray-400 mb-3 min-h-[32px]">{sc.descriere}</p>
              
              <div className="flex justify-between items-end border-t border-gray-800 pt-2">
                <div>
                  <span className="text-[10px] text-gray-400 block">Profit Net Estimat</span>
                  <span className={`text-base font-extrabold ${sc.profitNetEstimatRON > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Math.abs(sc.profitNetEstimatRON)} RON
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
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
                  type="number"
                  domain={[-T, 0]}
                  ticks={[-T, -pB2C_hours, -pB2B_hours, -pDonatie_hours, 0]}
                  tickFormatter={(val) => {
                    const positiveHours = Math.abs(val);
                    if (val === -T) return `${positiveHours}h (Recepție)`;
                    if (val === 0) return `0h (Expirare)`;
                    if (val === -pB2C_hours) return `${positiveHours}h (T1)`;
                    if (val === -pB2B_hours) return `${positiveHours}h (T2)`;
                    if (val === -pDonatie_hours) return `${positiveHours}h (T3)`;
                    return `${positiveHours}h`;
                  }}
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
                  formatter={(val) => [`${val} RON`, 'Preț Unitar']} 
                  labelFormatter={(val) => `Timp Rămas: ${Math.abs(Number(val))} ore`}
                />
                
                <ReferenceArea x1={-T} x2={-pB2C_hours} fill="#065f46" fillOpacity={0.25} />
                <ReferenceArea x1={-pB2C_hours} x2={-pB2B_hours} fill="#b45309" fillOpacity={0.25} />
                <ReferenceArea x1={-pB2B_hours} x2={-pDonatie_hours} fill="#1e3a8a" fillOpacity={0.25} />
                <ReferenceArea x1={-pDonatie_hours} x2={0} fill="#7f1d1d" fillOpacity={0.3} />

                <Line 
                  type="stepAfter" 
                  dataKey="price" 
                  stroke="#34D399" 
                  strokeWidth={3} 
                  dot={false} 
                />

                <ReferenceDot x={-pB2C_hours} y={pretFull} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={-pB2B_hours} y={pretB2C} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={-pDonatie_hours} y={scenariuSelectat === 'SCENARIU_1_RAFT' ? pretB2C : pretB2B} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>

            <div className="absolute top-6 left-[15%] bg-[#065f46]/90 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/40 pointer-events-none">
              Faza 1: Preț Întreg
            </div>

            <div className="absolute top-[28%] left-[32%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[210px] pointer-events-none">
              <span className="text-yellow-400 font-bold">● T1: Trigger {pB2C_hours}h Rămase</span>
              <p className="text-[10px] text-gray-300 mt-0.5">Promovare B2C (-50% la Raft)</p>
            </div>

            <div className="absolute top-[48%] left-[58%] bg-[#111827] text-white text-xs p-2 rounded-lg border border-gray-700 shadow-xl max-w-[220px] pointer-events-none">
              <span className="text-blue-400 font-bold">● T2: Trigger {pB2B_hours}h Rămase</span>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {scenariuSelectat === 'SCENARIU_1_RAFT' 
                  ? 'Menținere la Raft B2C' 
                  : `Split B2B: ${scenariuCurent.procentB2B}% pe Bursă`}
              </p>
            </div>
          </div>
        </div>

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
                <span className="text-lg font-extrabold text-emerald-400">
                  {Math.abs(scenariuCurent.profitNetEstimatRON)} RON
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-300 bg-[#182232] p-3 rounded-xl border border-gray-800">
              <div className="flex justify-between items-center">
                <span>Marjă Profit:</span>
                <strong className="text-emerald-400">
                  +{Math.abs(scenariuCurent.marjaProfitProcent)}%
                </strong>
              </div>

              <div className="flex justify-between items-center border-t border-gray-800 pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <span>Scor IES (Eficiență ESG):</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {scenariuCurent.id === 'SCENARIU_1_RAFT' ? '45 / 100 pts' : scenariuCurent.id === 'SCENARIU_2_B2B_INTEGRAL' ? '82 / 100 pts' : '98 / 100 pts'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Risipă Estimat (Deșeuri):</span>
                <strong className={scenariuCurent.id === 'SCENARIU_1_RAFT' ? 'text-red-400' : 'text-emerald-400'}>
                  {scenariuCurent.id === 'SCENARIU_1_RAFT' ? '12%' : '0%'}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span>Redirecționat către Donații:</span>
                <strong className="text-blue-400">
                  {scenariuCurent.id === 'SCENARIU_1_RAFT' ? '33% (40 kg)' : '0% (0 kg)'}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleAplicaPlan}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck size={18} /> 
              {succesAplicat ? 'Plan Aplicat & Trimis în Piață! ✓' : `Aplică ${scenariuCurent.titlu}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;