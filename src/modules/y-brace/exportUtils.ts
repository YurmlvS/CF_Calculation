import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Math as DocxMath,
  MathFraction,
  MathFunction,
  MathRadical,
  MathRoundBrackets,
  MathRun,
  MathSquareBrackets,
  MathSubScript,
  Packer,
  Paragraph,
  TextRun,
  type MathComponent,
} from 'docx';
import { saveAs } from 'file-saver';
import { YBraceAxisResult, YBraceResult } from './calculate';

const FONT_SIZES = {
  TITLE: 44,
  HEADING_2: 24,
  NORMAL: 24,
  FORMULA: 24,
};

const FONTS = {
  CHINESE: 'Times New Roman',
  ENGLISH: 'Times New Roman',
  HEADING: '黑体',
  MATH: 'Cambria Math',
};

type CalcParams = Record<string, number | ''>;
type Axis = 'weak' | 'strong';
type MathPart = string | MathComponent | readonly MathComponent[];

const LAMBDA_LIMIT = 200;

function formatExportTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

function isLambdaSafe(r: YBraceAxisResult): boolean {
  return r.lambda < LAMBDA_LIMIT;
}

function isAxisCheckSafe(r: YBraceAxisResult): boolean {
  return isLambdaSafe(r) && r.isSafe;
}

function getLambdaRequirementText(r: YBraceAxisResult): string {
  return isLambdaSafe(r)
    ? `< ${LAMBDA_LIMIT}（满足构造要求）`
    : `≥ ${LAMBDA_LIMIT}（构造要求不满足）`;
}

function paraText(text: string, bold = false, size = FONT_SIZES.NORMAL): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size,
        font: {
          ascii: FONTS.ENGLISH,
          eastAsia: FONTS.CHINESE,
          hint: 'eastAsia',
        },
      }),
    ],
    spacing: { after: 120 },
  });
}

function paraFormula(formula: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: formula,
        size: FONT_SIZES.FORMULA,
        font: FONTS.MATH,
        italics: false,
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 120 },
  });
}

function paraDocxMath(children: readonly MathComponent[]): Paragraph {
  return new Paragraph({
    children: [new DocxMath({ children })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
  });
}

function mathRun(text: string): MathComponent {
  return new MathRun(text);
}

function mathSeq(...parts: readonly MathPart[]): MathComponent[] {
  const children: MathComponent[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      if (part) children.push(mathRun(part));
      continue;
    }

    if (Array.isArray(part)) {
      children.push(...(part as readonly MathComponent[]));
      continue;
    }

    children.push(part as MathComponent);
  }

  return children;
}

function mathSub(base: string, subScript: string): MathComponent {
  return new MathSubScript({
    children: [mathRun(base)],
    subScript: [mathRun(subScript)],
  });
}

function mathFrac(
  numerator: readonly MathComponent[],
  denominator: readonly MathComponent[],
): MathComponent {
  return new MathFraction({ numerator, denominator });
}

function mathFunc(name: string, children: readonly MathComponent[]): MathComponent {
  return new MathFunction({
    name: [mathRun(name)],
    children,
  });
}

function mathParen(children: readonly MathComponent[]): MathComponent {
  return new MathRoundBrackets({ children });
}

function mathSquare(children: readonly MathComponent[]): MathComponent {
  return new MathSquareBrackets({ children });
}

function mathSqrt(children: readonly MathComponent[]): MathComponent {
  return new MathRadical({ children });
}

