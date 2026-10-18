import { useState } from 'react';
import StockAnalysis from './StockAnalysis';
import StockCategories from './StockCategories';

export default function AiSimulation({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState('');
  if (category) return <StockAnalysis categoryName={category} onBack={() => setCategory('')} />;
  return <div className="bg-gray-900 min-h-screen text-white"><button onClick={onBack} className="p-6">← Înapoi</button><p className="px-8 text-purple-300">Simularea compară cele trei scenarii folosind datele lotului din Firestore. Modificările sunt salvate doar când aplici un plan.</p><StockCategories onBack={onBack} onSelectCategory={setCategory} /></div>;
}
