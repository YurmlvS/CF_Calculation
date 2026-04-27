import { z } from 'zod';
import { yBraceDefaultCalcTarget, type YBraceCalcTarget } from './schema';
import { braceMaterialSpecs } from '../../src/modules/y-brace/materials';

export type YBraceParams = {
  n: number;
  m: number;
  mu: number;
  R: number;
  materialSpec: string;
  A: number;
  I: number | '';
  IPrime: number | '';
  k: number;
  f: number;
};

export type YBraceRequest = {
  calcTarget: YBraceCalcTarget;
  params: YBraceParams;
  rawParams: Record<string, unknown>;
};

export type ValidationIssue = {
  field: string;
  code: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; value: YBraceRequest }
  | { ok: false; issues: ValidationIssue[] };

const requestSchema = z.object({
  calcTarget: z.enum(['both', 'weak', 'strong']).default(yBraceDefaultCalcTarget),
  params: z.record(z.string(), z.unknown()),
});

const baseRequiredFields = ['n', 'm', 'mu', 'R', 'A', 'f'] as const;
const materialSpecMap = new Map(braceMaterialSpecs.map((item) => [item.spec, item]));
const allowedFValues = new Set([205, 295]);

function requiredMomentFields(calcTarget: YBraceCalcTarget): Array<'I' | 'IPrime'> {
  if (calcTarget === 'weak') return ['I'];
  if (calcTarget === 'strong') return ['IPrime'];
  return ['I', 'IPrime'];
}

function readPositiveNumber(
  params: Record<string, unknown>,
  field: string,
  required: boolean,
  issues: ValidationIssue[],
): number | '' {
  const value = params[field];

  if (value === undefined || value === null || value === '') {
    if (required) {
      issues.push({
        field: `params.${field}`,
        code: 'required',
        message: `${field} 为必填参数`,
      });
    }
    return '';
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    issues.push({
      field: `params.${field}`,
      code: 'invalid_number',
      message: `${field} 必须是有效数字`,
    });
    return '';
  }

  if (numberValue <= 0) {
    issues.push({
      field: `params.${field}`,
      code: 'positive_number_required',
      message: `${field} 必须大于 0`,
    });
    return '';
  }

  return numberValue;
}

function readK(params: Record<string, unknown>, issues: ValidationIssue[]): number {
  const value = params.k;

  if (value === undefined || value === null || value === '') {
    return 0.5;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    issues.push({
      field: 'params.k',
      code: 'invalid_number',
      message: 'k 必须是有效数字',
    });
    return 0.5;
  }

  if (numberValue < 0.1 || numberValue > 0.9) {
    issues.push({
      field: 'params.k',
      code: 'out_of_range',
      message: 'k 必须在 0.1 到 0.9 之间',
    });
  }

  return numberValue;
}

function readMaterialSpec(params: Record<string, unknown>, issues: ValidationIssue[]): string {
  const value = params.materialSpec;

  if (value === undefined || value === null || value === '') {
    return 'custom';
  }

  const spec = String(value);
  if (spec === 'custom' || materialSpecMap.has(spec)) {
    return spec;
  }

  issues.push({
    field: 'params.materialSpec',
    code: 'invalid_option',
    message: 'materialSpec 必须是材料库中的规格或 custom',
  });
  return 'custom';
}

function readMaterialStrength(params: Record<string, unknown>, issues: ValidationIssue[]): number | '' {
  if (params.f === 'Q235') return 205;
  if (params.f === 'Q355') return 295;

  const value = readPositiveNumber(params, 'f', baseRequiredFields.includes('f'), issues);
  if (value === '') return value;

  if (!allowedFValues.has(value)) {
    issues.push({
      field: 'params.f',
      code: 'invalid_option',
      message: 'f 只允许 Q235=205 或 Q355=295',
    });
  }

  return value;
}

export function validateYBraceRequest(body: unknown): ValidationResult {
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        code: issue.code,
        message: issue.path[0] === 'calcTarget'
          ? 'calcTarget 只允许 both、weak、strong'
          : '请求体必须包含 params 对象',
      })),
    };
  }

  const { calcTarget, params } = parsed.data;
  const issues: ValidationIssue[] = [];
  const momentFields = requiredMomentFields(calcTarget);
  const materialSpec = readMaterialSpec(params, issues);
  const selectedMaterial = materialSpec === 'custom' ? undefined : materialSpecMap.get(materialSpec);

  const normalized = {
    n: readPositiveNumber(params, 'n', baseRequiredFields.includes('n'), issues),
    m: readPositiveNumber(params, 'm', baseRequiredFields.includes('m'), issues),
    mu: readPositiveNumber(params, 'mu', baseRequiredFields.includes('mu'), issues),
    R: readPositiveNumber(params, 'R', baseRequiredFields.includes('R'), issues),
    materialSpec,
    A: selectedMaterial?.A ?? readPositiveNumber(params, 'A', baseRequiredFields.includes('A'), issues),
    I: selectedMaterial?.I ?? readPositiveNumber(params, 'I', momentFields.includes('I'), issues),
    IPrime: selectedMaterial?.IPrime ?? readPositiveNumber(params, 'IPrime', momentFields.includes('IPrime'), issues),
    k: readK(params, issues),
    f: readMaterialStrength(params, issues),
  };

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      calcTarget,
      params: normalized as YBraceParams,
      rawParams: params,
    },
  };
}
