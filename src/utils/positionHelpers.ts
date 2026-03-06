import { AccountPosition } from "../types";

/**
 * Calcula el PNL (Profit and Loss) de una posición
 */
export function calculatePnl(position: AccountPosition): number {
  return parseFloat(position.unRealisedPnlRv || "0");
}

/**
 * Calcula el porcentaje de PNL basado en el valor de la posición
 */
export function calculatePnlPercent(position: AccountPosition): number {
  const pnl = calculatePnl(position);
  const entry = parseFloat(position.avgEntryPriceRp || "0");
  const size = parseFloat(position.sizeRq || "0");
  const leverage = Number(position.leverageRr);

  if (entry <= 0 || size <= 0 || leverage === 0) {
    return 0;
  }

  return (pnl / (entry * size)) * 100 * leverage;
}

/**
 * Calcula el PNL total de un array de posiciones
 */
export function calculateTotalPnl(positions: AccountPosition[]): number {
  return positions
    .filter((pos) => pos.symbol && pos.sizeRq && pos.side !== "None")
    .reduce((acc, pos) => acc + calculatePnl(pos), 0);
}

/**
 * Calcula el porcentaje de diferencia entre mark price y entry price
 */
export function calculateMarkDiffPercent(markPrice: number, entryPrice: number): number {
  if (entryPrice <= 0) {
    return 0;
  }
  return ((markPrice - entryPrice) / entryPrice) * 100;
}

/**
 * Genera el label de leverage para mostrar
 */
export function getLeverageLabel(position: AccountPosition): string {
  return position.crossMargin ? "Cross" : `Isolated ${Math.abs(Number(position.leverageRr))}x`;
}

/**
 * Determina si una posición es Long
 */
export function isLongPosition(position: AccountPosition): boolean {
  return position.side === "Buy";
}

/**
 * Formatea un número a 4 decimales
 */
export function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value || "0") : value;
  return num.toFixed(4);
}

/**
 * Filtra posiciones activas (válidas para mostrar)
 */
export function filterActivePositions(positions: AccountPosition[]): AccountPosition[] {
  return positions.filter((pos) => pos.symbol && pos.sizeRq && pos.side !== "None");
}
