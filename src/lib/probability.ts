import type { CategorieAlimentara } from '../types/yield.types';

export function calculeazaSansaVanzare(
  tScursOre: number,
  tTotalOre: number,
  pretCurent: number,
  pretInitial: number,
  categorie: CategorieAlimentara
): number {
  let elasticitatePret = 2.0;

  if (categorie === 'Carne & Mezeluri') elasticitatePret = 2.5;
  else if (categorie === 'Lactate & Brânzeturi') elasticitatePret = 1.8;
  else if (categorie === 'Conserve & Produse Uscate') elasticitatePret = 1.0;

  const discountProcent = 1 - (pretCurent / Math.max(1, pretInitial));
  const raportTimpScurs = tScursOre / Math.max(1, tTotalOre);

  const z = -1.0 + (discountProcent * elasticitatePret * 3.0) - (raportTimpScurs * 0.5);
  const probabilitate = 1 / (1 + Math.exp(-z));

  return Math.round(probabilitate * 100);
}