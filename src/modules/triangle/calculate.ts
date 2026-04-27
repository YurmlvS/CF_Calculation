/**
 * 直角三角形模块 —— 核心计算逻辑（勾股定理）
 */
import { ParamValue } from '../types';

export interface TriangleResult {
  /** 直角边 a */
  a: number;
  /** 直角边 b */
  b: number;
  /** 斜边 c = √(a² + b²) */
  c: number;
  /** 周长 P = a + b + c */
  perimeter: number;
  /** 面积 S = a × b / 2 */
  area: number;
  /** 角 A 的度数 (对边 a) */
  angleA_deg: number;
  /** 角 B 的度数 (对边 b) */
  angleB_deg: number;
}

/**
 * 计算函数
 */
export function calculate(
  params: Record<string, ParamValue>,
  _calcTarget: string,
): TriangleResult | null {
  const { a, b } = params;

  if (a === '' || b === '') {
    return null;
  }

  const numA = Number(a);
  const numB = Number(b);

  if (numA <= 0 || numB <= 0) {
    return null;
  }

  const c = Math.sqrt(numA * numA + numB * numB);
  const perimeter = numA + numB + c;
  const area = (numA * numB) / 2;
  const angleA_deg = (Math.atan(numA / numB) * 180) / Math.PI;
  const angleB_deg = 90 - angleA_deg;

  return { a: numA, b: numB, c, perimeter, area, angleA_deg, angleB_deg };
}
