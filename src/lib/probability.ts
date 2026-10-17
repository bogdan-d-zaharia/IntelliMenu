import type { CategorieAlimentara } from '../types/yield.types';

export function calculeazaSansaVanzare(
  tScursOre: number,
  tTotalOre: number,
  pretCurent: number,
  pretInitial: number,
  categorie: CategorieAlimentara
): number {
  let elasticitatePret = 1.0;
  let coefDegradare = 1.0;

  if (categorie === 'carne_proaspata') {
    elasticitatePret = 2.2;
    coefDegradare = 1.8;
  } else if (categorie === 'lactate') {
    elasticitatePret = 1.5;
    coefDegradare = 1.2;
  } else if (categorie === 'conserve_uscate') {
    elasticitatePret = 0.8;
    coefDegradare = 0.5;
  }

  const raportPret = pretCurent / Math.max(1, pretInitial);
  const raportTimp = tScursOre / Math.max(1, tTotalOre);

  const z = 2.5 - (raportPret * elasticitatePret) - (raportTimp * coefDegradare);
  const probabilitate = 1 / (1 + Math.exp(-z));

  return Math.round(probabilitate * 100);
}