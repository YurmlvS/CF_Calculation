/**
 * 直角三角形模块 —— 参数定义
 */
import { ParamFieldDef, CalcTargetOption } from '../types';

export const paramFields: ParamFieldDef[] = [
  { key: 'a', label: '直角边 a (mm)', placeholder: '例如: 300' },
  { key: 'b', label: '直角边 b (mm)', placeholder: '例如: 400' },
];

export const defaultParams: Record<string, number | ''> = {
  a: '',
  b: '',
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'all', label: '周长 + 面积' },
];

export const defaultCalcTarget = 'all';
