import React, { useState, useMemo, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';

import { simuleazaScenariiFinanciare, calculeazaIntervaleAxaDinamice } from './lib/yieldEngine';

import { useFirestoreData } from './data/FirestoreProvider';
import { adaptLot, categoryLabels } from './lib/firestoreAdapter';
import { applyPlan } from './lib/firestoreActions';
import type { RezultatScenariu } from './types/yield.types';

interface StockAnalysisProps {
  lotId?: string;
  categoryName?: string;
  onBack: () => void;
  onNavigate?: (view: string) => void;
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({ lotId, categoryName, onBack, onNavigate }) => {

  const data = useFirestoreData();
  const matchingLots = data.inventory_lots.filter(lot => categoryLabels[lot.category] === categoryName);
  const sourceLot = lotId ? data.inventory_lots.find(lot => lot.id === lotId) : matchingLots[0];
  const adapted = useMemo(() => {
    if (!sourceLot) return { error: 'Nu există loturi în această categorie.' };
    try { return { result: adaptLot(sourceLot, data.stores.find(store => store.id === sourceLot.store_id), data.partners, data.claims, data.sales_history, data.now) }; }
    catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  }, [sourceLot, data]);
  if (!adapted.result || !sourceLot) return <div className="min-h-screen bg-gray-900 text-white p-8"><button onClick={onBack}>Înapoi</button><p role="alert">{adapted.error}</p></div>;
  return <AnalysisCharts key={sourceLot.id} {...{ sourceLot, adapted: adapted.result, onBack, onNavigate }} />;
};

type AnalysisChartsProps = {
  sourceLot: ReturnType<typeof useFirestoreData>['inventory_lots'][number];
  adapted: ReturnType<typeof adaptLot>;
  onBack: () => void;
  onNavigate?: (view: string) => void;
};

// Custom Tooltip Component pentru Recharts
interface ChartTooltipProps {
  active?: boolean;
  label?: React.ReactNode;
  unit: string;
  payload?: readonly { payload?: { faza?: string }; dataKey?: unknown; name?: string; color?: string; value?: unknown }[];
}
const CustomTooltip = ({ active, payload, label, unit }: ChartTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-sky-400 mb-1">{label}</p>
        <p className="text-amber-300 font-semibold mb-2">
          Etapă: <span className="text-white">{dataPoint?.faza}</span>
        </p>
        {payload.map((entry, index) => {
          if (entry.dataKey === 'b2bBanda') return null;
          return (
            <div key={`item-${index}`} className="flex justify-between space-x-4 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-white">
                {entry.dataKey === 'pret' || entry.dataKey === 'b2bBanda' || entry.dataKey === 'donatie' ? `${entry.value} RON/${unit}` : `${entry.value} ${unit}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// Helper pentru formatarea semnelor financiare
const formatMoney = (val: number): string => {
  if (val > 0) return `+${val} RON`;
  if (val < 0) return `${val} RON`;
  return `0 RON`;
};

const formatChartTime = (hours: number): string => {
  if (hours <= 0) return 'Data Expirării';
  const totalHours = Math.floor(hours);
  if (totalHours === 0) return 'Cu mai puțin de o oră înainte';
  const days = Math.floor(totalHours / 24);
  const restHours = totalHours % 24;
  const parts = [];
  if (days) parts.push(`${days} ${days === 1 ? 'zi' : 'zile'}`);
  if (restHours) parts.push(`${restHours} ${restHours === 1 ? 'oră' : 'ore'}`);
  return `Cu ${parts.join(' și ')} înainte`;
};

const AnalysisCharts = ({ sourceLot, adapted, onBack, onNavigate }: AnalysisChartsProps) => {
  const lotCurent = adapted.lot;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [progress, setProgress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const executing = useRef(false);
  const alreadyReserved = !!sourceLot.distribution_plan || sourceLot.status === 'reserved';
  const disabled = saving || saved || alreadyReserved || lotCurent.oreRămase <= 0;
  const execute = async (scenario: RezultatScenariu) => {
    if (executing.current || disabled) return;
    executing.current = true;
    setSaving(true);
    setErrorMessage(''); setSuccessMessage('');
    setProgress('Se pornește distribuția...');
    try {
      const result = await applyPlan(sourceLot, scenario, setProgress);
      setSaved(true);
      setSuccessMessage(`Plan executat: ${result.claimIds.length} rezervări salvate, ${Number(result.reservedQuantity.toFixed(3))} ${sourceLot.unit_of_measure} alocate. Lotul este rezervat.`);
    }
    catch (error) {
      console.error('Executarea planului a eșuat:', error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
    finally { executing.current = false; setSaving(false); }
  };
  const feedback = <div aria-live="polite" aria-atomic="true" className="mt-3 text-xs">
    {saving && <p role="status" className="flex items-center gap-2 text-sky-300"><LoaderCircle size={16} className="animate-spin shrink-0" />{progress}</p>}
    {errorMessage && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-red-300">{errorMessage}</p>}
    {successMessage && <p role="status" className="rounded-lg border border-emerald-500/40 p-3 text-emerald-300">{successMessage}</p>}
    {!saving && !successMessage && alreadyReserved && <p className="text-amber-300">Lotul are deja un plan rezervat; nu poate fi executat din nou.</p>}
    {!saving && !alreadyReserved && lotCurent.oreRămase <= 0 && <p className="text-red-300">Lotul a expirat; planul nu poate fi executat.</p>}
    {!saving && (saved || alreadyReserved) && onNavigate && <button onClick={() => onNavigate('active-offers')} className="mt-2 text-sky-400 underline">Vezi rezervările salvate →</button>}
  </div>;
  const [activeTab, setActiveTab] = useState<'suprapus' | 'secvential'>('suprapus');

  // Calculare dinamica prin motorul de simulare
  const rezultateScenarii = useMemo(() => {
    return simuleazaScenariiFinanciare(lotCurent, adapted.config);
  }, [lotCurent, adapted.config]);

  const praguriTemporale = useMemo(() => {
    return calculeazaIntervaleAxaDinamice(lotCurent, adapted.config);
  }, [lotCurent, adapted.config]);

  const unit = sourceLot.unit_of_measure;
  const disposalCost = (scenario: RezultatScenariu) => scenario.costDeseuriRON;
  // Every price and stock point comes from the engine's interval ledger.
  const buildChart = (scenario: RezultatScenariu) => {
    const hybrid = scenario.id === 'SCENARIU_3_HIBRID_AI';
    const hasBulk = (scenario.cantitateB2B ?? 0) > 0;
    const discountPct = Math.round((lotCurent.retailDiscountPct ?? 0.5) * 100);
    const phaseLabel = (channel: RezultatScenariu['intervale'][number]['canal']) => {
      switch (channel) {
        case 'full_price': return hybrid && hasBulk
          ? `Preț Plin + Listare B2B (${scenario.procentB2B}% din stoc)`
          : 'Preț Întreg (Recepție)';
        case 'discount': return hybrid && hasBulk
          ? 'Promo B2C + Rezervare Cantine'
          : `Promoție Raft B2C (-${discountPct}%)`;
        case 'social': return hybrid ? 'Ridicare Fizică Cantine' : `Licitare B2B Express (${praguriTemporale.pB2B}h rămas)`;
        case 'donation': return 'Predare Donație ESG';
        case 'waste': return scenario.cantitateRisipita > 0 ? 'Risipă Alimentară (Aruncat)' : 'Zero Risipă (Lot Lichidat Optim)';
      }
    };
    const rows = scenario.intervale.flatMap(entry => {
    const retail = entry.canal === 'full_price' || entry.canal === 'discount';
    const donationAtStart = scenario.intervale.some(row => row.canal === 'donation' && row.deLaOre === entry.deLaOre);
    const point = (hours: number, stock: number) => ({
      zi: formatChartTime(hours),
      pret: retail && !donationAtStart && entry.stocInitial > 0 ? entry.pretUnitarRON : null,
      stocKg: stock,
      b2bBanda: entry.canal === 'social' && entry.cantitate > 0 ? entry.pretUnitarRON : null,
      donatie: entry.canal === 'donation' && entry.cantitate > 0 ? 0 : null,
      faza: phaseLabel(entry.canal),
      phasePriority: entry.canal === 'waste' ? 3 : entry.cantitate > 0 ? entry.canal === 'donation' ? 2 : entry.canal === 'social' ? 1 : 0 : 0,
    });
    return retail ? [point(entry.deLaOre, entry.stocInitial), point(entry.panaLaOre, entry.stocFinal)] : [point(entry.deLaOre, entry.stocFinal)];
    });
    const points = new Map<string, typeof rows[number]>();
    for (const row of rows) {
      const prior = points.get(row.zi);
      const phase = prior && prior.phasePriority > row.phasePriority ? prior : row;
      points.set(row.zi, { ...row, faza: phase.faza, phasePriority: phase.phasePriority, pret: row.pret ?? (row.donatie === 0 ? 0 : prior?.pret ?? null), b2bBanda: row.b2bBanda ?? prior?.b2bBanda ?? null });
    }
    return [...points.values()];
  };
  const dataBaseline = buildChart(rezultateScenarii.SCENARIU_1_RAFT);
  const dataSecvential = buildChart(rezultateScenarii.SCENARIU_2_B2B_INTEGRAL);
  const dataSuprapus = buildChart(rezultateScenarii.SCENARIU_3_HIBRID_AI);
  // Scenarii calculate de algoritm
  const sPasiv = rezultateScenarii.SCENARIU_1_RAFT;
  const sSecvential = rezultateScenarii.SCENARIU_2_B2B_INTEGRAL;
  const sHibridAI = rezultateScenarii.SCENARIU_3_HIBRID_AI;

  return (
    <div className="p-6 bg-[#0B132B] text-white min-h-screen">
      
      {/* Top Bar: Button Back */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-sky-400 font-medium text-sm rounded-lg border border-slate-700/60 transition-all mb-4"
        >
          <span>←</span>
          <span>Înapoi la Dashboard</span>
        </button>

        <h1 className="text-2xl font-bold text-white">Analiză Stoc & Decizie DSS</h1>
        <p className="text-sm text-gray-400 mt-1">
          Analiză pentru lotul <strong>{lotCurent.nume}</strong> ({lotCurent.cantitateTotala} {unit})
        </p>
      </div>

      {/* SECTION 1: BASELINE ISTORIC */}
      <div className="bg-slate-900/90 border border-red-500/30 p-5 rounded-xl mb-8 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-md font-bold text-red-400">
              Baseline Istoric (Model Pasiv - Scenariul 1 Raft)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Simulare fără canal B2B. Rata de risipă estimată: <strong>{sPasiv.rataRisipaEstimata}%</strong>
            </p>
          </div>
        </div>

        <div className="w-full h-[200px] mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dataBaseline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" opacity={0.6} />
              <XAxis dataKey="zi" stroke="#94A3B8" fontSize={11} />
              <YAxis yAxisId="left" orientation="left" stroke="#EF4444" unit=" RON" domain={[0, lotCurent.pretUnitarRON + 2]} fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" unit={` ${unit}`} domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
              
              <Tooltip content={<CustomTooltip unit={unit} />} />
              <Legend verticalAlign="top" height={30} />

              <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="stocKg" name={`Stoc Rămas (${unit})`} stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Bilanț Financiar Baseline */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-gray-400 block">Venit Brut Estimat:</span>
            <span className="text-emerald-400 font-bold text-sm">+{sPasiv.venitBrutEstimatRON} RON</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">100% vânzare încercată la raft</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-gray-400 block">Cost Holding Total:</span>
            <span className="text-amber-400 font-bold text-sm">-{sPasiv.costHoldingTotalRON} RON</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">{adapted.config.costStocarePerKgZiRON} RON/{unit}/zi refrigerare</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-red-900/40">
            <span className="text-gray-400 block">Taxă/Penalizare Deșeu:</span>
            <span className="text-red-400 font-bold text-sm">-{disposalCost(sPasiv)} RON</span>
            <span className="text-[10px] text-red-400/80 block mt-0.5">{sourceLot.waste_disposal_cost_per_unit ?? 0} RON/{unit} distrugere</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-gray-400 block">Scor IES (ESG):</span>
            <span className="text-purple-400 font-bold text-sm">{sPasiv.scorSustenabilitatePct} Pct</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Evaluare ecologică pasivă</span>
          </div>
          <div className="bg-red-950/30 p-2.5 rounded-lg border border-red-500/40">
            <span className="text-red-300 font-medium block">Bilant:</span>
            <span className={`font-extrabold text-base ${sPasiv.profitNetEstimatRON >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(sPasiv.profitNetEstimatRON)}
            </span>
            <span className="text-[10px] text-red-300/70 block mt-0.5">Marjă: {sPasiv.marjaProfitProcent}%</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: COMPARATOR DINAMIC SCENARII SMART */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Opțiuni Strategice DSS</h3>
            <p className="text-xs text-gray-400 mt-1">
              Praguri temporale calculate: <strong>T1 B2C = {praguriTemporale.pB2C}h rămas</strong> | <strong>T2 B2B = {praguriTemporale.pB2B}h rămas</strong>
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('suprapus')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'suprapus'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Scenariul 3: Hibrid AI ({sHibridAI.procentB2B}% B2B / {sHibridAI.procentB2C}% B2C)
            </button>
            <button
              onClick={() => setActiveTab('secvential')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'secvential'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Scenariul 2: Lichidare Totală B2B
            </button>
          </div>
        </div>

        {/* TAB CONTENT: SCENARIUL 3 (HIBRID OPTIMIZAT AI) */}
        {activeTab === 'suprapus' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-md">
                    {sHibridAI.descriere}
                  </span>
                </div>

                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dataSuprapus} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="zi" stroke="#94A3B8" fontSize={11} />
                      <YAxis yAxisId="left" orientation="left" stroke="#10B981" unit=" RON" domain={[0, lotCurent.pretUnitarRON + 2]} fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" unit={` ${unit}`} domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
                      
                      <Tooltip content={<CustomTooltip unit={unit} />} />
                      <Legend verticalAlign="top" height={30} />

                      <Area yAxisId="left" type="monotone" dataKey="b2bBanda" name="Fereastră Activă Bursa B2B" fill="#10B981" fillOpacity={0.15} stroke="none" />
                      <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="stocKg" name={`Stoc Rămas (${unit})`} stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Card Right */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-400 mb-2">Garanție Algoritm Hibrid</h4>
                  <ul className="text-xs text-gray-300 space-y-2.5">
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">-</span>
                      <span><strong>Split Dinamic:</strong> Se direcționează {sHibridAI.procentB2B}% pe bursa B2B pentru absorbție completă.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">-</span>
                      <span><strong>Holding Eficientizat:</strong> Cost de stocare scăzut la -{sHibridAI.costHoldingTotalRON} RON.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">-</span>
                      <span><strong>Rată Risipă:</strong> Redusă la {sHibridAI.rataRisipaEstimata}%.</span>
                    </li>
                  </ul>
                </div>
                <button disabled={disabled} aria-busy={saving} onClick={() => execute(sHibridAI)} className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition-all">
                  {saving ? 'Se execută planul...' : saved || alreadyReserved ? 'Plan deja rezervat' : `Execută Planul Hibrid AI (${formatMoney(sHibridAI.profitNetEstimatRON)})`}
                </button>
                {feedback}
              </div>
            </div>

            {/* Bilanț Financiar Scenariul 3 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Venit Brut (B2C + B2B):</span>
                <span className="text-emerald-400 font-bold text-sm">+{sHibridAI.venitBrutEstimatRON} RON</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">{sHibridAI.procentB2C}% B2C / {sHibridAI.procentB2B}% B2B</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Cost Holding Redus:</span>
                <span className="text-amber-400 font-bold text-sm">-{sHibridAI.costHoldingTotalRON} RON</span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">Eliberare rapidă depozit</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Taxă Deșeuri Risipă:</span>
                <span className="text-emerald-400 font-bold text-sm">{disposalCost(sHibridAI)} RON</span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">{sHibridAI.cantitateRisipita === 0 ? 'Zero deșeu direct' : `${sHibridAI.cantitateRisipita.toFixed(2)} ${unit} deșeu estimat`}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Scor IES (ESG):</span>
                <span className="text-purple-400 font-bold text-sm">{sHibridAI.scorSustenabilitatePct} Pct</span>
                <span className="text-[10px] text-purple-300 block mt-0.5">Scor maxim de sustenabilitate</span>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40">
                <span className="text-emerald-300 font-medium block">Bilant:</span>
                <span className={`font-extrabold text-base ${sHibridAI.profitNetEstimatRON >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMoney(sHibridAI.profitNetEstimatRON)}
                </span>
                <span className="text-[10px] text-emerald-300/80 block mt-0.5">Marjă Netă: {sHibridAI.marjaProfitProcent}%</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: SCENARIUL 2 (LICHIDARE INTEGRALĂ B2B) */}
        {activeTab === 'secvential' && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-md">
                    {sSecvential.descriere}
                  </span>
                </div>

                <div className="w-full h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dataSecvential} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="zi" stroke="#94A3B8" fontSize={11} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" unit=" RON" domain={[0, lotCurent.pretUnitarRON + 2]} fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="#A855F7" unit={` ${unit}`} domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
                      
                      <Tooltip content={<CustomTooltip unit={unit} />} />
                      <Legend verticalAlign="top" height={30} />

                      <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="stocKg" name={`Stoc Rămas (${unit})`} stroke="#A855F7" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Card Right */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Note Scenariu 2 B2B Integral</h4>
                  <ul className="text-xs text-gray-300 space-y-2.5">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-400 font-bold">-</span>
                      <span><strong>Tăiere de Marjă:</strong> Lichidarea totală B2B garantează vânzarea, dar reduce marja comercială.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">-</span>
                      <span><strong>Holding Minim:</strong> Cost de depozitare scăzut la -{sSecvential.costHoldingTotalRON} RON.</span>
                    </li>
                  </ul>
                </div>
                <button disabled={disabled} aria-busy={saving} onClick={() => execute(sSecvential)} className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs transition-all">
                  {saving ? 'Se execută planul...' : saved || alreadyReserved ? 'Plan deja rezervat' : 'Execută Lichidarea B2B'}
                </button>
                {feedback}
              </div>
            </div>

            {/* Bilanț Financiar Scenariul 2 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Venit Brut (B2B Bulk):</span>
                <span className="text-emerald-400 font-bold text-sm">+{sSecvential.venitBrutEstimatRON} RON</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Preț mediu lichidare ({Math.round((lotCurent.pretB2BFractie ?? 0) * 100)}%)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Cost Holding (Stocare):</span>
                <span className="text-amber-400 font-bold text-sm">-{sSecvential.costHoldingTotalRON} RON</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Eliberare la T2 ({praguriTemporale.pB2B}h)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Taxă Deșeuri Risipă:</span>
                <span className="text-emerald-400 font-bold text-sm">{disposalCost(sSecvential)} RON</span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">{sSecvential.cantitateRisipita === 0 ? 'Zero deșeu generat' : `${sSecvential.cantitateRisipita.toFixed(2)} ${unit} deșeu estimat`}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Scor IES (ESG):</span>
                <span className="text-purple-400 font-bold text-sm">{sSecvential.scorSustenabilitatePct} Pct</span>
                <span className="text-[10px] text-purple-300 block mt-0.5">Sustenabilitate ridicată</span>
              </div>
              <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-500/40">
                <span className="text-blue-300 font-medium block">Bilant:</span>
                <span className={`font-extrabold text-base ${sSecvential.profitNetEstimatRON >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatMoney(sSecvential.profitNetEstimatRON)}
                </span>
                <span className="text-[10px] text-blue-300/80 block mt-0.5">Marjă Netă: {sSecvential.marjaProfitProcent}%</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StockAnalysis;
