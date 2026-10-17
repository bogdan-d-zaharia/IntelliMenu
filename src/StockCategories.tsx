import React from 'react';
import { ArrowLeft, Croissant, Milk, Apple, Beef } from 'lucide-react';

interface StockCategoriesProps {
  onBack: () => void;
  onSelectCategory: (categoryName: string) => void;
}

const categories = [
  { id: 'lactate', name: 'Lactate & Brânzeturi', desc: 'Ciclu mediu de viață, praguri pe zile', icon: <Milk size={28} />, color: 'bg-blue-500' },
  { id: 'mezeluri', name: 'Mezeluri & Carne', desc: 'Descreștere exponențială a prețului/calității', icon: <Beef size={28} />, color: 'bg-red-500' },
  { id: 'patiserie', name: 'Patiserie & Panificație', desc: 'Grafic cursiv, rezistență pe termen scurt', icon: <Croissant size={28} />, color: 'bg-amber-500' },
  { id: 'fructe', name: 'Fructe & Legume', desc: 'Rată rapidă de perisabilitate la final', icon: <Apple size={28} />, color: 'bg-emerald-500' },
];

const StockCategories: React.FC<StockCategoriesProps> = ({ onBack, onSelectCategory }) => {
  return (
    <div className="min-h-screen bg-[#111827] p-8 font-sans text-gray-100">
      
      {/* Buton Înapoi */}
      <button 
        onClick={onBack} 
        className="mb-6 text-blue-400 font-semibold hover:text-blue-300 flex items-center gap-2 transition-colors bg-[#1F2937] px-4 py-2 rounded-xl border border-gray-800 shadow-sm w-max"
      >
        <ArrowLeft size={20} /> Înapoi la Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-white mb-2">Selectează Categoria de Produse</h1>
        <p className="text-gray-400 mb-8">Alege o secțiune pentru a vizualiza curba de preț și stocurile critice bazate pe algoritmul AI.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => onSelectCategory(cat.name)}
              className="bg-[#1F2937] p-6 rounded-2xl shadow-md border border-gray-800 cursor-pointer hover:border-emerald-500 hover:shadow-xl transition-all flex items-center gap-5 group"
            >
              <div className={`p-4 rounded-xl text-white ${cat.color} group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">{cat.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockCategories;