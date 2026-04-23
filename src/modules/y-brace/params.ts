/**
 * Y撑模块 —— 参数定义、计算目标、默认值
 */
import { ParamFieldDef, CalcTargetOption } from '../types';

export const paramFields: ParamFieldDef[] = [
  { key: 'n', label: '支撑件上下固定点的垂直距离 n (mm)', placeholder: '例如: 4800' },
  { key: 'm', label: '支撑件上下固定点的水平距离 m (mm)', placeholder: '例如: 2144' },
  { key: 'mu', label: 'μ 计算长度系数', placeholder: '例如: 1' },
  { key: 'R', label: 'R 下撑杆件支座力 (kN)', placeholder: '例如: 25.151' },
  { key: 'A', label: 'A 下撑杆截面积 (cm²)', placeholder: '例如: 10.24' },
  { key: 'I', label: 'I 下撑杆弱轴方向截面惯性矩 (cm⁴)', placeholder: '例如: 16.6' },
  { key: 'IPrime', label: "I' 下撑杆强轴方向截面惯性矩 (cm⁴)", placeholder: '例如: 101' },
  { key: 'k', label: 'k 斜杆L₁与L₀的比值 取值范围0.1~0.9', placeholder: '例如: 0.5' },
  { key: 'f', label: 'f 材料抗压强度设计值 (N/mm²)', placeholder: '例如: 205' },
];

export const defaultParams: Record<string, number | ''> = {
  n: '', m: '', mu: '', R: '', A: '', I: '', IPrime: '', k: 0.5, f: '',
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'both', label: '强/弱轴方向验算' },
  { value: 'weak', label: '弱轴方向验算' },
  { value: 'strong', label: '强轴方向验算' },
];

export const defaultCalcTarget = 'both';
