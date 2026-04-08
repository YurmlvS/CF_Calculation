/**
 * Y撑模块 —— 核心计算逻辑
 */
import { getPhi, buildPhiTable } from './phiUtils';

// 模块级单例 phiTable，避免每次调用都重建
const phiTable = buildPhiTable();

export interface YBraceResult {
  a_deg: string;
  sin_a: number;
  h0: number;
  Nx: number;
  i_val: number;
  lambda: number;
  phi: number;
  sigma: number;
  isSafe: boolean;
  f: number;
}

/**
 * 核心计算函数
 */
export function calculate(
  params: Record<string, number | ''>,
  calcTarget: string,
): YBraceResult | null {
  const { n, m, mu, R, I, A, f } = params;

  if (
    n === '' || m === '' || mu === '' || R === '' ||
    I === '' || A === '' || f === ''
  ) {
    return null;
  }

  const numN = Number(n);
  const numM = Number(m);

  const a_rad = Math.atan(numN / numM);
  const a_deg = (a_rad * 180 / Math.PI).toFixed(0);
  const sin_a = Math.sin(Number(a_deg) * Math.PI / 180);

  const i_val = Math.sqrt(Number(I) / Number(A));

  let h0 = 0;
  if (calcTarget === 'weak') {
    h0 = (Number(mu) * numN / sin_a) / 2;
  } else {
    h0 = Number(mu) * numN / sin_a;
  }

  const lambda = h0 / (i_val * 10);
  const Nx = Number(R) / sin_a;
  const phi = getPhi(lambda, phiTable);
  const sigma = (Nx * 10) / (phi * Number(A));
  const isSafe = sigma < Number(f);

  return { a_deg, sin_a, h0, Nx, i_val, lambda, phi, sigma, isSafe, f: Number(f) };
}
