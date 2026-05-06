/**
 * 模块注册表
 * 新增计算方案时，只需在此文件导入并注册即可
 */
import { CalcModule } from './types';
import yBraceModule from './y-brace';
/*import triangleModule from './triangle';*/
import structuralBeamBiaxialModule from './structural-beam-biaxial';

/** 所有已注册的计算模块 */
export const modules: CalcModule[] = [
  yBraceModule,
  structuralBeamBiaxialModule,
  /*triangleModule,*/
];

/** 按 id 查找模块 */
export function getModuleById(id: string): CalcModule | undefined {
  return modules.find((m) => m.info.id === id);
}

/** 默认模块 */
export const defaultModuleId = modules[0].info.id;
