import React, { useState, useMemo } from 'react';
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

import type { LotAlimentar } from './types/yield.types';
import { simuleazaScenariiFinanciare, calculeazaIntervaleAxaDinamice } from './lib/yieldEngine';
import { CONFIGURARI_CATEGORII, LOT_DEFAULT_CONFIG } from './data/categoryConfig';

interface StockAnalysisProps {
  onBack?: () => void;
  lotCurent?: LotAlimentar;
}

// Custom Tooltip Component pentru Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-sky-400 mb-1">{label}</p>
        <p className="text-amber-300 font-semibold mb-2">
          Etapă: <span className="text-white">{dataPoint.faza}</span>
        </p>
        {payload.map((entry: any, index: number) => {
          if (entry.dataKey === 'b2bBanda') return null;
          return (
            <div key={`item-${index}`} className="flex justify-between space-x-4 py-0.5">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold text-white">
                {entry.dataKey === 'pret' ? `${entry.value} RON/kg` : `${entry.value} kg`}
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

export const StockAnalysis: React.FC<StockAnalysisProps> = ({ 
  onBack, 
  lotCurent = LOT_DEFAULT_CONFIG 
}) => {
  const [activeTab, setActiveTab] = useState<'suprapus' | 'secvential'>('suprapus');

  // Calculare dinamica prin motorul de simulare
  const rezultateScenarii = useMemo(() => {
    return simuleazaScenariiFinanciare(lotCurent);
  }, [lotCurent]);

  const praguriTemporale = useMemo(() => {
    return calculeazaIntervaleAxaDinamice(lotCurent);
  }, [lotCurent]);

  const configCategorie = CONFIGURARI_CATEGORII[lotCurent.categorie];

  // Generare puncte grafic din datele de intrare
  const dataBaseline = useMemo(() => [
    { zi: 'Cu 7 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: lotCurent.cantitateTotala, faza: 'Preț Întreg (Recepție)' },
    { zi: 'Cu 5 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: Math.round(lotCurent.cantitateTotala * 0.7), faza: 'Vânzare la Raft (Preț Plin)' },
    { zi: 'Cu 3 zile înainte', pret: lotCurent.pretUnitarRON * 0.5, stocKg: Math.round(lotCurent.cantitateTotala * 0.35), faza: 'Promoție Raft B2C (-50%)' },
    { zi: 'Cu 1 zi înainte', pret: lotCurent.pretUnitarRON * 0.5, stocKg: Math.round(lotCurent.cantitateTotala * 0.25), faza: 'Stoc Blocat la Raft' },
    { zi: 'Data Expirării', pret: 0.0, stocKg: 0, faza: 'Risipă Alimentară (Aruncat)' },
  ], [lotCurent]);

  const dataSecvential = useMemo(() => {
    return [
      { zi: 'Cu 7 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: lotCurent.cantitateTotala, faza: 'Vânzare Raft (Preț Întreg)' },
      { zi: 'Cu 5 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: Math.round(lotCurent.cantitateTotala * 0.7), faza: 'Vânzare Raft (Preț Întreg)' },
      { zi: 'Cu 3 zile înainte', pret: lotCurent.pretUnitarRON * 0.5, stocKg: Math.round(lotCurent.cantitateTotala * 0.3), faza: 'Promoție B2C (-50%)' },
      { zi: 'Cu 2 zile înainte', pret: lotCurent.pretUnitarRON * 0.35, stocKg: Math.round(lotCurent.cantitateTotala * 0.1), faza: `Licitare B2B Express (${praguriTemporale.pB2B}h rămas)` },
      { zi: 'Data Expirării', pret: 0.0, stocKg: 0, faza: 'Predare Donație ESG' },
    ];
  }, [lotCurent, praguriTemporale]);

  const dataSuprapus = useMemo(() => {
    const s3 = rezultateScenarii.SCENARIU_3_HIBRID_AI;
    return [
      { zi: 'Cu 7 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: lotCurent.cantitateTotala, faza: 'Recepție & Preț Întreg', b2bBanda: 0 },
      { zi: 'Cu 5 zile înainte', pret: lotCurent.pretUnitarRON, stocKg: Math.round(lotCurent.cantitateTotala * 0.75), faza: `Preț Plin + Listare B2B (${s3.procentB2B}% din stoc)`, b2bBanda: lotCurent.pretUnitarRON * 0.4 },
      { zi: 'Cu 3 zile înainte', pret: lotCurent.pretUnitarRON * 0.5, stocKg: Math.round(lotCurent.cantitateTotala * 0.25), faza: 'Promo B2C + Rezervare Cantine', b2bBanda: lotCurent.pretUnitarRON * 0.4 },
      { zi: 'Cu 2 zile înainte', pret: lotCurent.pretUnitarRON * 0.4, stocKg: 0, faza: 'Ridicare Fizică Cantine', b2bBanda: lotCurent.pretUnitarRON * 0.4 },
      { zi: 'Data Expirării', pret: 0.0, stocKg: 0, faza: 'Zero Risipă (Lot Lichidat Optim)', b2bBanda: 0 },
    ];
  }, [lotCurent, rezultateScenarii]);

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
          Analiză pentru lotul <strong>{lotCurent.nume}</strong> ({lotCurent.cantitateTotala} kg)
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
              <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" unit=" kg" domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={30} />

              <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="stocKg" name="Stoc Rămas (kg)" stroke="#3B82F6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 5 }} />
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
            <span className="text-[10px] text-gray-500 block mt-0.5">{configCategorie.costStocarePerKgZiRON} RON/kg/zi refrigerare</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-red-900/40">
            <span className="text-gray-400 block">Taxă/Penalizare Deșeu:</span>
            <span className="text-red-400 font-bold text-sm">-{Math.round(sPasiv.rataRisipaEstimata * configCategorie.wasteDisposalCostPerKg)} RON</span>
            <span className="text-[10px] text-red-400/80 block mt-0.5">{configCategorie.wasteDisposalCostPerKg} RON/kg distrugere</span>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-gray-400 block">Scor IES (ESG):</span>
            <span className="text-purple-400 font-bold text-sm">{Math.abs(sPasiv.scorIES)} Pct</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Evaluare ecologică pasivă</span>
          </div>
          <div className="bg-red-950/30 p-2.5 rounded-lg border border-red-500/40">
            <span className="text-red-300 font-medium block">Profit Net Estimat:</span>
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
                      <YAxis yAxisId="right" orientation="right" stroke="#3B82F6" unit=" kg" domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
                      
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={30} />

                      <Area yAxisId="left" type="monotone" dataKey="b2bBanda" name="Fereastră Activă Bursa B2B" fill="#10B981" fillOpacity={0.15} stroke="none" />
                      <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="stocKg" name="Stoc Rămas (kg)" stroke="#3B82F6" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5 }} />
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
                <button className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-all">
                  Execută Planul Hibrid AI ({formatMoney(sHibridAI.profitNetEstimatRON)})
                </button>
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
                <span className="text-emerald-400 font-bold text-sm">0 RON</span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">Zero deșeu direct</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Scor IES (ESG):</span>
                <span className="text-purple-400 font-bold text-sm">{Math.abs(sHibridAI.scorIES)} Pct</span>
                <span className="text-[10px] text-purple-300 block mt-0.5">Scor maxim de sustenabilitate</span>
              </div>
              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/40">
                <span className="text-emerald-300 font-medium block">Profit Net Final:</span>
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
                      <YAxis yAxisId="right" orientation="right" stroke="#A855F7" unit=" kg" domain={[0, lotCurent.cantitateTotala + 30]} fontSize={11} />
                      
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={30} />

                      <Line yAxisId="left" type="stepAfter" dataKey="pret" name="Preț Unitar (RON)" stroke="#3B82F6" strokeWidth={3} dot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="stocKg" name="Stoc Rămas (kg)" stroke="#A855F7" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 5 }} />
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
                <button className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all">
                  Execută Lichidarea B2B
                </button>
              </div>
            </div>

            {/* Bilanț Financiar Scenariul 2 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Venit Brut (B2B Bulk):</span>
                <span className="text-emerald-400 font-bold text-sm">+{sSecvential.venitBrutEstimatRON} RON</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Preț mediu lichidare (35%)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Cost Holding (Stocare):</span>
                <span className="text-amber-400 font-bold text-sm">-{sSecvential.costHoldingTotalRON} RON</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Eliberare la T2 ({praguriTemporale.pB2B}h)</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Taxă Deșeuri Risipă:</span>
                <span className="text-emerald-400 font-bold text-sm">0 RON</span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">Zero deșeu generat</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-gray-400 block">Scor IES (ESG):</span>
                <span className="text-purple-400 font-bold text-sm">{Math.abs(sSecvential.scorIES)} Pct</span>
                <span className="text-[10px] text-purple-300 block mt-0.5">Sustenabilitate ridicată</span>
              </div>
              <div className="bg-blue-950/40 p-3 rounded-lg border border-blue-500/40">
                <span className="text-blue-300 font-medium block">Profit Net Final:</span>
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