import React from 'react';
import type { LotAlimentar } from './types/yield.types';
import { getLoturiPrioritizate, calculeazaTimpRamas } from './data/categoryConfig';
import { calculeazaScorRiscS } from './lib/yieldEngine';

interface InventoryDashboardProps {
  categorieFilter?: string;
  onSelectLot: (lot: LotAlimentar) => void;
  onBack?: () => void;
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ 
  categorieFilter, 
  onSelectLot,
  onBack 
}) => {
  // Preluăm toate loturile prioritizate
  const toateLoturile = getLoturiPrioritizate();

  // Filtrăm loturile dacă s-a selectat o categorie specifică
  const loturiAfișate = categorieFilter
    ? toateLoturile.filter(lot => lot.categorie === categorieFilter)
    : toateLoturile;

  return (
    <div className="p-6 bg-[#0B132B] text-white min-h-screen">
      {/* Top Bar cu buton de Înapoi */}
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-sky-400 font-medium text-sm rounded-lg border border-slate-700/60 transition-all mb-4 cursor-pointer"
          >
            <span>←</span>
            <span>Înapoi la Categorii</span>
          </button>
        )}

        <h1 className="text-2xl font-bold text-white">Prioritizare Stoc - Categorii</h1>
        <p className="text-sm text-gray-400 mt-1">
          Afișare loturi pentru categoria: <strong className="text-sky-400">{(categorieFilter || 'Toate').toUpperCase()}</strong>
        </p>
      </div>

      {/* Grid de Loturi Filtrate și Sortate */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {loturiAfișate.map((lot) => {
          const scorRisc = calculeazaScorRiscS(lot);
          const timpInfo = calculeazaTimpRamas(lot.dataExpirare);

          let statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
          let statusText = 'Risc Scăzut';
          if (scorRisc > 65) {
            statusColor = 'bg-red-500/20 text-red-400 border-red-500/40';
            statusText = 'Risc Critic (Urgență)';
          } else if (scorRisc > 35) {
            statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            statusText = 'Risc Mediu';
          }

          return (
            <div
              key={lot.id}
              onClick={() => onSelectLot(lot)}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-5 rounded-xl cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs text-gray-400 font-mono">{lot.id}</span>
                    <h3 className="text-lg font-bold text-white">{lot.nume}</h3>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusColor}`}>
                    Risc: {scorRisc}/100 ({statusText})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-gray-400 block">Stoc Rămas:</span>
                    <strong className="text-white text-sm">{lot.cantitateTotala} kg</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Vânzări/Zi:</span>
                    <strong className="text-white text-sm">{lot.vanzariMediiZilnice} kg</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Timp Rămas:</span>
                    {/* Afișează dinamic textul formatat în Zile, Ore, Minute */}
                    <strong className="text-amber-400 text-sm">{timpInfo.textFormatat}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800 text-xs">
                <span className="text-gray-400">
                  Categorie: <strong className="text-sky-400">{lot.categorie.toUpperCase()}</strong>
                </span>
                <button className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-all">
                  Deschide Analiză DSS →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryDashboard;