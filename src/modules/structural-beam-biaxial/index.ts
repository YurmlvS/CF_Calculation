import { CalcModule } from '../types';
import { paramFields, defaultParams, calcTargets, defaultCalcTarget } from './params';
import { calculate } from './calculate';
import DiagramPanel from './DiagramPanel';
import ResultPanel from './ResultPanel';
import { exportToWord, exportToLaTeX, exportToPDF } from './exportUtils';

const structuralBeamBiaxialModule: CalcModule = {
  info: {
    id: 'structural_beam_biaxial',
    label: '结构梁双向受力验算',
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

export default structuralBeamBiaxialModule;

