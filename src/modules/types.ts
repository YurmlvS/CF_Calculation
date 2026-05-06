/**
 * 计算模块通用接口定义
 * 每套计算方案都必须实现此接口，以便主 UI 动态加载
 */
import React from 'react';

/** 模块注册信息 */
export interface ModuleInfo {
  /** 模块唯一标识 */
  id: string;
  /** 显示名称 */
  label: string;
}

/** 计算参数字段描述 */
export type ParamValue = number | string | '';

export interface ParamOption {
  value: ParamValue;
  label: string;
  fill?: Record<string, ParamValue>;
}

export interface ParamFieldDef {
  key: string;
  label: string;
  placeholder: string;
  inputType?: 'number' | 'select';
  options?: ParamOption[];
  inlineWithNext?: {
    separator: string;
  };
  getPatchOnChange?: (
    value: ParamValue,
    params: Record<string, ParamValue>,
  ) => Record<string, ParamValue>;
  readOnlyWhen?: {
    key: string;
    notValue?: ParamValue;
    value?: ParamValue;
  };
}

/** 计算目标选项 */
export interface CalcTargetOption {
  value: string;
  label: string;
}

/** Konva 绘图区的 Props */
export interface ModuleDiagramProps {
  params: Record<string, ParamValue>;
  isKonvaLoaded: boolean;
}

/** 参数输入区额外内容的 Props（模块可在标准 Field 下方渲染自定义内容） */
export interface ModuleParamsExtraProps {
  params: Record<string, ParamValue>;
  calcTarget: string;
  onCalcTargetChange: (v: string) => void;
}

/** 结果报告区的 Props */
export interface ModuleResultProps {
  params: Record<string, ParamValue>;
  calcResult: any;
  calcTarget: string;
}

/**
 * 一套完整的计算模块定义
 */
export interface CalcModule {
  /** 模块信息 */
  info: ModuleInfo;

  /** 参数字段列表（供 ParamsPanel 动态渲染输入行） */
  paramFields: ParamFieldDef[];

  /** 参数初始值 */
  defaultParams: Record<string, ParamValue>;

  /** 计算目标选项列表 */
  calcTargets: CalcTargetOption[];

  /** 默认计算目标 */
  defaultCalcTarget: string;

  /** 核心计算函数 */
  calculate: (params: Record<string, ParamValue>, calcTarget: string) => any;

  /** Konva 绘图面板组件 */
  DiagramPanel: React.FC<ModuleDiagramProps>;

  /** 结果报告面板组件 */
  ResultPanel: React.FC<ModuleResultProps>;

  /** 导出 Word */
  exportToWord: (calcResult: any, params: Record<string, ParamValue>, calcTarget: string) => void | Promise<void>;

  /** 导出 LaTeX (基于HTML生成的Word) */
  exportToLaTeX?: (calcResult: any, params: Record<string, ParamValue>, calcTarget: string) => void | Promise<void>;

  /** 导出 PDF */
  exportToPDF: (calcResult: any) => Promise<void>;
}
