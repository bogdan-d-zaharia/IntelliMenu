import React, { useState } from 'react';
import type { LotAlimentar } from './types/yield.types';
import { LOT_DEFAULT_CONFIG } from './data/categoryConfig';

import StockCategories from './StockCategories';
import StockAnalysis from './StockAnalysis';
import Donations from './Donations';
import AiSimulation from './AiSimulation';
import B2BOffers from './B2BOffers';
import InventoryDashboard from './InventoryDashboard';

import {
  Store, Home, Bell, History, Settings, User, ChevronDown,
  BarChart2, Package, BrainCircuit, LineChart, Handshake, Tag,
  HeartHandshake, Share2
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
      isActive ? 'bg-gray-200/60 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    <div className={`${isActive ? 'text-green-600' : 'text-gray-500'}`}>{icon}</div>
    <span>{label}</span>
  </div>
);

interface ActionCardProps {
  title: string;
  description: string;
  iconLeft: React.ReactNode;
  iconRight: React.ReactNode;
  bgColor: string;
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, iconLeft, iconRight, bgColor, onClick }) => (
  <div onClick={onClick} className={`${bgColor} rounded-xl p-6 text-white shadow-md flex items-center justify-between cursor-pointer hover:opacity-95 transition-all hover:shadow-lg`}>
    <div className="flex items-center gap-4">
      <div className="p-3 bg-white/20 rounded-xl">{iconLeft}</div>
      <div>
        <h3 className="text-xl font-bold mb-1 text-white">{title}</h3>
        <p className="text-sm text-white/90 leading-snug max-w-[220px]">{description}</p>
      </div>
    </div>
    <div className="opacity-90">{iconRight}</div>
  </div>
);

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'categories' | 'inventory-prioritized' | 'analysis' | 'donations' | 'ai-simulation' | 'b2b-offers'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLot, setSelectedLot] = useState<LotAlimentar | null>(null);

  // 1. Ecran Analiză Detaliată Lot
  if (currentView === 'analysis') {
    return (
      <StockAnalysis 
        lotCurent={selectedLot || LOT_DEFAULT_CONFIG} 
        onBack={() => setCurrentView('inventory-prioritized')} 
      />
    );
  }

  // 2. Ecran Loturi Filtrate pe Categoria Selectată
  if (currentView === 'inventory-prioritized') {
    return (
      <InventoryDashboard 
        categorieFilter={selectedCategory}
        onSelectLot={(lot) => {
          setSelectedLot(lot);
          setCurrentView('analysis');
        }}
        onBack={() => setCurrentView('categories')}
      />
    );
  }

  // 3. Ecran Selectare Categorii
  if (currentView === 'categories') {
    return (
      <StockCategories 
        onBack={() => setCurrentView('dashboard')} 
        onSelectCategory={(catName) => {
          setSelectedCategory(catName);
          setCurrentView('inventory-prioritized');
        }} 
      />
    );
  }

  // 4. Ecran Donații
  if (currentView === 'donations') {
    return <Donations onBack={() => setCurrentView('dashboard')} />;
  }

  // 5. Ecran Simulare AI
  if (currentView === 'ai-simulation') {
    return <AiSimulation onBack={() => setCurrentView('dashboard')} />;
  }

  // 6. Ecran Oferte B2B
  if (currentView === 'b2b-offers') {
    return <B2BOffers onBack={() => setCurrentView('dashboard')} />;
  }

  // 7. Dashboard Principal (Acasă cu cele 4 Chenare)
  return (
    <div className="flex h-screen bg-[#F9F7F5] font-sans text-gray-900">
      <aside className="w-64 flex flex-col border-r border-gray-200 bg-[#F9F7F5]">
        <div className="p-6 pb-2">
          <nav className="space-y-2">
            <SidebarItem icon={<Home size={22} />} label="Acasă" isActive onClick={() => setCurrentView('dashboard')} />
            <SidebarItem icon={<Bell size={22} />} label="Alertor AI" />
            <SidebarItem icon={<History size={22} />} label="Istoric Tranzacții" />
            <SidebarItem icon={<Settings size={22} />} label="Setări" />
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-8 pb-6">
          <div className="flex items-center gap-3">
            <Store className="text-gray-400" size={32} />
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Manager</h1>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
            <div className="bg-gray-100 rounded-full p-1"><User size={16} className="text-gray-600"/></div>
            <span className="text-sm font-medium text-gray-700">Manager</span>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 min-h-full flex flex-col">
            <div className="grid grid-cols-2 gap-5 mb-10">
              
              <ActionCard
                title="Analiza Stoc"
                description="Vizualizează stocurile și datele de expirare pe categorii"
                iconLeft={<BarChart2 size={28} strokeWidth={2} />}
                iconRight={<Package size={64} strokeWidth={1.5} className="opacity-80" />}
                bgColor="bg-[#3891A6]"
                onClick={() => setCurrentView('categories')} 
              />
              
              <ActionCard
                title="Simulare AI"
                description="Predicții inteligente pentru stocuri critice"
                iconLeft={<BrainCircuit size={28} strokeWidth={2} />}
                iconRight={<div className="bg-white/20 p-3 rounded-2xl"><LineChart size={32} strokeWidth={2}/></div>}
                bgColor="bg-[#6B46C1]"
                onClick={() => setCurrentView('ai-simulation')}
              />
              
              <ActionCard
                title="Oferte B2B"
                description="Gestionează loturile pentru preț social și parteneri"
                iconLeft={<Handshake size={28} strokeWidth={2} />}
                iconRight={<Tag size={64} strokeWidth={1.5} className="rotate-45 opacity-80" />}
                bgColor="bg-[#E68A2E]"
                onClick={() => setCurrentView('b2b-offers')}
              />
              
              <ActionCard
                title="Donații"
                description="Redirecționează produse către ONG-uri și cantine"
                iconLeft={<HeartHandshake size={28} strokeWidth={2} />}
                iconRight={<Share2 size={64} strokeWidth={1.5} className="opacity-80" />}
                bgColor="bg-[#7A9E55]"
                onClick={() => setCurrentView('donations')} 
              />

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;