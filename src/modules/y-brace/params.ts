/**
 * Y撑模块 —— 参数定义、计算目标、默认值
 */
import { ParamFieldDef, CalcTargetOption } from '../types';

export const paramFields: ParamFieldDef[] = [
  { key: 'n',  label: 'n (mm)',             placeholder: '例如: 4800' },
  { key: 'm',  label: 'm (mm)',             placeholder: '例如: 2144' },
  { key: 'mu', label: 'μ (约束系数)',        placeholder: '例如: 1' },
  { key: 'R',  label: 'R (kN)',             placeholder: '例如: 25.151' },
  { key: 'I',  label: 'I (惯性矩 cm⁴)',     placeholder: '例如: 16.6' },
  { key: 'A',  label: 'A (截面积 cm²)',      placeholder: '例如: 10.24' },
  { key: 'f',  label: 'f (抗压强度 N/mm²)',  placeholder: '例如: 205' },
];

export const defaultParams: Record<string, number | ''> = {
  n: '', m: '', mu: '', R: '', I: '', A: '', f: '',
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'weak',   label: '弱轴方向演算' },
  { value: 'strong', label: '强轴方向演算' },
];

export const defaultCalcTarget = 'weak';
