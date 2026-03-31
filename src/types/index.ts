// 定义公式与参数的接口，允许为空字符串（用户尚未输入时）
export interface CalcParams {
  n: number | '';
  m: number | '';
  mu: number | '';
  R: number | '';
  I: number | '';
  A: number | '';
  f: number | '';
}

export type CalcTarget = 'weak' | 'strong';

export interface CalcResult {
  a_deg: string;
  sin_a: number;
  h0: number;
  Nx: number;
  i_val: number;
  lambda: number;
  phi: number;
  sigma: number;
  isSafe: boolean;
  f: number;
}
