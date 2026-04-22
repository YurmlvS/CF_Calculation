/**
 * Y撑复核验算模块 —— 入口文件
 * 实现 CalcModule 接口，将所有子文件聚合为一套完整的计算方案
 */
import { CalcModule } from '../types';
import { paramFields, defaultParams, calcTargets, defaultCalcTarget } from './params';
import { calculate } from './calculate';
import DiagramPanel from './DiagramPanel';
import ResultPanel from './ResultPanel';
import { exportToWord, exportToLaTeX, exportToPDF } from './exportUtils';

const yBraceModule: CalcModule = {
  info: {
    id: 'y_brace',
    label: 'Y撑的复核验算',
  },
  paramFields,
  defaultParams,
  calcTargets,
  defaultCalcTarget,
  calculate,
  DiagramPanel,
  ResultPanel,
  exportToWord,
  exportToLaTeX,
  exportToPDF,
};

export default yBraceModule;
