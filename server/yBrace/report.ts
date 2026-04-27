import type { YBraceAxisResult, YBraceResult } from '../../src/modules/y-brace/calculate';
import type { YBraceCalcTarget } from './schema';
import type { YBraceParams } from './validation';

const LAMBDA_LIMIT = 200;

export type ReportSection = {
  title: string;
  lines: string[];
};

export type YBraceReport = {
  title: string;
  generatedAt: string;
  parameters: string[];
  sections: ReportSection[];
  conclusion: {
    isSafe: boolean;
    message: string;
  };
};

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function isAxisSafe(result: YBraceAxisResult): boolean {
  return result.lambda < LAMBDA_LIMIT && result.isSafe;
}

function axisTitle(axis: 'weak' | 'strong'): string {
  return axis === 'weak' ? '弱轴方向验算' : '强轴方向验算';
}

function buildParameterLines(params: YBraceParams): string[] {
  return [
    `支撑件上下固定点的垂直距离 n = ${params.n} mm`,
    `支撑件上下固定点的水平距离 m = ${params.m} mm`,
    `计算长度系数 μ = ${params.mu}`,
    `下撑杆支座力 R = ${params.R} kN`,
    `材料规格 = ${params.materialSpec === 'custom' ? '自定义' : params.materialSpec}`,
    `下撑杆截面积 A = ${params.A} cm²`,
    `下撑杆弱轴方向截面惯性矩 I = ${params.I === '' ? '-' : params.I} cm⁴`,
    `下撑杆强轴方向截面惯性矩 I' = ${params.IPrime === '' ? '-' : params.IPrime} cm⁴`,
    `斜杆 L₁ 与 L₀ 的比值 k = ${params.k}`,
    `材料抗压强度设计值 f = ${params.f} N/mm²`,
  ];
}

function buildAxisLines(axis: 'weak' | 'strong', result: YBraceAxisResult, params: YBraceParams): string[] {
  const inertia = axis === 'weak' ? params.I : params.IPrime;
  const h0Name = axis === 'weak' ? 'h0' : "h0'";
  const iName = axis === 'weak' ? 'i' : "i'";
  const lambdaMessage = result.lambda < LAMBDA_LIMIT
    ? `小于 ${LAMBDA_LIMIT}，满足构造要求`
    : `不小于 ${LAMBDA_LIMIT}，不满足构造要求`;
  const stressMessage = result.isSafe
    ? '小于 f，满足强度要求'
    : '不小于 f，不满足强度要求';

  return [
    `角度 a = arctan(n / m) = arctan(${params.n} / ${params.m}) = ${result.a_deg}°`,
    `${h0Name} = ${formatNumber(result.h0, axis === 'weak' ? 1 : 0)} mm`,
    `Nx = R / sin(a) = ${params.R} / sin(${result.a_deg}°) = ${formatNumber(result.Nx)} kN`,
    `${iName} = sqrt(I / A) = sqrt(${inertia} / ${params.A}) = ${formatNumber(result.i_val)} cm`,
    `λ = ${h0Name} / ${iName} = ${formatNumber(result.lambda)}，${lambdaMessage}`,
    `查稳定系数 φ = ${result.phi}`,
    `σ = Nx × 10 / (φ × A) = ${formatNumber(result.sigma)} N/mm²，${stressMessage}`,
    `${axisTitle(axis)}结论：${isAxisSafe(result) ? '通过' : '不通过'}`,
  ];
}

export function buildYBraceReport(
  calcTarget: YBraceCalcTarget,
  params: YBraceParams,
  result: YBraceResult,
): YBraceReport {
  const sections: ReportSection[] = [];
  const axisResults: YBraceAxisResult[] = [];

  if ((calcTarget === 'both' || calcTarget === 'weak') && result.weak) {
    sections.push({ title: axisTitle('weak'), lines: buildAxisLines('weak', result.weak, params) });
    axisResults.push(result.weak);
  }

  if ((calcTarget === 'both' || calcTarget === 'strong') && result.strong) {
    sections.push({ title: axisTitle('strong'), lines: buildAxisLines('strong', result.strong, params) });
    axisResults.push(result.strong);
  }

  const isSafe = axisResults.length > 0 && axisResults.every(isAxisSafe);

  return {
    title: 'Y撑复核验算书',
    generatedAt: new Date().toISOString(),
    parameters: buildParameterLines(params),
    sections,
    conclusion: {
      isSafe,
      message: isSafe ? '验算通过，满足要求。' : '验算不通过，不满足要求。',
    },
  };
}
