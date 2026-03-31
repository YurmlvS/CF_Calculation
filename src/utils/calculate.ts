import { CalcParams, CalcResult, CalcTarget } from '../types';
import { getPhi } from './phiUtils';

/**
 * 核心计算逻辑：根据参数和计算目标计算结构验算结果
 * @returns CalcResult 或 null（参数不完整时）
 */
export function calculate(
  params: CalcParams,
  calcTarget: CalcTarget,
  phiTable: Record<number, Record<number, number>>,
): CalcResult | null {
  const { n, m, mu, R, I, A, f } = params;

  // 任意参数为空则不计算
  if (
    n === '' || m === '' || mu === '' || R === '' ||
    I === '' || A === '' || f === ''
  ) {
    return null;
  }

  const numN = Number(n);
  const numM = Number(m);

  // a = arctan(n/m)
  const a_rad = Math.atan(numN / numM);
  const a_deg = (a_rad * 180 / Math.PI).toFixed(0);
  const sin_a = Math.sin(Number(a_deg) * Math.PI / 180);

  // 回转半径 i (单位: cm)
  const i_val = Math.sqrt(Number(I) / Number(A));

  let h0 = 0;
  if (calcTarget === 'weak') {
    h0 = (Number(mu) * numN / sin_a) / 2;
  } else {
    h0 = Number(mu) * numN / sin_a;
  }

  // λ = h0 / (i × 10)，i 单位 cm → mm 需乘以 10
  const lambda = h0 / (i_val * 10);

  // 轴力 Nx（kN）
  const Nx = Number(R) / sin_a;

  const phi = getPhi(lambda, phiTable);

  // σ = Nx × 10 / (φ × A)
  // Nx: kN → N (×1000)，A: cm² → mm² (×100) → 整体乘 10
  const sigma = (Nx * 10) / (phi * Number(A));
  const isSafe = sigma < Number(f);

  return { a_deg, sin_a, h0, Nx, i_val, lambda, phi, sigma, isSafe, f: Number(f) };
}