function createDoc(children: Paragraph[]): Document {
  return new Document({
    styles: {
      default: {
        document: {
          run: {
            size: FONT_SIZES.NORMAL,
            font: {
              ascii: FONTS.ENGLISH,
              eastAsia: FONTS.CHINESE,
            },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: FONT_SIZES.TITLE,
            bold: true,
            font: FONTS.HEADING,
          },
          paragraph: {
            spacing: { before: 240, after: 240 },
          },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: {
            size: FONT_SIZES.HEADING_2,
            bold: false,
            font: FONTS.HEADING,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      ],
    },
    sections: [{ children }],
  });
}

async function getKonvaImageBytes(): Promise<Uint8Array | null> {
  try {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return null;

    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  } catch {
    return null;
  }
}

function getParamLines(params: CalcParams): string[] {
  const { n, m, mu, R, I, IPrime, A, k, f } = params;
  const kValue = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kValue)) * 10) / 10;

  return [
    `支撑上下固定点的竖向距离 n = ${n} mm`,
    `支撑上下固定点的水平距离 m = ${m} mm`,
    `计算长度系数 μ = ${mu}`,
    `下撑杆截面积 A = ${A} cm²`,
    `下撑杆弱轴方向惯性矩 I = ${I} cm⁴`,
    `下撑杆强轴方向惯性矩 I' = ${IPrime} cm⁴`,
    `斜杆L₁与L₀的比值 k = ${kSnap}`,
    `下撑杆支座反力 R = ${R} kN`,
    `材料抗压强度设计值 f = ${f} N/mm²`,
  ];
}

function getAxisLabel(axis: Axis): string {
  return axis === 'weak' ? '弱轴方向验算' : '强轴方向验算';
}

function getAxisSummary(axis: Axis): { h0Label: string; iLabel: string } {
  if (axis === 'weak') {
    return {
      h0Label: '下撑杆弱轴方向计算长度计算：',
      iLabel: '下撑杆弱轴方向回转半径：',
    };
  }

  return {
    h0Label: '下撑杆强轴方向计算长度计算：',
    iLabel: '下撑杆强轴方向回转半径：',
  };
}

