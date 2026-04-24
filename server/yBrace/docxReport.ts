import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import type { YBraceAxisResult, YBraceResult } from '../../src/modules/y-brace/calculate';
import type { YBraceParams } from './validation';

const FONT_SIZES = {
  TITLE: 44,
  HEADING_2: 24,
  NORMAL: 24,
  FORMULA: 24,
};

const FONTS = {
  CHINESE: 'SimSun',
  ENGLISH: 'Times New Roman',
  HEADING: 'SimHei',
  MATH: 'Cambria Math',
};

const LAMBDA_LIMIT = 200;
const TRANSPARENT_PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lZsZ2wAAAABJRU5ErkJggg==',
  'base64',
);

type Axis = 'weak' | 'strong';

function textRun(text: string, bold = false, size = FONT_SIZES.NORMAL): TextRun {
  return new TextRun({
    text,
    bold,
    size,
    font: {
      ascii: FONTS.ENGLISH,
      eastAsia: FONTS.CHINESE,
      hint: 'eastAsia',
    },
  });
}

function paragraph(text: string, bold = false, size = FONT_SIZES.NORMAL): Paragraph {
  return new Paragraph({
    children: [textRun(text, bold, size)],
    spacing: { after: 120 },
  });
}

function formula(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: FONT_SIZES.FORMULA,
        font: FONTS.MATH,
      }),
    ],
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

function isLambdaSafe(result: YBraceAxisResult): boolean {
  return result.lambda < LAMBDA_LIMIT;
}

function isAxisCheckSafe(result: YBraceAxisResult): boolean {
  return isLambdaSafe(result) && result.isSafe;
}

function lambdaRequirementText(result: YBraceAxisResult): string {
  return isLambdaSafe(result)
    ? `< ${LAMBDA_LIMIT}（满足构造要求）`
    : `≥ ${LAMBDA_LIMIT}（构造要求不满足）`;
}

function axisLabel(axis: Axis): string {
  return axis === 'weak' ? '弱轴方向验算' : '强轴方向验算';
}

function axisSummary(axis: Axis): { h0Label: string; iLabel: string } {
  if (axis === 'weak') {
    return {
      h0Label: '下撑杆件弱轴方向计算长度计算：',
      iLabel: '下撑杆件弱轴方向回转半径：',
    };
  }

  return {
    h0Label: '下撑杆件强轴方向计算长度计算：',
    iLabel: '下撑杆件强轴方向回转半径：',
  };
}

function snappedK(params: YBraceParams): number {
  return Math.round(Math.min(0.9, Math.max(0.1, Number(params.k))) * 10) / 10;
}

function parameterParagraphs(params: YBraceParams): Paragraph[] {
  return [
    paragraph(`支撑上下固定点的竖向距离 n = ${params.n} mm`),
    paragraph(`支撑上下固定点的水平距离 m = ${params.m} mm`),
    paragraph(`计算长度系数 μ = ${params.mu}`),
    paragraph(`下撑杆截面积 A = ${params.A} cm²`),
    paragraph(`下撑杆弱轴方向截面惯性矩 I = ${params.I} cm⁴`),
    paragraph(`下撑杆强轴方向截面惯性矩 I' = ${params.IPrime} cm⁴`),
    paragraph(`斜杆 L₁ 与 L₀ 的比值 k = ${snappedK(params)}`),
    paragraph(`下撑杆支座反力 R = ${params.R} kN`),
    paragraph(`材料抗压强度设计值 f = ${params.f} N/mm²`),
  ];
}

