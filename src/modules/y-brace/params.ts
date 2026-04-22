/**
 * Y撑模块 —— 参数定义、计算目标、默认值
 */
import { ParamFieldDef, CalcTargetOption } from '../types';

export const paramFields: ParamFieldDef[] = [
  { key: 'n',      label: 'n (mm)',                placeholder: '例如: 4800' },
  { key: 'm',      label: 'm (mm)',                placeholder: '例如: 2144' },
  { key: 'mu',     label: 'μ (约束系数)',           placeholder: '例如: 1' },
  { key: 'R',      label: 'R (kN)',                placeholder: '例如: 25.151' },
  { key: 'A',      label: 'A (截面积 cm²)',         placeholder: '例如: 10.24' },
  { key: 'I',      label: 'I (弱轴惯性矩 cm⁴)',     placeholder: '例如: 16.6' },
  { key: 'IPrime', label: "I' (强轴惯性矩 cm⁴)",   placeholder: '例如: 16.6' },
  { key: 'k',      label: 'k (交点位置, 0.1~0.9)',  placeholder: '例如: 0.5' },
  { key: 'f',      label: 'f (抗压强度 N/mm²)',     placeholder: '例如: 205' },
];

export const defaultParams: Record<string, number | ''> = {
  n: '', m: '', mu: '', R: '', A: '', I: '', IPrime: '', k: 0.5, f: '',
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'both',   label: '强/弱轴方向验算' },
  { value: 'weak',   label: '弱轴方向验算' },
  { value: 'strong', label: '强轴方向验算' },
];

export const defaultCalcTarget = 'both';