function buildAxisParagraphs(axis: Axis, r: YBraceAxisResult, params: CalcParams): Paragraph[] {
  const { n, m, mu, R, I, IPrime, A, k } = params;
  const kValue = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kValue)) * 10) / 10;
  const lambdaStr = getLambdaRequirementText(r);
  const safeStr = r.isSafe ? '< f（满足要求）' : '≥ f（不满足要求）';
  const { h0Label, iLabel } = getAxisSummary(axis);

  const paras: Paragraph[] = [
    paraText('下撑杆角度计算：'),
    paraFormula(`a = arctan(n/m) = arctan(${n}/${m}) = ${r.a_deg}°`),
  ];

  if (axis === 'weak') {
    const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);

    paras.push(
      paraText(h0Label),
      paraFormula(`h0 = max[(μn/sin a)×k, (μn/sin a)×(1-k)] = max[${full}×${kSnap}, ${full}×${(1 - kSnap).toFixed(1)}] = ${r.h0.toFixed(1)} mm`),
      paraText('下撑杆支座反力：'),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆轴向力：'),
      paraFormula(`Nx = R/sin a = ${R}/sin ${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText(iLabel),
      paraFormula(`i = sqrt(I/A) = sqrt(${I}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：'),
      paraFormula(`λ = h0/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)} ${lambdaStr}`),
    );
  } else {
    paras.push(
      paraText(h0Label),
      paraFormula(`h0' = μn/sin a = ${mu}×${n}/sin ${r.a_deg}° = ${r.h0.toFixed(0)} mm`),
      paraText('下撑杆支座反力：'),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆轴向力：'),
      paraFormula(`Nx = R/sin a = ${R}/sin ${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText(iLabel),
      paraFormula(`i' = sqrt(I'/A) = sqrt(${IPrime}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：'),
      paraFormula(`λ = h0'/i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)} ${lambdaStr}`),
    );
  }

  paras.push(
    paraText('查《钢结构设计标准》GB50017-2017表得：'),
    paraFormula(`φ = ${r.phi}`),
    paraText('轴心受压稳定性计算：'),
    paraFormula(`σ = Nx/(φA) = (${r.Nx.toFixed(2)}×10)/(${r.phi}×${A}) = ${r.sigma.toFixed(2)} N/mm² ${safeStr}`),
  );

  return paras;
}

function buildAngleMath(n: number | '', m: number | '', angleDeg: string): MathComponent[] {
  return mathSeq(
    'a = ',
    mathFunc('arctan', [mathParen([mathFrac([mathRun('n')], [mathRun('m')])])]),
    ' = ',
    mathFunc('arctan', [mathParen([mathFrac([mathRun(String(n))], [mathRun(String(m))])])]),
    ` = ${angleDeg}°`,
  );
}

function buildNxMath(supportForce: number | '', angleDeg: string, nxValue: number): MathComponent[] {
  return mathSeq(
    mathSub('N', 'x'),
    ' = ',
    mathFrac([mathRun('R')], [mathFunc('sin', [mathRun('a')])]),
    ' = ',
    mathFrac([mathRun(String(supportForce))], [mathFunc('sin', [mathRun(`${angleDeg}°`)])]),
    ` = ${nxValue.toFixed(2)} kN`,
  );
}

function buildPhiMath(lambdaValue: number, phiValue: number | string): MathComponent[] {
  return mathSeq(`λ = ${Math.ceil(lambdaValue)} → φ = ${phiValue}`);
}

function buildSigmaMath(
  nxValue: number,
  area: number | '',
  phiValue: number | string,
  sigmaValue: number,
  isSafe: boolean,
): MathComponent[] {
  const compareText = isSafe ? '< f (满足要求)' : ' ≥ f (不满足要求)';

  return mathSeq(
    'σ = ',
    mathFrac([mathSub('N', 'x'), mathRun(' × 10')], [mathRun('φA')]),
    ' = ',
    mathFrac([mathRun(`${nxValue.toFixed(2)} × 10`)], [mathRun(`${phiValue} × ${area}`)]),
    ` = ${sigmaValue.toFixed(2)} ${compareText}`,
  );
}

function buildWeakH0Math(mu: number | '', n: number | '', sinA: number, h0Value: number, kSnap: number): MathComponent[] {
  const full = (Number(mu) * Number(n) / sinA).toFixed(1);
  const otherK = (1 - kSnap).toFixed(1);

  return mathSeq(
    mathSub('h', '0'),
    ' = max',
    mathSquare(
      mathSeq(
        mathParen([mathFrac([mathRun('μn')], [mathFunc('sin', [mathRun('a')])])]),
        ' × k, ',
        mathParen([mathFrac([mathRun('μn')], [mathFunc('sin', [mathRun('a')])])]),
        ' × (1-k)',
      ),
    ),
    ` = max[${full} × ${kSnap}, ${full} × ${otherK}] = ${h0Value.toFixed(1)} mm`,
  );
}

function buildStrongH0Math(mu: number | '', n: number | '', angleDeg: string, h0Value: number): MathComponent[] {
  return mathSeq(
    mathSub('h', '0'),
    "' = ",
    mathFrac([mathRun('μn')], [mathFunc('sin', [mathRun('a')])]),
    ` = ${mu} × ${n} / sin ${angleDeg}° = ${h0Value.toFixed(0)} mm`,
  );
}

function buildWeakIMath(moment: number | '', area: number | '', iValue: number): MathComponent[] {
  return mathSeq(
    'i = ',
    mathSqrt([mathFrac([mathRun('I')], [mathRun('A')])]),
    ' = ',
    mathSqrt([mathFrac([mathRun(String(moment))], [mathRun(String(area))])]),
    ` = ${iValue.toFixed(2)} cm`,
  );
}

function buildStrongIMath(momentPrime: number | '', area: number | '', iValue: number): MathComponent[] {
  return mathSeq(
    "i' = ",
    mathSqrt([mathFrac([mathRun("I'")], [mathRun('A')])]),
    ' = ',
    mathSqrt([mathFrac([mathRun(String(momentPrime))], [mathRun(String(area))])]),
    ` = ${iValue.toFixed(2)} cm`,
  );
}

function buildWeakLambdaMath(h0Value: number, iValueCm: number, lambdaValue: number): MathComponent[] {
  const compareText = lambdaValue < LAMBDA_LIMIT
    ? ` < ${LAMBDA_LIMIT} (满足构造要求)`
    : ` ≥ ${LAMBDA_LIMIT} (构造要求不满足)`;

  return mathSeq(
    'λ = ',
    mathFrac([mathSub('h', '0')], [mathRun('i')]),
    ` = ${h0Value.toFixed(1)} / ${(iValueCm * 10).toFixed(2)} = ${lambdaValue.toFixed(2)}${compareText}`,
  );
}

function buildStrongLambdaMath(h0Value: number, iValueCm: number, lambdaValue: number): MathComponent[] {
  const compareText = lambdaValue < LAMBDA_LIMIT
    ? ` < ${LAMBDA_LIMIT} (满足构造要求)`
    : ` ≥ ${LAMBDA_LIMIT} (构造要求不满足)`;

  return mathSeq(`λ = h0' / i' = ${h0Value.toFixed(0)} / ${(iValueCm * 10).toFixed(2)} = ${lambdaValue.toFixed(2)}${compareText}`);
}

async function buildAxisParagraphsLatex(axis: Axis, r: YBraceAxisResult, params: CalcParams): Promise<Paragraph[]> {
  const { n, m, mu, R, I, IPrime, A, k } = params;
  const kValue = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kValue)) * 10) / 10;
  const { h0Label, iLabel } = getAxisSummary(axis);

  const paras: Paragraph[] = [
    paraText('下撑杆角度计算：'),
    paraDocxMath(buildAngleMath(n, m, r.a_deg)),
  ];

  if (axis === 'weak') {
    paras.push(
      paraText(h0Label),
      paraDocxMath(buildWeakH0Math(mu, n, r.sin_a, r.h0, kSnap)),
      paraText('下撑杆支座反力：'),
      paraDocxMath(mathSeq(`R = ${R} kN`)),
      paraText('下撑杆轴向力：'),
      paraDocxMath(buildNxMath(R, r.a_deg, r.Nx)),
      paraText(iLabel),
      paraDocxMath(buildWeakIMath(I, A, r.i_val)),
      paraText('下撑杆长细比：'),
      paraDocxMath(buildWeakLambdaMath(r.h0, r.i_val, r.lambda)),
    );
  } else {
    paras.push(
      paraText(h0Label),
      paraDocxMath(buildStrongH0Math(mu, n, r.a_deg, r.h0)),
      paraText('下撑杆支座反力：'),
      paraDocxMath(mathSeq(`R = ${R} kN`)),
      paraText('下撑杆轴向力：'),
      paraDocxMath(buildNxMath(R, r.a_deg, r.Nx)),
      paraText(iLabel),
      paraDocxMath(buildStrongIMath(IPrime, A, r.i_val)),
      paraText('下撑杆长细比：'),
      paraDocxMath(buildStrongLambdaMath(r.h0, r.i_val, r.lambda)),
    );
  }

  paras.push(
    paraText('查《钢结构设计标准》GB50017-2017表得：'),
    paraDocxMath(buildPhiMath(r.lambda, r.phi)),
    paraText('轴心受压稳定性计算：'),
    paraDocxMath(buildSigmaMath(r.Nx, A, r.phi, r.sigma, r.isSafe)),
  );

  return paras;
}

