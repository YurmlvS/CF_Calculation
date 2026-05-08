import { ParamValue } from '../types';

const A1 = 1;
const XI_B = 0.518;
const REBAR_CLEAR_SPACING = 25;
const SIDE_ALLOWANCE = 20 + 8;

type Axis = 'x' | 'y';

export interface WorstSectionResult {
  effectiveSpanM: number;
  spanNote: string;
  verticalSupportMoment: number;
  verticalMidMoment: number;
  verticalShear: number;
  horizontalA: number;
  horizontalB: number;
  horizontalSupportMoment: number;
  horizontalMidMoment: number;
  horizontalShear: number;
  Mx: number;
  My: number;
  V: number;
  worstSection: 'support' | 'midspan';
}

export interface FlexuralAxisResult {
  axis: Axis;
  moment: number;
  sectionWidth: number;
  sectionHeight: number;
  h0: number;
  alphaS: number;
  xi: number;
  xiB: number;
  gammaS: number;
  requiredArea: number;
  providedArea: number;
  rebarCount: number | null;
  rebarDiameter: number | null;
  arrangementWidth: number | null;
  fitWidth: number;
  fits: boolean | null;
  rho: number;
  rhoMinFt: number;
  rhoMinBase: number;
  rhoOk: boolean;
  areaOk: boolean;
  compressionZoneOk: boolean;
  isSafe: boolean;
}

export interface ShearResult {
  limitCapacity: number;
  concreteCapacity: number;
  shear: number;
  limitOk: boolean;
  concreteOk: boolean;
  isSafe: boolean;
}

export interface StructuralBeamBiaxialResult {
  mode: string;
  input: {
    h: number;
    b: number;
    l: number;
    a: number;
    horizontalB: number;
    q: number;
    F: number;
    fc: number;
    ft: number;
    fy: number;
    Aux: number;
    Auy: number;
  };
  worst: WorstSectionResult;
  flexural: {
    x: FlexuralAxisResult;
    y: FlexuralAxisResult;
    isSafe: boolean;
  };
  shear: ShearResult;
  isSafe: boolean;
}

function toNumber(value: ParamValue): number {
  return Number(value);
}

function hasNumber(params: Record<string, ParamValue>, key: string): boolean {
  return params[key] !== '' && Number.isFinite(Number(params[key]));
}

function normalizeSpan(l: number): { effectiveSpanM: number; scale: number } {
  if (l > 100) {
    return {
      effectiveSpanM: l / 100,
      scale: 100,
    };
  }
  return {
    effectiveSpanM: l,
    scale: 1,
  };
}
/*function normalizeSpan(l: number): { effectiveSpanM: number; spanNote: string } {
  if (l > 100) {
    return {
      effectiveSpanM: l / 100,
      spanNote: '输入梁长大于 100，按案例口径换算为 l/100 m 参与弯矩、剪力计算。',
    };
  }
  return {
    effectiveSpanM: l,
    spanNote: '梁长按 m 直接参与弯矩、剪力计算。',
  };
}*/

function calcWorstSection(l: number, q: number, F: number, loadPositionA: number): WorstSectionResult {
  const { effectiveSpanM, scale } = normalizeSpan(l);
  const a = loadPositionA / scale;
  const spanB = effectiveSpanM - a;
  const verticalSupportMoment = -(q * effectiveSpanM ** 2) / 12;
  const verticalMidMoment = (q * effectiveSpanM ** 2) / 24;
  const verticalShear = (q * effectiveSpanM) / 2;
  const horizontalLeftSupportMoment = -(F * a * spanB ** 2) / effectiveSpanM ** 2;
  const horizontalRightSupportMoment = (F * spanB * a ** 2) / effectiveSpanM ** 2;
  const horizontalSupportMoment = Math.abs(horizontalLeftSupportMoment) >= Math.abs(horizontalRightSupportMoment)
    ? horizontalLeftSupportMoment
    : horizontalRightSupportMoment;
  const horizontalMidMoment = (F * a ** 2 * spanB ** 2) / effectiveSpanM ** 3;
  const horizontalLeftShear = (F * spanB ** 2 / effectiveSpanM ** 2) * (1 + (2 * a) / effectiveSpanM);
  const horizontalRightShear = -(F * a ** 2 / effectiveSpanM ** 2) * (1 + (2 * spanB) / effectiveSpanM);
  const horizontalShear = Math.abs(horizontalLeftShear) >= Math.abs(horizontalRightShear)
    ? horizontalLeftShear
    : horizontalRightShear;
  const Mx = Math.max(Math.abs(verticalSupportMoment), Math.abs(verticalMidMoment));
  const My = Math.max(Math.abs(horizontalSupportMoment), Math.abs(horizontalMidMoment));
  const V = Math.max(Math.abs(verticalShear), Math.abs(horizontalShear));
  const supportDemand = Math.abs(verticalSupportMoment) + Math.abs(horizontalSupportMoment);
  const midDemand = Math.abs(verticalMidMoment) + Math.abs(horizontalMidMoment);

  return {
    effectiveSpanM,
    spanNote: '',
    verticalSupportMoment,
    verticalMidMoment,
    verticalShear,
    horizontalA: a,
    horizontalB: spanB,
    horizontalSupportMoment,
    horizontalMidMoment,
    horizontalShear,
    Mx,
    My,
    V,
    worstSection: supportDemand >= midDemand ? 'support' : 'midspan',
  };
}

