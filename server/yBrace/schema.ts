import { braceMaterialSpecs } from '../../src/modules/y-brace/materials';

const materialOptions = [
  ...braceMaterialSpecs.map((item) => ({
    value: item.spec,
    label: item.spec,
    fill: { A: item.A, I: item.I, IPrime: item.IPrime },
  })),
  { value: 'custom', label: '自定义' },
];

export const yBraceParamFields = [
  { key: 'n', label: '支撑件上下固定点的垂直距离 n (mm)', placeholder: '例如: 4800' },
  { key: 'm', label: '支撑件上下固定点的水平距离 m (mm)', placeholder: '例如: 2144' },
  { key: 'mu', label: 'μ 计算长度系数', placeholder: '例如: 1' },
  { key: 'R', label: 'R 下撑杆件支座力 (kN)', placeholder: '例如: 25.151' },
  {
    key: 'materialSpec',
    label: '材料规格选择',
    placeholder: '请选择材料规格',
    inputType: 'select',
    options: materialOptions,
  },
  { key: 'A', label: 'A 下撑杆截面积 (cm²)', placeholder: '例如: 9.24', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'I', label: 'I 下撑杆弱轴方向截面惯性矩 (cm⁴)', placeholder: '例如: 16.6', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'IPrime', label: "I' 下撑杆强轴方向截面惯性矩 (cm⁴)", placeholder: '例如: 101', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'k', label: 'k 斜杆 L₁ 与 L₀ 的比值，取值范围 0.1~0.9', placeholder: '例如: 0.5' },
  {
    key: 'f',
    label: 'f 材料抗压强度设计值 (N/mm²)',
    placeholder: '请选择材料牌号',
    inputType: 'select',
    options: [
      { value: 205, label: 'Q235' },
      { value: 295, label: 'Q355' },
    ],
  },
] as const;

export const yBraceDefaultParams = {
  n: '',
  m: '',
  mu: '',
  R: '',
  materialSpec: 'custom',
  A: '',
  I: '',
  IPrime: '',
  k: 0.5,
  f: 205,
} as const;

export const yBraceCalcTargets = [
  { value: 'both', label: '强、弱轴方向验算' },
  { value: 'weak', label: '弱轴方向验算' },
  { value: 'strong', label: '强轴方向验算' },
] as const;

export const yBraceDefaultCalcTarget = 'both';

export type YBraceCalcTarget = typeof yBraceCalcTargets[number]['value'];