function buildCommonDocumentChildren(
  calcResult: YBraceResult,
  paramParagraphs: Paragraph[],
  calcSections: Paragraph[],
): Paragraph[] {
  const now = new Date().toLocaleString('zh-CN', { hour12: false });
  const overallSafe = calcResult.mode === 'both'
    ? Boolean(calcResult.weak && calcResult.strong && isAxisCheckSafe(calcResult.weak) && isAxisCheckSafe(calcResult.strong))
    : calcResult.weak
      ? isAxisCheckSafe(calcResult.weak)
      : calcResult.strong
        ? isAxisCheckSafe(calcResult.strong)
        : false;

  return [
    new Paragraph({
      text: 'Y撑复核验算书',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    paraText(`生成时间：${now}`, false, 21),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    ...paramParagraphs,
    ...calcSections,
    new Paragraph({ text: '', spacing: { after: 200 } }),
    heading2('结论'),
    paraText(
      overallSafe ? '验算通过，满足要求。' : '验算不通过，不满足要求。',
      true,
      FONT_SIZES.HEADING_2,
    ),
  ];
}

async function buildParamParagraphs(params: CalcParams): Promise<Paragraph[]> {
  const imgBytes = await getKonvaImageBytes();
  const paragraphs: Paragraph[] = [heading2('1. 计算参数')];

  if (imgBytes) {
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: imgBytes,
            transformation: { width: 400, height: 600 },
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      }),
    );
  }

  for (const line of getParamLines(params)) {
    paragraphs.push(paraText(line));
  }

  return paragraphs;
}

