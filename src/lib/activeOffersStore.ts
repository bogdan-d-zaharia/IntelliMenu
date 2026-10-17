export interface OfertaActiva {
  id: string;
  magazin: string;
  categorie: string;
  produs: string;
  cantitate: string;
  tipPlan: string;
  status: 'DISPONIBIL_PIATA' | 'REVENDICAT_ONG' | 'FINALIZAT';
  ongPartener?: string;
  codPreluare?: string;
  dataAdaugare: string;
}

let oferteGlobale: OfertaActiva[] = [
  {
    id: 'OFF-101',
    magazin: 'Kaufland Iași - Tudor Vladimirescu',
    categorie: 'Lactate & Brânzeturi',
    produs: 'Iaurt Natur (Bax 24)',
    cantitate: '50 buc',
    tipPlan: 'Plan Hibrid Optimizat AI',
    status: 'DISPONIBIL_PIATA',
    dataAdaugare: 'Astăzi, 10:30'
  }
];

export function adaugaOfertaNoua(oferta: Omit<OfertaActiva, 'id' | 'status' | 'dataAdaugare'>) {
  const nouaOferta: OfertaActiva = {
    ...oferta,
    id: `OFF-${Math.floor(100 + Math.random() * 900)}`,
    status: 'DISPONIBIL_PIATA',
    dataAdaugare: 'Acum câteva momente'
  };
  oferteGlobale = [nouaOferta, ...oferteGlobale];
  return nouaOferta;
}

export function obtineOferteActive(): OfertaActiva[] {
  return oferteGlobale;
}