function createDiagramSvg(params: YBraceParams): Buffer {
  const width = 520;
  const height = 620;
  const padding = 110;
  const n = params.n || 4800;
  const m = params.m || 2144;
  const k = snappedK(params);
  const scale = Math.min((width - padding * 2) / m, (height - padding * 2) / n);
  const scaledN = n * scale;
  const scaledM = m * scale;
  const cx = width / 2 - scaledM / 2;
  const cy = height / 2 - scaledN / 2;
  const braceX = cx + scaledM;
  const braceY = cy;
  const bottomX = cx;
  const bottomY = cy + scaledN;
  const kX = bottomX + k * scaledM;
  const kY = bottomY - k * scaledN;

  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <text x="24" y="36" font-family="SimSun, Arial" font-size="18" font-weight="700" fill="#1f2937">Y撑支护示意图</text>
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${bottomY + 40}" stroke="#4b5563" stroke-width="4"/>
  <line x1="${cx}" y1="${cy}" x2="${braceX + 40}" y2="${braceY}" stroke="#4b5563" stroke-width="4"/>
  <line x1="${bottomX}" y1="${bottomY}" x2="${braceX}" y2="${braceY}" stroke="#DC2915" stroke-width="4" stroke-linecap="round"/>
  <line x1="${cx}" y1="${cy}" x2="${kX}" y2="${kY}" stroke="#DC2915" stroke-width="4" stroke-linecap="round"/>
  <line x1="${cx - 30}" y1="${cy}" x2="${cx - 30}" y2="${bottomY}" stroke="#9ca3af" stroke-width="2"/>
  <line x1="${cx - 36}" y1="${cy}" x2="${cx - 24}" y2="${cy}" stroke="#9ca3af" stroke-width="2"/>
  <line x1="${cx - 36}" y1="${bottomY}" x2="${cx - 24}" y2="${bottomY}" stroke="#9ca3af" stroke-width="2"/>
  <line x1="${cx}" y1="${cy - 30}" x2="${braceX}" y2="${cy - 30}" stroke="#9ca3af" stroke-width="2"/>
  <line x1="${cx}" y1="${cy - 36}" x2="${cx}" y2="${cy - 24}" stroke="#9ca3af" stroke-width="2"/>
  <line x1="${braceX}" y1="${cy - 36}" x2="${braceX}" y2="${cy - 24}" stroke="#9ca3af" stroke-width="2"/>
  <text x="${cx - 55}" y="${cy + scaledN / 2}" font-family="Arial" font-size="18" font-weight="700" fill="#374151" transform="rotate(-90 ${cx - 55} ${cy + scaledN / 2})">n=${n}</text>
  <text x="${cx + scaledM / 2 - 30}" y="${cy - 46}" font-family="Arial" font-size="18" font-weight="700" fill="#374151">m=${m}</text>
  <text x="${kX + 8}" y="${kY + 18}" font-family="Arial" font-size="16" font-weight="700" fill="#1d4ed8">k=${k}</text>
  <text x="${(bottomX + braceX) / 2 + 28}" y="${(bottomY + braceY) / 2 + 24}" font-family="Arial" font-size="17" font-weight="700" fill="#374151">L0</text>
  <text x="${(cx + kX) / 2 + 18}" y="${(cy + kY) / 2 - 16}" font-family="Arial" font-size="17" font-weight="700" fill="#374151">L1</text>
</svg>`.trim());
}

function diagramParagraph(params: YBraceParams): Paragraph {
  return new Paragraph({
    children: [
      new ImageRun({
        type: 'svg',
        data: createDiagramSvg(params),
        fallback: {
          type: 'png',
          data: TRANSPARENT_PNG_1X1,
        },
        transformation: { width: 400, height: 477 },
        altText: {
          title: 'Y撑支护示意图',
          description: '根据 n、m、k 参数生成的 Y 撑支护示意图',
          name: 'Y brace diagram',
        },
      }),
    ],
    alignment: AlignmentType.LEFT,
    spacing: { after: 200 },
  });
}

function axisParagraphs(axis: Axis, result: YBraceAxisResult, params: YBraceParams): Paragraph[] {
  const { n, m, mu, R, I, IPrime, A } = params;
  const k = snappedK(params);
  const safeText = result.isSafe ? '< f（满足要求）' : '≥ f（不满足要求）';
  const { h0Label, iLabel } = axisSummary(axis);

  const paragraphs: Paragraph[] = [
    paragraph('下撑杆件角度计算：'),
    formula(`a = arctan(n/m) = arctan(${n}/${m}) = ${result.a_deg}°`),
  ];

  if (axis === 'weak') {
    const full = (mu * n / result.sin_a).toFixed(1);
    paragraphs.push(
      paragraph(h0Label),
      formula(`h0 = max[(μn/sin a)×k, (μn/sin a)×(1-k)] = max[${full}×${k}, ${full}×${(1 - k).toFixed(1)}] = ${result.h0.toFixed(1)} mm`),
      paragraph('下撑杆件支座力：'),
      formula(`R = ${R} kN`),
      paragraph('下撑杆件轴向力：'),
      formula(`Nx = R/sin a = ${R}/sin ${result.a_deg}° = ${result.Nx.toFixed(2)} kN`),
      paragraph(iLabel),
      formula(`i = sqrt(I/A) = sqrt(${I}/${A}) = ${result.i_val.toFixed(2)} cm`),
      paragraph('下撑杆长细比：'),
      formula(`λ = h0/i = ${result.h0.toFixed(1)} / ${(result.i_val * 10).toFixed(2)} = ${result.lambda.toFixed(2)} ${lambdaRequirementText(result)}`),
    );
  } else {
    paragraphs.push(
      paragraph(h0Label),
      formula(`h0' = μn/sin a = ${mu}×${n}/sin ${result.a_deg}° = ${result.h0.toFixed(0)} mm`),
      paragraph('下撑杆件支座力：'),
      formula(`R = ${R} kN`),
      paragraph('下撑杆件轴向力：'),
      formula(`Nx = R/sin a = ${R}/sin ${result.a_deg}° = ${result.Nx.toFixed(2)} kN`),
      paragraph(iLabel),
      formula(`i' = sqrt(I'/A) = sqrt(${IPrime}/${A}) = ${result.i_val.toFixed(2)} cm`),
      paragraph('下撑杆长细比：'),
      formula(`λ = h0'/i' = ${result.h0.toFixed(0)} / ${(result.i_val * 10).toFixed(2)} = ${result.lambda.toFixed(2)} ${lambdaRequirementText(result)}`),
    );
  }

  paragraphs.push(
    paragraph('查《钢结构设计标准》GB50017-2017 表得：'),
    formula(`φ = ${result.phi}`),
    paragraph('轴心受压稳定性计算：'),
    formula(`σ = Nx/(φA) = (${result.Nx.toFixed(2)}×10)/(${result.phi}×${A}) = ${result.sigma.toFixed(2)} N/mm² ${safeText}`),
  );

  return paragraphs;
}

