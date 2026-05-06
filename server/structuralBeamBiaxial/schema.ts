import {
  calcTargets,
  defaultCalcTarget,
  defaultParams,
  paramFields,
} from '../../src/modules/structural-beam-biaxial/params';

export const structuralBeamBiaxialParamFields = paramFields;
export const structuralBeamBiaxialDefaultParams = defaultParams;
export const structuralBeamBiaxialCalcTargets = calcTargets;
export const structuralBeamBiaxialDefaultCalcTarget = defaultCalcTarget;

export type StructuralBeamBiaxialCalcTarget =
  typeof structuralBeamBiaxialCalcTargets[number]['value'];
