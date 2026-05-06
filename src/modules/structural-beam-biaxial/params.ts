import { CalcTargetOption, ParamFieldDef, ParamValue } from '../types';
import { beamConcreteMaterials, rebarMaterials } from './materials';
import { getRebarArea, rebarCounts, rebarDiameters } from './rebarTable';

const customOption = { value: 'custom', label: '自定义' };

const concreteOptions = [
  ...beamConcreteMaterials.map((item) => ({
    value: item.grade,
    label: item.grade,
    fill: { fc: item.fc, ft: item.ft },
  })),
  customOption,
];

const steelOptions = [
  ...rebarMaterials.map((item) => ({
    value: item.grade,
    label: item.grade,
    fill: { fy: item.fy },
  })),
  customOption,
];

const countOptions = [
  ...rebarCounts.map((count) => ({ value: count, label: String(count) })),
  customOption,
];

const diameterOptions = [
  ...rebarDiameters.map((diameter) => ({ value: diameter, label: String(diameter) })),
  customOption,
];

function buildRebarPatch(
  axis: 'x' | 'y',
  key: 'count' | 'diameter',
  value: ParamValue,
  params: Record<string, ParamValue>,
): Record<string, ParamValue> {
  const countKey = `${axis}RebarCount`;
  const diameterKey = `${axis}RebarDiameter`;
  const areaKey = axis === 'x' ? 'Aux' : 'Auy';

  if (value === 'custom') {
    return {
      [key === 'count' ? diameterKey : countKey]: 'custom',
      [areaKey]: '',
    };
  }

  const count = key === 'count' ? value : params[countKey];
  const diameter = key === 'diameter' ? value : params[diameterKey];

  if (count === 'custom' || diameter === 'custom' || count === '' || diameter === '') {
    return { [areaKey]: '' };
  }

  return { [areaKey]: getRebarArea(count, diameter) };
}

export const paramFields: ParamFieldDef[] = [
  { key: 'h', label: '梁高 h (mm)', placeholder: '例如: 500' },
  { key: 'b', label: '梁宽 b (mm)', placeholder: '例如: 250' },
  { key: 'l', label: '梁长 l (m)', placeholder: '例如: 10' },
  { key: 'q', label: '竖向均布荷载 q (kN/m)', placeholder: '例如: 20' },
  { key: 'F', label: '水平集中力 F (kN)', placeholder: '例如: 50' },
  {
    key: 'concreteGrade',
    label: '梁材料选择',
    placeholder: '请选择梁材料',
    inputType: 'select',
    options: concreteOptions,
  },
  {
    key: 'fc',
    label: '轴心抗压强度 f_c (N/mm²)',
    placeholder: '例如: 14.3',
    readOnlyWhen: { key: 'concreteGrade', notValue: 'custom' },
  },
  {
    key: 'ft',
    label: '混凝土的抗拉强度标准值 f_t (N/mm²)',
    placeholder: '例如: 1.43',
    readOnlyWhen: { key: 'concreteGrade', notValue: 'custom' },
  },
  {
    key: 'steelGrade',
    label: '钢筋材料选择',
    placeholder: '请选择钢筋材料',
    inputType: 'select',
    options: steelOptions,
  },
  {
    key: 'fy',
    label: '钢筋强度设计值 f_y (N/mm²)',
    placeholder: '例如: 360',
    readOnlyWhen: { key: 'steelGrade', notValue: 'custom' },
  },
  {
    key: 'xRebarCount',
    label: 'X轴验算钢筋选择',
    placeholder: '请选择根数',
    inputType: 'select',
    options: countOptions,
    inlineWithNext: { separator: 'Φ' },
    getPatchOnChange: (value, params) => buildRebarPatch('x', 'count', value, params),
  },
  {
    key: 'xRebarDiameter',
    label: 'X轴验算钢筋直径',
    placeholder: '请选择直径',
    inputType: 'select',
    options: diameterOptions,
    getPatchOnChange: (value, params) => buildRebarPatch('x', 'diameter', value, params),
  },
  {
    key: 'Aux',
    label: 'X轴不同根数钢筋的计算截面面积 A_ux (mm²)',
    placeholder: '例如: 1256',
    readOnlyWhen: { key: 'xRebarCount', notValue: 'custom' },
  },
  {
    key: 'yRebarCount',
    label: 'Y轴验算钢筋选择',
    placeholder: '请选择根数',
    inputType: 'select',
    options: countOptions,
    inlineWithNext: { separator: 'Φ' },
    getPatchOnChange: (value, params) => buildRebarPatch('y', 'count', value, params),
  },
  {
    key: 'yRebarDiameter',
    label: 'Y轴验算钢筋直径',
    placeholder: '请选择直径',
    inputType: 'select',
    options: diameterOptions,
    getPatchOnChange: (value, params) => buildRebarPatch('y', 'diameter', value, params),
  },
  {
    key: 'Auy',
    label: 'Y轴不同根数钢筋的计算截面面积 A_uy (mm²)',
    placeholder: '例如: 1017',
    readOnlyWhen: { key: 'yRebarCount', notValue: 'custom' },
  },
];

export const defaultParams: Record<string, ParamValue> = {
  h: '',
  b: '',
  l: '',
  q: '',
  F: '',
  concreteGrade: 'custom',
  fc: '',
  ft: '',
  steelGrade: 'custom',
  fy: '',
  xRebarCount: 'custom',
  xRebarDiameter: 'custom',
  Aux: '',
  yRebarCount: 'custom',
  yRebarDiameter: 'custom',
  Auy: '',
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'all', label: '全部计算（最不利点判定、纵向受拉钢筋的截面面积计算、斜截面受剪验算）' },
  { value: 'worst', label: '最不利点判定' },
  { value: 'rebar', label: '纵向受拉钢筋的截面面积计算' },
  { value: 'shear', label: '斜截面受剪验算' },
];

export const defaultCalcTarget = 'all';