export async function exportToWord(
  calcResult: YBraceResult | null,
  params: CalcParams,
  _calcTarget: string,
): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数并完成计算。');
    return;
  }

  const paramParagraphs = await buildParamParagraphs(params);
  const calcSections: Paragraph[] = [];
  let sectionIdx = 2;

  if ((calcResult.mode === 'both' || calcResult.mode === 'weak') && calcResult.weak) {
    calcSections.push(heading2(`${sectionIdx}. ${getAxisLabel('weak')}`));
    calcSections.push(...buildAxisParagraphs('weak', calcResult.weak, params));
    sectionIdx += 1;
  }

  if ((calcResult.mode === 'both' || calcResult.mode === 'strong') && calcResult.strong) {
    calcSections.push(heading2(`${sectionIdx}. ${getAxisLabel('strong')}`));
    calcSections.push(...buildAxisParagraphs('strong', calcResult.strong, params));
  }

  const doc = createDoc(buildCommonDocumentChildren(calcResult, paramParagraphs, calcSections));
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Y撑验算书_${formatExportTimestamp()}.docx`);
}

export async function exportToLaTeX(
  calcResult: YBraceResult | null,
  params: CalcParams,
  _calcTarget: string,
): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数并完成计算。');
    return;
  }

  const paramParagraphs = await buildParamParagraphs(params);
  const calcSections: Paragraph[] = [];
  let sectionIdx = 2;

  if ((calcResult.mode === 'both' || calcResult.mode === 'weak') && calcResult.weak) {
    calcSections.push(heading2(`${sectionIdx}. ${getAxisLabel('weak')}`));
    calcSections.push(...await buildAxisParagraphsLatex('weak', calcResult.weak, params));
    sectionIdx += 1;
  }

  if ((calcResult.mode === 'both' || calcResult.mode === 'strong') && calcResult.strong) {
    calcSections.push(heading2(`${sectionIdx}. ${getAxisLabel('strong')}`));
    calcSections.push(...await buildAxisParagraphsLatex('strong', calcResult.strong, params));
  }

  const doc = createDoc(buildCommonDocumentChildren(calcResult, paramParagraphs, calcSections));
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Y撑验算书_LaTeX版_${formatExportTimestamp()}.docx`);
}

function ensureHtml2Pdf(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src*="html2pdf"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('html2pdf.js 加载失败')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('html2pdf.js 加载失败'));
    document.head.appendChild(script);
  });
}

export async function exportToPDF(calcResult: YBraceResult | null): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数并完成计算。');
    return;
  }

  const element = document.getElementById('export-area');
  if (!element) {
    alert('未找到导出区域，请联系开发者。');
    return;
  }

  try {
    await ensureHtml2Pdf();
  } catch {
    alert('PDF 导出插件加载失败，请检查网络后重试。');
    return;
  }

  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;
  const prevFlex = element.style.flex;

  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.flex = 'none';

  const opt = {
    margin: [12, 15, 12, 15],
    filename: `Y撑验算书_${formatExportTimestamp()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await window.html2pdf().set(opt).from(element).save();
  } finally {
    element.style.overflow = prevOverflow;
    element.style.maxHeight = prevMaxHeight;
    element.style.flex = prevFlex;
  }
}
