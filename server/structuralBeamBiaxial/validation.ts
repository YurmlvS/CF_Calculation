import { z } from 'zod';
import {
  beamConcreteMaterials,
  rebarMaterials,
} from '../../src/modules/structural-beam-biaxial/materials';
import { getRebarArea, rebarCounts, rebarDiameters } from '../../src/modules/structural-beam-biaxial/rebarTable';
import {
  structuralBeamBiaxialDefaultCalcTarget,
  type StructuralBeamBiaxialCalcTarget,
} from './schema';

export type StructuralBeamBiaxialParams = {
  h: number;
  b: number;
  l: number;
  a: number;
  horizontalB: number;
  q: number;
  F: number;
  concreteGrade: string;
  fc: number;
  ft: number;
  steelGrade: string;
  fy: number;
  xRebarCount: number | 'custom' | '';
  xRebarDiameter: number | 'custom' | '';
  Aux: number;
  yRebarCount: number | 'custom' | '';
  yRebarDiameter: number | 'custom' | '';
  Auy: number;
};

export type StructuralBeamBiaxialRequest = {
  calcTarget: StructuralBeamBiaxialCalcTarget;
  params: StructuralBeamBiaxialParams;
  rawParams: Record<string, unknown>;
};

export type ValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; value: StructuralBeamBiaxialRequest }
  | { ok: false; issues: ValidationIssue[] };

const requestSchema = z.object({
  calcTarget: z.enum(['all', 'worst', 'rebar', 'shear']).default(structuralBeamBiaxialDefaultCalcTarget),
  params: z.record(z.string(), z.unknown()),
});

const concreteMaterialMap = new Map(beamConcreteMaterials.map((item) => [item.grade, item]));
const rebarMaterialMap = new Map(rebarMaterials.map((item) => [item.grade, item]));
const rebarCountSet = new Set<number>(rebarCounts);
const rebarDiameterSet = new Set<number>(rebarDiameters);

function readPositiveNumber(
  params: Record<string, unknown>,
  field: string,
  issues: ValidationIssue[],
): number | '' {
  const value = params[field];

  if (value === undefined || value === null || value === '') {
    issues.push({
      field: `params.${field}`,
      code: 'required',
      message: `${field} is required`,
    });
    return '';
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    issues.push({
      field: `params.${field}`,
      code: 'invalid_number',
      message: `${field} must be a valid number`,
    });
    return '';
  }

  if (numberValue <= 0) {
    issues.push({
      field: `params.${field}`,
      code: 'positive_number_required',
      message: `${field} must be greater than 0`,
    });
    return '';
  }

  return numberValue;
}

function readGrade(
  params: Record<string, unknown>,
  field: 'concreteGrade' | 'steelGrade',
  allowed: Set<string>,
  issues: ValidationIssue[],
): string {
  const value = params[field];

  if (value === undefined || value === null || value === '') {
    return 'custom';
  }

  const grade = String(value);
  if (grade === 'custom' || allowed.has(grade)) {
    return grade;
  }

  issues.push({
    field: `params.${field}`,
    code: 'invalid_option',
    message: `${field} must be one of the built-in grades or custom`,
  });
  return 'custom';
}

function readRebarChoice(
  params: Record<string, unknown>,
  field: 'xRebarCount' | 'xRebarDiameter' | 'yRebarCount' | 'yRebarDiameter',
  allowed: Set<number>,
  issues: ValidationIssue[],
): number | 'custom' | '' {
  const value = params[field];

  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (value === 'custom') {
    return 'custom';
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || !allowed.has(numberValue)) {
    issues.push({
      field: `params.${field}`,
      code: 'invalid_option',
      message: `${field} must be a valid rebar option or custom`,
    });
    return '';
  }

  return numberValue;
}

function resolveRebarArea(
  params: Record<string, unknown>,
  areaField: 'Aux' | 'Auy',
  count: number | 'custom' | '',
  diameter: number | 'custom' | '',
  issues: ValidationIssue[],
): number | '' {
  if (typeof count === 'number' && typeof diameter === 'number') {
    const area = getRebarArea(count, diameter);
    if (area !== '') return area;
  }

  return readPositiveNumber(params, areaField, issues);
}

export function validateStructuralBeamBiaxialRequest(body: unknown): ValidationResult {
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        code: issue.code,
        message: issue.path[0] === 'calcTarget'
          ? 'calcTarget must be one of all, worst, rebar, shear'
          : 'request body must include a params object',
      })),
    };
  }

  const { calcTarget, params } = parsed.data;
  const issues: ValidationIssue[] = [];
  const concreteGrade = readGrade(
    params,
    'concreteGrade',
    new Set(concreteMaterialMap.keys()),
    issues,
  );
  const steelGrade = readGrade(params, 'steelGrade', new Set(rebarMaterialMap.keys()), issues);
  const concreteMaterial = concreteGrade === 'custom' ? undefined : concreteMaterialMap.get(concreteGrade);
  const steelMaterial = steelGrade === 'custom' ? undefined : rebarMaterialMap.get(steelGrade);
  const xRebarCount = readRebarChoice(params, 'xRebarCount', rebarCountSet, issues);
  const xRebarDiameter = readRebarChoice(params, 'xRebarDiameter', rebarDiameterSet, issues);
  const yRebarCount = readRebarChoice(params, 'yRebarCount', rebarCountSet, issues);
  const yRebarDiameter = readRebarChoice(params, 'yRebarDiameter', rebarDiameterSet, issues);

  const normalized = {
    h: readPositiveNumber(params, 'h', issues),
    b: readPositiveNumber(params, 'b', issues),
    l: readPositiveNumber(params, 'l', issues),
    a: readPositiveNumber(params, 'a', issues),
    q: readPositiveNumber(params, 'q', issues),
    F: readPositiveNumber(params, 'F', issues),
    concreteGrade,
    fc: concreteMaterial?.fc ?? readPositiveNumber(params, 'fc', issues),
    ft: concreteMaterial?.ft ?? readPositiveNumber(params, 'ft', issues),
    steelGrade,
    fy: steelMaterial?.fy ?? readPositiveNumber(params, 'fy', issues),
    xRebarCount,
    xRebarDiameter,
    Aux: resolveRebarArea(params, 'Aux', xRebarCount, xRebarDiameter, issues),
    yRebarCount,
    yRebarDiameter,
    Auy: resolveRebarArea(params, 'Auy', yRebarCount, yRebarDiameter, issues),
  };

  if (normalized.h !== '' && normalized.h <= 40) {
    issues.push({
      field: 'params.h',
      code: 'out_of_range',
      message: 'h must be greater than 40',
    });
  }

  if (normalized.b !== '' && normalized.b <= 40) {
    issues.push({
      field: 'params.b',
      code: 'out_of_range',
      message: 'b must be greater than 40',
    });
  }

  if (
    normalized.l !== ''
    && normalized.a !== ''
    && normalized.a >= normalized.l
  ) {
    issues.push({
      field: 'params.a',
      code: 'out_of_range',
      message: 'a must be greater than 0 and less than l',
    });
  }

  const horizontalB = normalized.l !== '' && normalized.a !== ''
    ? Number((normalized.l - normalized.a).toFixed(6))
    : '';

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      calcTarget,
      params: { ...normalized, horizontalB } as StructuralBeamBiaxialParams,
      rawParams: params,
    },
  };
}
