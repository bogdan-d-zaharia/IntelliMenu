import React, { useState } from 'react';
import StockCategories from './StockCategories';
import StockAnalysis from './StockAnalysis';
import InventoryDashboard from './InventoryDashboard';
import Donations from './Donations';
import AiSimulation from './AiSimulation';
import OngAlerts from './OngAlerts';
import PartnerStores from './PartnerStores';
import ActiveOffers from './ActiveOffers';
import OngContracts from './OngContracts';
import {
  Store, Home, User, ChevronDown, Bell, History, Settings,
  BrainCircuit, HeartHandshake, MapPin, Check, FileText
} from 'lucide-react';

type AppView = 
  | 'dashboard' 
  | 'categories' 
  | 'analysis' 
  | 'inventory'
  | 'donations' 
  | 'ai-simulation' 
  | 'ong-alerts' 
  | 'partner-stores' 
  | 'ong-contracts'
  | 'active-offers';

type ProfileType = 'manager' | 'client';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-gray-200/60 text-gray-900 font-bold' : 'text-gray-600 hover:bg-gray-100 font-medium'}`}
  >
    <div className={`${isActive ? 'text-green-600' : 'text-gray-500'}`}>{icon}</div>
    <span>{label}</span>
  </div>
);

interface ProfileDropdownProps {
  profileType: ProfileType;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (isOpen: boolean) => void;
  onProfileChange: (type: ProfileType) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ profileType, isDropdownOpen, setIsDropdownOpen, onProfileChange }) => (
  <div className="relative">
    <div 
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
    >
      <div className="bg-gray-100 rounded-full p-1">
        <User size={16} className="text-gray-600"/>
      </div>
      <span className="text-sm font-bold text-gray-700 select-none">
        {profileType === 'manager' ? 'Manager Magazin' : 'ONG / Beneficiar'}
      </span>
      <ChevronDown size={16} className="text-gray-400" />
    </div>

    {isDropdownOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-50">
        <div 
          onClick={() => onProfileChange('manager')}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
        >
          <span className={`text-sm font-semibold ${profileType === 'manager' ? 'text-green-600' : 'text-gray-700'}`}>Manager Magazin</span>
          {profileType === 'manager' && <Check size={16} className="text-green-600" />}
        </div>
        <div 
          onClick={() => onProfileChange('client')}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors border-t border-gray-50"
        >
          <span className={`text-sm font-semibold ${profileType === 'client' ? 'text-green-600' : 'text-gray-700'}`}>ONG / Beneficiar</span>
          {profileType === 'client' && <Check size={16} className="text-green-600" />}
        </div>
      </div>
    )}
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('manager');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleProfileChange = (type: ProfileType) => {
    setProfileType(type);
    setIsDropdownOpen(false);
    setCurrentView('dashboard');
  };

  // Dervăm vizualizarea activă: Pentru manager, 'dashboard' deschide direct categoriile de produse!
  const effectiveView = (profileType === 'manager' && currentView === 'dashboard') ? 'categories' : currentView;

  if (effectiveView === 'analysis') {
    return (
      <div className="relative w-full min-h-screen">
        <div className="absolute top-6 right-6 z-50">
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </div>
        <StockAnalysis 
          lotId={selectedLotId}
          categoryName={selectedCategory} 
          onBack={() => setCurrentView('inventory')} 
          onNavigate={(view) => setCurrentView(view as AppView)}
        />
      </div>
    );
  }
  if (effectiveView === 'inventory') {
    return <InventoryDashboard categorieFilter={selectedCategory} onBack={() => setCurrentView('categories')} onSelectLot={lot => {
      setSelectedLotId(lot.id);
      setCurrentView('analysis');
    }} />;
  }
  // Adaugă și ruterul pentru pagina de oferte active a managerului:
  if (effectiveView === 'active-offers') {
    return <ActiveOffers onBack={() => setCurrentView('categories')} />;
  }

  if (effectiveView === 'categories') {
    return (
      <div className="relative w-full min-h-screen bg-[#111827]">
        <div className="absolute top-8 right-8 z-50">
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </div>
        <div className="px-8 pt-24 flex gap-4 text-white">
          <button onClick={() => setCurrentView('active-offers')} className="bg-emerald-700 px-4 py-2 rounded-xl">Oferte active</button>
          <button onClick={() => setCurrentView('ai-simulation')} className="bg-purple-700 px-4 py-2 rounded-xl">Simulare AI</button>
        </div>
        <StockCategories 
          onBack={() => setCurrentView('dashboard')} 
          onSelectCategory={(catName) => {
            setSelectedCategory(catName);
            setCurrentView('inventory');
          }} 
        />
      </div>
    );
  }

  if (effectiveView === 'donations') {
    return <Donations onBack={() => setCurrentView('dashboard')} />;
  }

  if (effectiveView === 'ai-simulation') {
    return <AiSimulation onBack={() => setCurrentView('dashboard')} />;
  }

  if (effectiveView === 'ong-alerts') {
    return (
      <div className="relative w-full min-h-screen bg-[#F9F7F5]">
        <div className="absolute top-8 right-8 z-50">
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </div>
        <div className="p-8 pt-20 max-w-6xl mx-auto">
          <OngAlerts onBack={() => setCurrentView('dashboard')} />
        </div>
      </div>
    );
  }

  if (effectiveView === 'partner-stores') {
    return (
      <div className="relative w-full min-h-screen bg-[#F9F7F5]">
        <div className="absolute top-8 right-8 z-50">
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </div>
        <PartnerStores onBack={() => setCurrentView('dashboard')} />
      </div>
    );
  }

  if (effectiveView === 'ong-contracts') {
    return (
      <div className="relative w-full min-h-screen bg-[#F9F7F5]">
        <div className="absolute top-8 right-8 z-50">
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </div>
        <OngContracts onBack={() => setCurrentView('dashboard')} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F7F5] font-sans text-gray-900">
      <aside className="w-64 flex flex-col border-r border-gray-200 bg-[#F9F7F5]">
        <div className="p-6 pb-2">
          <nav className="space-y-2">
            <SidebarItem 
              icon={<Home size={22} />} 
              label="Acasă" 
              isActive={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')} 
            />
            
            {profileType === 'client' && (
              <SidebarItem 
                icon={<Bell size={22} />} 
                label="Alertor AI" 
                isActive={(currentView as string) === 'ong-alerts'} 
                onClick={() => setCurrentView('ong-alerts')} 
              />
            )}

            {profileType === 'manager' && (
              <>
                <SidebarItem 
                  icon={<BrainCircuit size={22} />} 
                  label="Simulare AI" 
                  isActive={(currentView as string) === 'ai-simulation'} 
                  onClick={() => setCurrentView('ai-simulation')} 
                />
                <SidebarItem 
                  icon={<HeartHandshake size={22} />} 
                  label="Donații" 
                  isActive={(currentView as string) === 'donations'} 
                  onClick={() => setCurrentView('donations')} 
                />
                <SidebarItem icon={<History size={22} />} label="Istoric Tranzacții" />
                <SidebarItem icon={<Settings size={22} />} label="Setări" />
              </>
            )}
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-8 pb-6">
          <div className="flex items-center gap-3">
            <Store className="text-gray-400" size={32} />
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {profileType === 'manager' ? 'Dashboard Manager' : 'Portal Beneficiari / ONG'}
            </h1>
          </div>
          
          <ProfileDropdown profileType={profileType} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen} onProfileChange={handleProfileChange} />
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 min-h-full flex flex-col">
            
            {profileType === 'client' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
                <div onClick={() => setCurrentView('partner-stores')} className="bg-[#E68A2E] rounded-xl p-6 text-white shadow-md flex items-center gap-4 cursor-pointer hover:opacity-95 transition-all">
                  <div className="p-3 bg-white/20 rounded-xl"><MapPin size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Magazine Partenere</h3>
                    <p className="text-sm text-white/90">Vezi rețeaua de magazine din Iași</p>
                  </div>
                </div>

                <div onClick={() => setCurrentView('ong-contracts')} className="bg-[#2D3748] rounded-xl p-6 text-white shadow-md flex items-center gap-4 cursor-pointer hover:opacity-95 transition-all">
                  <div className="p-3 bg-white/20 rounded-xl"><FileText size={28} /></div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Contracte & Fiscalitate</h3>
                    <p className="text-sm text-white/90">Încarcă actele (CUI, Certificat) pentru generarea procesului-verbal.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