function calcArrangementWidth(count: number | null, diameter: number | null): number | null {
  if (!count || !diameter) return null;
  return count * diameter + Math.max(0, count - 1) * REBAR_CLEAR_SPACING + 2 * SIDE_ALLOWANCE;
}

function calcFlexuralAxis(
  axis: Axis,
  moment: number,
  sectionWidth: number,
  sectionHeight: number,
  fc: number,
  ft: number,
  fy: number,
  providedArea: number,
  rebarCount: number | null,
  rebarDiameter: number | null,
): FlexuralAxisResult {
  const h0 = sectionHeight - 40;
  const momentNmm = moment * 1_000_000;
  const alphaS = momentNmm / (A1 * fc * sectionWidth * h0 ** 2);
  const root = 1 - 2 * alphaS;
  const compressionZoneOk = root >= 0;
  const sqrtRoot = Math.sqrt(Math.max(0, root));
  const xi = 1 - sqrtRoot;
  const gammaS = 0.5 * (1 + sqrtRoot);
  const requiredArea = compressionZoneOk ? momentNmm / (fy * gammaS * h0) : Number.POSITIVE_INFINITY;
  const arrangementWidth = calcArrangementWidth(rebarCount, rebarDiameter);
  const fits = arrangementWidth === null ? null : arrangementWidth < sectionWidth;
  const rho = providedArea / (sectionWidth * h0);
  const rhoMinFt = 0.45 * (ft / fy) * (sectionHeight / h0);
  const rhoMinBase = 0.002 * (sectionHeight / h0);
  const rhoOk = rho > rhoMinFt && rho > rhoMinBase;
  const areaOk = providedArea >= requiredArea;
  const isSafe = compressionZoneOk && xi < XI_B && areaOk && rhoOk && fits !== false;

  return {
    axis,
    moment,
    sectionWidth,
    sectionHeight,
    h0,
    alphaS,
    xi,
    xiB: XI_B,
    gammaS,
    requiredArea,
    providedArea,
    rebarCount,
    rebarDiameter,
    arrangementWidth,
    fitWidth: sectionWidth,
    fits,
    rho,
    rhoMinFt,
    rhoMinBase,
    rhoOk,
    areaOk,
    compressionZoneOk,
    isSafe,
  };
}

function calcShear(worst: WorstSectionResult, b: number, h: number, fc: number, ft: number): ShearResult {
  const h0 = h - 40;
  const limitCapacity = 0.25 * fc * b * h0 / 1000;
  const concreteCapacity = 0.7 * ft * b * h0 / 1000;
  const shear = worst.V;
  const limitOk = limitCapacity > shear;
  const concreteOk = concreteCapacity > shear;

  return {
    limitCapacity,
    concreteCapacity,
    shear,
    limitOk,
    concreteOk,
    isSafe: limitOk && concreteOk,
  };
}

function readRebarChoice(params: Record<string, ParamValue>, axis: Axis): { count: number | null; diameter: number | null } {
  const count = params[`${axis}RebarCount`];
  const diameter = params[`${axis}RebarDiameter`];

  return {
    count: count === 'custom' || count === '' ? null : Number(count),
    diameter: diameter === 'custom' || diameter === '' ? null : Number(diameter),
  };
}

export function calculate(
  params: Record<string, ParamValue>,
  calcTarget: string,
): StructuralBeamBiaxialResult | null {
  const required = ['h', 'b', 'l', 'a', 'q', 'F', 'fc', 'ft', 'fy', 'Aux', 'Auy'];
  if (!required.every((key) => hasNumber(params, key))) return null;

  const h = toNumber(params.h);
  const b = toNumber(params.b);
  const l = toNumber(params.l);
  const a = toNumber(params.a);
  const q = toNumber(params.q);
  const F = toNumber(params.F);
  const fc = toNumber(params.fc);
  const ft = toNumber(params.ft);
  const fy = toNumber(params.fy);
  const Aux = toNumber(params.Aux);
  const Auy = toNumber(params.Auy);

  if ([h, b, l, a, q, F, fc, ft, fy, Aux, Auy].some((value) => value <= 0)) return null;
  if (h <= 40 || b <= 40) return null;
  if (a >= l) return null;

  const { scale } = normalizeSpan(l);
  const horizontalB = (l - a) / scale;
  const worst = calcWorstSection(l, q, F, a);
  const xChoice = readRebarChoice(params, 'x');
  const yChoice = readRebarChoice(params, 'y');
  const x = calcFlexuralAxis('x', worst.Mx, b, h, fc, ft, fy, Aux, xChoice.count, xChoice.diameter);
  const y = calcFlexuralAxis('y', worst.My, h, b, fc, ft, fy, Auy, yChoice.count, yChoice.diameter);
  const shear = calcShear(worst, b, h, fc, ft);
  const flexuralSafe = x.isSafe && y.isSafe;

  return {
    mode: calcTarget,
    input: { h, b, l, a: a / scale, horizontalB, q, F, fc, ft, fy, Aux, Auy },
    worst,
    flexural: { x, y, isSafe: flexuralSafe },
    shear,
    isSafe: flexuralSafe && shear.isSafe,
  };
}