function overallSafe(result: YBraceResult): boolean {
  if (result.mode === 'both') {
    return Boolean(result.weak && result.strong && isAxisCheckSafe(result.weak) && isAxisCheckSafe(result.strong));
  }

  if (result.weak) return isAxisCheckSafe(result.weak);
  if (result.strong) return isAxisCheckSafe(result.strong);
  return false;
}

export async function buildYBraceDocxBuffer(
  params: YBraceParams,
  result: YBraceResult,
): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({
      text: 'Y撑复核验算书',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    paragraph(`生成时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`, false, 21),
    heading2('1. 计算参数'),
    diagramParagraph(params),
    ...parameterParagraphs(params),
  ];

  let sectionIndex = 2;
  if ((result.mode === 'both' || result.mode === 'weak') && result.weak) {
    children.push(heading2(`${sectionIndex}. ${axisLabel('weak')}`));
    children.push(...axisParagraphs('weak', result.weak, params));
    sectionIndex += 1;
  }

  if ((result.mode === 'both' || result.mode === 'strong') && result.strong) {
    children.push(heading2(`${sectionIndex}. ${axisLabel('strong')}`));
    children.push(...axisParagraphs('strong', result.strong, params));
  }

  children.push(
    new Paragraph({ text: '', spacing: { after: 200 } }),
    heading2('结论'),
    paragraph(overallSafe(result) ? '验算通过，满足要求。' : '验算不通过，不满足要求。', true, FONT_SIZES.HEADING_2),
  );

  const document = new Document({
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
          run: { size: FONT_SIZES.TITLE, bold: true, font: FONTS.HEADING },
          paragraph: { spacing: { before: 240, after: 240 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: FONT_SIZES.HEADING_2, bold: false, font: FONTS.HEADING },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      ],
    },
    sections: [{ children }],
  });

  return Packer.toBuffer(document);
}
