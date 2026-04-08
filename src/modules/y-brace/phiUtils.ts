/**
 * Y撑模块 —— φ 查表工具
 */
import { PHI_CSV_STRING } from './phiTable';

/** 解析 phi CSV 字符串，构建二维查表字典 */
export function buildPhiTable(): Record<number, Record<number, number>> {
  const table: Record<number, Record<number, number>> = {};
  const lines = PHI_CSV_STRING.trim().split('\n');
  lines.forEach((line) => {
    const parts = line.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length >= 11 && !isNaN(parts[0])) {
      const rowKey = parts[0];
      table[rowKey] = {};
      for (let i = 1; i <= 10; i++) {
        table[rowKey][i - 1] = parts[i];
      }
    }
  });
  return table;
}

/**
 * 根据长细比 λ 查表获取稳定系数 φ
 */
export function getPhi(
  lambda: number,
  phiTable: Record<number, Record<number, number>>,
): number {
  const target = Math.ceil(lambda);
  const row = Math.floor(target / 10) * 10;
  const col = target % 10;

  if (phiTable[row] && phiTable[row][col] !== undefined) {
    return phiTable[row][col];
  }
  return Math.max(0.1, 1 - lambda / 250);
}
