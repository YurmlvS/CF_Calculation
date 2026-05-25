/**
 * Y撑模块 —— 参数定义、计算目标、默认值
 */
import { ParamFieldDef, CalcTargetOption } from '../types';
import { braceMaterialSpecs } from './materials';
import rValueTipImage from './tips_images/R_value.png';
import muValueTipImage from './tips_images/mu_value.png';

const materialOptions = [
  ...braceMaterialSpecs.map((item) => ({
    value: item.spec,
    label: item.spec,
    fill: { A: item.A, I: item.I, IPrime: item.IPrime },
  })),
  { value: 'custom', label: '自定义' },
];

export const paramFields: ParamFieldDef[] = [
  { key: 'n', label: '支撑件上下固定点的垂直距离 n (mm)', placeholder: '例如: 4800' },
  { key: 'm', label: '支撑件上下固定点的水平距离 m (mm)', placeholder: '例如: 2144' },
  {
    key: 'mu',
    label: 'μ 计算长度系数数值',
    placeholder: '例如: 1',
    tip: {
      imageSrc: muValueTipImage,
      imageAlt: 'μ 值取值方式',
      caption: 'μ 值取值方式',
    },
  },
  {
    key: 'R',
    label: 'R 下撑杆件支座力 (kN)',
    placeholder: '例如: 25.151',
    tip: {
      imageSrc: rValueTipImage,
      imageAlt: '下撑杆件支座力取值方式',
      caption: '主梁示意图\n提取自品茗型钢悬挑脚手架计算模块，主梁支座反力 R3',
    },
  },
  {
    key: 'materialSpec',
    label: '型材截面选择',
    placeholder: '请选择材料规格',
    inputType: 'select',
    options: materialOptions,
  },
  { key: 'A', label: 'A 下撑杆截面积 (cm²)', placeholder: '例如: 9.24', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'I', label: 'I 下撑杆弱轴方向截面惯性矩 (cm⁴)', placeholder: '例如: 16.6', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'IPrime', label: "I' 下撑杆强轴方向截面惯性矩 (cm⁴)", placeholder: '例如: 101', readOnlyWhen: { key: 'materialSpec', notValue: 'custom' } },
  { key: 'k', label: 'k 斜杆L₁与L₀的比值 取值范围0.1~0.9', placeholder: '例如: 0.5' },
  {
    key: 'f',
    label: '材料材质',
    placeholder: '请选择材料牌号',
    inputType: 'select',
    options: [
      { value: 205, label: 'Q235' },
      { value: 295, label: 'Q355' },
    ],
  },
];

export const defaultParams = {
  n: '', m: '', mu: '', R: '', materialSpec: 'custom', A: '', I: '', IPrime: '', k: 0.5, f: 205,
};

export const calcTargets: CalcTargetOption[] = [
  { value: 'both', label: '强/弱轴方向验算' },
  { value: 'weak', label: '弱轴方向验算' },
  { value: 'strong', label: '强轴方向验算' },
];

export const defaultCalcTarget = 'both';
