/**
 * 直角三角形勾股定理计算模块 —— 入口文件
 */
import { CalcModule } from '../types';
import { paramFields, defaultParams, calcTargets, defaultCalcTarget } from './params';
import { calculate } from './calculate';
import DiagramPanel from './DiagramPanel';
import ResultPanel from './ResultPanel';
import { exportToWord, exportToPDF } from './exportUtils';

const triangleModule: CalcModule = {
  info: {
    id: 'triangle',
    label: '直角三角形勾股定理计算',
  },
  paramFields,
  defaultParams,
  calcTargets,
  defaultCalcTarget,
  calculate,
  DiagramPanel,
  ResultPanel,
  exportToWord,
  exportToPDF,
};

export default triangleModule;
