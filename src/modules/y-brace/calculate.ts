/**
 * Y撑模块 —— 核心计算逻辑
 */
import { getPhi, buildPhiTable } from './phiUtils';

// 模块级单例 phiTable，避免每次调用都重建
const phiTable = buildPhiTable();

/** 单轴方向计算结果 */
export interface YBraceAxisResult {
  axis: 'weak' | 'strong';
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

/** 完整计算结果（兼容单轴及双轴）*/
export interface YBraceResult {
  mode: 'weak' | 'strong' | 'both';
  weak?: YBraceAxisResult;
  strong?: YBraceAxisResult;
  // 向后兼容：单轴模式下直接展开字段
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
 * 计算单轴结果
 */
function calcAxis(
  axis: 'weak' | 'strong',
  numN: number,
  numM: number,
  numMu: number,
  numR: number,
  numI: number,
  numA: number,
  numF: number,
  numK: number,
): YBraceAxisResult {
  const a_rad = Math.atan(numN / numM);
  const a_deg = (a_rad * 180 / Math.PI).toFixed(0);
  const sin_a = Math.sin(Number(a_deg) * Math.PI / 180);

  const i_val = Math.sqrt(numI / numA);

  let h0: number;
  if (axis === 'weak') {
    const full = numMu * numN / sin_a;
    h0 = Math.max(full * numK, full * (1 - numK));
  } else {
    h0 = numMu * numN / sin_a;
  }

  const lambda = h0 / (i_val * 10);
  const Nx = numR / sin_a;
  const phi = getPhi(lambda, phiTable);
  const sigma = (Nx * 10) / (phi * numA);
  const isSafe = sigma < numF;

  return { axis, a_deg, sin_a, h0, Nx, i_val, lambda, phi, sigma, isSafe, f: numF };
}

/**
 * 核心计算函数
 */
export function calculate(
  params: Record<string, number | ''>,
  calcTarget: string,
): YBraceResult | null {
  const { n, m, mu, R, I, IPrime, A, f, k } = params;

  // Basic required params
  if (n === '' || m === '' || mu === '' || R === '' || A === '' || f === '') return null;

  const numN = Number(n);
  const numM = Number(m);
  const numMu = Number(mu);
  const numR = Number(R);
  const numA = Number(A);
  const numF = Number(f);
  const numK = k === '' ? 0.5 : Math.min(0.9, Math.max(0.1, Number(k)));

  if (calcTarget === 'both') {
    if (I === '' || IPrime === '') return null;
    const weak = calcAxis('weak', numN, numM, numMu, numR, Number(I), numA, numF, numK);
    const strong = calcAxis('strong', numN, numM, numMu, numR, Number(IPrime), numA, numF, numK);
    // isSafe for "both" = both pass
    const isSafe = weak.isSafe && strong.isSafe;
    return {
      mode: 'both', weak, strong,
      // Expose primary (weak) axis fields for backward compat
      a_deg: weak.a_deg, sin_a: weak.sin_a, h0: weak.h0,
      Nx: weak.Nx, i_val: weak.i_val, lambda: weak.lambda,
      phi: weak.phi, sigma: weak.sigma, isSafe, f: numF,
    };
  }

  if (calcTarget === 'weak') {
    if (I === '') return null;
    const r = calcAxis('weak', numN, numM, numMu, numR, Number(I), numA, numF, numK);
    return { mode: 'weak', weak: r, ...r };
  }

  // strong
  if (IPrime === '') return null;
  const r = calcAxis('strong', numN, numM, numMu, numR, Number(IPrime), numA, numF, numK);
  return { mode: 'strong', strong: r, ...r };
}
