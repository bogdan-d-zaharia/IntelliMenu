import React, { useState, useMemo } from 'react';
import { ArrowLeft, Activity, TrendingUp, ShieldCheck, Leaf } from 'lucide-react';
import { useFirestoreData } from './data/FirestoreProvider';
import { adaptLot, categoryLabels } from './lib/firestoreAdapter';
import { applyPlan } from './lib/firestoreActions';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceDot
} from 'recharts';

import type { TipScenariu } from './types/yield.types';
import { calculeazaIntervaleAxaDinamice, calculeazaScorRiscS, simuleazaScenariiFinanciare } from './lib/yieldEngine';

interface StockAnalysisProps {
  categoryName?: string;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({ categoryName, onBack, onNavigate }) => {
  const [succesAplicat, setSuccesAplicat] = useState(false);
  const [scenariuSelectat, setScenariuSelectat] = useState<TipScenariu>('SCENARIU_3_HIBRID_AI');

  const data = useFirestoreData();
  const [selectedLotId, setSelectedLotId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const matchingLots = data.inventory_lots.filter(lot => categoryLabels[lot.category] === categoryName);
  const sourceLot = matchingLots.find(lot => lot.id === selectedLotId) ?? matchingLots[0];
  const adapted = useMemo(() => {
    if (!sourceLot) return { error: 'Nu există loturi în această categorie.' };
    try { return { result: adaptLot(sourceLot, data.stores.find(store => store.id === sourceLot.store_id), data.partners, data.claims, data.sales_history, data.now) }; }
    catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  }, [sourceLot, data]);
  if (!adapted.result || !sourceLot) return <div className="min-h-screen bg-gray-900 text-white p-8"><button onClick={onBack}>Înapoi</button><p role="alert">{adapted.error}</p></div>;
  return <LotAnalysis key={sourceLot.id} {...{ sourceLot, adapted: adapted.result, data, matchingLots, setSelectedLotId, saving, setSaving, saveError, setSaveError, succesAplicat, setSuccesAplicat, scenariuSelectat, setScenariuSelectat, onBack, onNavigate }} />;
};

type AnalysisDetailsProps = {
  sourceLot: ReturnType<typeof useFirestoreData>['inventory_lots'][number];
  adapted: ReturnType<typeof adaptLot>;
  data: ReturnType<typeof useFirestoreData>;
  matchingLots: ReturnType<typeof useFirestoreData>['inventory_lots'];
  setSelectedLotId: (value: string) => void;
  saving: boolean; setSaving: (value: boolean) => void;
  saveError: string; setSaveError: (value: string) => void;
  succesAplicat: boolean; setSuccesAplicat: (value: boolean) => void;
  scenariuSelectat: TipScenariu; setScenariuSelectat: (value: TipScenariu) => void;
  onBack: () => void; onNavigate?: (view: string) => void;
};

const LotAnalysis = ({ sourceLot, adapted, data, matchingLots, setSelectedLotId, saving, setSaving, saveError, setSaveError, succesAplicat, setSuccesAplicat, scenariuSelectat, setScenariuSelectat, onBack, onNavigate }: AnalysisDetailsProps) => {
  const lotCurent = adapted.lot;
  const praguri = useMemo(() => calculeazaIntervaleAxaDinamice(lotCurent, adapted.config), [lotCurent, adapted.config]);
  const scorRisc = calculeazaScorRiscS(lotCurent);
  const scenarii = useMemo(() => simuleazaScenariiFinanciare(lotCurent, adapted.config), [lotCurent, adapted.config]);

  const cheieScenariuRecomandat = useMemo(() => {
    return (Object.keys(scenarii) as TipScenariu[]).reduce((maxKey, currentKey) => {
      return scenarii[currentKey].scorIES > scenarii[maxKey].scorIES ? currentKey : maxKey;
    }, 'SCENARIU_3_HIBRID_AI' as TipScenariu);
  }, [scenarii]);

  const scenariuCurent = scenarii[scenariuSelectat];

  const handleAplicaPlan = async () => {
    setSaving(true); setSaveError('');
    try {
      await applyPlan(sourceLot, scenariuCurent);
      setSuccesAplicat(true);
      onNavigate?.('active-offers');
    } catch (error) { setSaveError(error instanceof Error ? error.message : String(error)); }
    finally { setSaving(false); }
  };

  const T = lotCurent.oreTotaleValabilitate;
  const pB2C_hours = praguri.pB2C;      
  const pB2B_hours = praguri.pB2B;      
  const pDonatie_hours = praguri.pDonatie; 

  const pretFull = lotCurent.pretUnitarRON;
  const pretB2C = Number((pretFull * 0.5).toFixed(2));
  const pretB2B = Number((pretFull * (lotCurent.pretB2BFractie ?? 0)).toFixed(2));
  const pretDonatie = 0;

  const chartData = useMemo(() => {
    let priceT2 = pretB2B;
    const priceT3 = pretDonatie;

    if (scenariuSelectat === 'SCENARIU_1_RAFT' || !lotCurent.capacitateB2B) {
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
  }, [scenariuSelectat, T, pB2C_hours, pB2B_hours, pDonatie_hours, pretFull, pretB2C, pretB2B, pretDonatie, lotCurent.capacitateB2B]);

  return (
    <div className="min-h-screen bg-[#111827] p-6 font-sans text-gray-100 overflow-y-auto">
      
      {/* Navigation Header */}
      <button 
        onClick={onBack} 
        className="mb-4 text-blue-400 font-bold hover:text-blue-300 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft size={20} /> Înapoi la Meniul de Categorii
      </button>

      {/* Main Bar Top */}
      <div className="flex items-center justify-between bg-[#1F2937] p-4 rounded-xl shadow-md mb-6 border border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-blue-950 font-extrabold p-2 rounded-lg border-2 border-blue-900 flex items-center justify-center w-10 h-10 shadow">
            IM
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

      <div className="mb-6 bg-[#1F2937] p-4 rounded-xl border border-gray-800">
        <label className="text-sm text-gray-300 block">Lot analizat
          <select className="ml-3 p-2 bg-[#111827] rounded-lg border border-gray-700 max-w-full" value={sourceLot.id} onChange={event => { setSelectedLotId(event.target.value); setSuccesAplicat(false); setSaveError(''); }}>
            {matchingLots.map(lot => <option key={lot.id} value={lot.id}>{data.stores.find(store => store.id === lot.store_id)?.name} · {lot.quantity} {lot.unit_of_measure} · {lot.id}</option>)}
          </select>
        </label>
        <p className="text-xs text-gray-400 mt-2">{lotCurent.oreRămase.toFixed(1)} ore rămase · {lotCurent.vanzariMediiZilnice} vânzări/zi</p>
        {adapted.warning && <p className="text-xs text-amber-300 mt-2">{adapted.warning}</p>}
        {lotCurent.oreRămase <= 0 && <p className="text-red-400 mt-2">Lot expirat — planul nu poate fi aplicat.</p>}
        {saveError && <p role="alert" className="text-red-400 mt-2">{saveError}</p>}
      </div>

      {/* SELECȚIE SCENARII STRATEGICE */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(scenarii) as TipScenariu[]).map((key) => {
          const sc = scenarii[key];
          const esteSelectat = scenariuSelectat === key;
          const esteRecomandatAI = key === cheieScenariuRecomandat;

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

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        
        {/* ZONA GRAFICULUI */}
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
                
                {/* AXA X NUMERICĂ CONTINUĂ FĂRĂ (-) */}
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

                {/* TOOLTIP FĂRĂ (-) */}
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} 
                  formatter={(val) => [`${val} RON`, 'Preț Unitar']} 
                  labelFormatter={(val) => `Timp Rămas: ${Math.abs(Number(val))} ore`}
                />
                
                {/* ZONELE COLORATE PE VALORI NUMERICE */}
                <ReferenceArea x1={-T} x2={-pB2C_hours} fill="#065f46" fillOpacity={0.25} />
                <ReferenceArea x1={-pB2C_hours} x2={-pB2B_hours} fill="#b45309" fillOpacity={0.25} />
                <ReferenceArea x1={-pB2B_hours} x2={-pDonatie_hours} fill="#1e3a8a" fillOpacity={0.25} />
                <ReferenceArea x1={-pDonatie_hours} x2={0} fill="#7f1d1d" fillOpacity={0.3} />

                {/* LINIA ÎN TREPTE STEP-AFTER */}
                <Line 
                  type="stepAfter" 
                  dataKey="price" 
                  stroke="#34D399" 
                  strokeWidth={3} 
                  dot={false} 
                />

                {/* PUNCTELE DE TRIGGER */}
                <ReferenceDot x={-pB2C_hours} y={pretFull} r={6} fill="#F59E0B" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={-pB2B_hours} y={pretB2C} r={6} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
                <ReferenceDot x={-pDonatie_hours} y={scenariuSelectat === 'SCENARIU_1_RAFT' || !lotCurent.capacitateB2B ? pretB2C : pretB2B} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>

            {/* ETICHETE FLOTANTE FĂRĂ (-) */}
            <div className="absolute top-6 left-[15%] bg-[#065f46]/90 text-emerald-200 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-500/40">
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

        {/* PANOUL LATERAL BILANȚ FINANCIAR & SCOR IES (MODIFICAT RECENT) */}
        <div className="bg-[#1F2937] rounded-2xl shadow-xl border border-gray-800 p-6 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white mb-3 pb-2 border-b border-gray-700 flex items-center justify-between">
              <span>Bilanț Financiar Lot</span>
              <span className="text-xs text-gray-400 font-normal">{lotCurent.cantitateTotala} {sourceLot.unit_of_measure}</span>
            </h3>

            {/* METRICI FINANCIARE BRUTE */}
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
                <span className="text-xs text-emerald-400 font-semibold">Profit Net Estimat:</span>
                <span className="text-lg font-extrabold text-emerald-400">
                  {scenariuCurent.profitNetEstimatRON} RON
                </span>
              </div>
            </div>

            {/* METRICI DE SUSTENABILITATE & MARJĂ (IES) */}
            <div className="space-y-2 text-xs text-gray-300 bg-[#182232] p-3 rounded-xl border border-gray-800">
              <div className="flex justify-between items-center">
                <span>Marjă Profit:</span>
                <strong className="text-emerald-400">
                  {scenariuCurent.marjaProfitProcent}%
                </strong>
              </div>

              {/* INDICELE IES (0 - 100 PTS) */}
              <div className="flex justify-between items-center border-t border-gray-800 pt-2 mt-2">
                <div className="flex items-center gap-1">
                  <span>Scor IES (Eficiență ESG):</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {scenariuCurent.scorSustenabilitatePct} / 100 pts
                </span>
              </div>

              {/* ESTIMARE RISIPĂ (DEȘEURI DIRECTE) */}
              <div className="flex justify-between items-center">
                <span>Risipă Estimat (Deșeuri):</span>
                <strong className={scenariuCurent.id === 'SCENARIU_1_RAFT' ? 'text-red-400' : 'text-emerald-400'}>
                  {scenariuCurent.rataRisipaEstimata}%
                </strong>
              </div>

              {/* PROCENT & CANTITATE DONAȚIE B2C / ONG */}
              <div className="flex justify-between items-center">
                <span>Redirecționat către Donații:</span>
                <strong className="text-blue-400">
                  {Math.round((scenariuCurent.cantitateDonata ?? 0) / lotCurent.cantitateTotala * 100)}% ({(scenariuCurent.cantitateDonata ?? 0).toFixed(1)} {sourceLot.unit_of_measure})
                </strong>
              </div>
            </div>
          </div>

          {/* ACȚIUNE EXECUȚIE DECIZIE */}
          <div className="space-y-3">
            <button onClick={handleAplicaPlan} disabled={saving || !!sourceLot.distribution_plan || lotCurent.oreRămase <= 0} className="w-full disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2">
              <ShieldCheck size={18} /> {saving ? 'Se salvează...' : succesAplicat || sourceLot.distribution_plan ? 'Plan salvat în Firestore' : `Aplică Planul ${scenariuCurent.titlu}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockAnalysis;
