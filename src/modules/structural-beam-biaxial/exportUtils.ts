import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { FlexuralAxisResult, StructuralBeamBiaxialResult } from './calculate';
import { ParamValue } from '../types';

type CalcParams = Record<string, ParamValue>;

const FONT_SIZES = {
  TITLE: 32,
  HEADING: 24,
  NORMAL: 22,
};

const FONTS = {
  CHINESE: 'SimSun',
  ENGLISH: 'Times New Roman',
  HEADING: 'SimHei',
};

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

function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  return value.toFixed(digits);
}

function fmtArea(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return value.toFixed(0);
}

function pct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  return `${(value * 100).toFixed(digits)}%`;
}

function rebarLabel(axis: FlexuralAxisResult): string {
  if (!axis.rebarCount || !axis.rebarDiameter) return '自定义';
  return `${axis.rebarCount}Φ${axis.rebarDiameter}`;
}

function createTextRun(text: string, bold = false, script?: 'sub' | 'super'): TextRun {
  return new TextRun({
    text,
    bold,
    size: FONT_SIZES.NORMAL,
    subScript: script === 'sub',
    superScript: script === 'super',
    font: {
      ascii: FONTS.ENGLISH,
      eastAsia: FONTS.CHINESE,
      hint: 'eastAsia',
    },
  });
}

function richRuns(text: string, bold = false): TextRun[] {
  const runs: TextRun[] = [];
  const re = /([_^])(?:\{([^}]+)\}|([A-Za-z0-9]+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(createTextRun(text.slice(lastIndex, match.index), bold));
    }
    runs.push(createTextRun(match[2] ?? match[3], bold, match[1] === '_' ? 'sub' : 'super'));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) runs.push(createTextRun(text.slice(lastIndex), bold));
  return runs.length > 0 ? runs : [createTextRun('', bold)];
}

function paraText(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: richRuns(text, bold),
    spacing: { after: 100 },
  });
}

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: FONT_SIZES.HEADING,
        font: {
          ascii: FONTS.ENGLISH,
          eastAsia: FONTS.HEADING,
          hint: 'eastAsia',
        },
      }),
    ],
    spacing: { before: 160, after: 120 },
  });
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
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
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

function getConcreteLabel(params: CalcParams): string {
  return params.concreteGrade && params.concreteGrade !== 'custom'
    ? String(params.concreteGrade)
    : '自定义';
}

function getSteelLabel(params: CalcParams): string {
  return params.steelGrade && params.steelGrade !== 'custom'
    ? String(params.steelGrade).replace(/\\/g, '、')
    : '自定义';
}

function axisParagraphs(axis: FlexuralAxisResult, label: string, fc: number, fy: number): Paragraph[] {
  const moment = axis.axis === 'x' ? 'M_x' : 'M_y';
  const area = axis.axis === 'x' ? 'A_sx' : 'A_sy';
  const provided = axis.axis === 'x' ? 'A_ux' : 'A_uy';
  const widthName = axis.axis === 'x' ? 'b' : 'h';
  const rho = axis.axis === 'x' ? 'ρ_x' : 'ρ_y';

  return [
    paraText(label, true),
    paraText(`截面抵抗矩系数：a_s = ${moment}/(α_1 f_c ${widthName} h_0^2) = ${fmt(axis.moment)}×10^6/(1×${fc}×${fmtArea(axis.sectionWidth)}×${fmtArea(axis.h0)}^2) = ${fmt(axis.alphaS, 3)}`),
    paraText(`相对受压区高度：ξ = 1 - sqrt(1 - 2a_s) = ${fmt(axis.xi, 3)} ${axis.xi < axis.xiB ? '<' : '≥'} ξ_b = ${axis.xiB}`),
    paraText(`内力臂系数：γ_s = 0.5×(1 + sqrt(1 - 2a_s)) = ${fmt(axis.gammaS, 3)}`),
    paraText(`纵向受拉钢筋截面面积：${area} = ${moment}/(f_y γ_s h_0) = ${fmt(axis.moment)}×10^6/(${fy}×${fmt(axis.gammaS, 3)}×${fmtArea(axis.h0)}) = ${fmtArea(axis.requiredArea)} mm^2`),
    paraText(`配筋验算：${provided} = ${fmtArea(axis.providedArea)} mm^2 ${axis.areaOk ? '≥' : '<'} ${fmtArea(axis.requiredArea)} mm^2，${rebarLabel(axis)}，${axis.areaOk ? '满足' : '不满足'}`),
    paraText(axis.arrangementWidth === null
      ? '自定义钢筋，未进行排布宽度自动验算。'
      : `排布宽度：${axis.rebarCount}×${axis.rebarDiameter}+${Math.max(0, (axis.rebarCount ?? 1) - 1)}×25+2×(20+8) = ${fmtArea(axis.arrangementWidth)} mm ${axis.fits ? '<' : '≥'} ${fmtArea(axis.fitWidth)} mm，${axis.fits ? '满足' : '不满足'}`),
    paraText(`${rho} = ${fmtArea(axis.providedArea)}/(${fmtArea(axis.sectionWidth)}×${fmtArea(axis.h0)}) = ${pct(axis.rho)}；ρ_min,1 = 0.45(f_t/f_y)(h/h_0) = ${pct(axis.rhoMinFt)}；ρ_min,2 = 0.2%(h/h_0) = ${pct(axis.rhoMinBase)}，${axis.rhoOk ? '满足' : '不满足'}`),
  ];
}

async function buildWordParagraphs(calcResult: StructuralBeamBiaxialResult, params: CalcParams): Promise<Paragraph[]> {
  const { input, worst, flexural, shear } = calcResult;
  const x = flexural.x;
  const y = flexural.y;
  const imgBytes = await getKonvaImageBytes();
  const diagramParagraphs: Paragraph[] = imgBytes
    ? [
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: imgBytes,
            transformation: { width: 360, height: 520 },
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
      }),
    ]
    : [];

  const a = fmt(worst.horizontalA);
  const horizontalB = fmt(worst.horizontalB);
  const l = fmt(worst.effectiveSpanM);
  const F = input.F;

  return [
    new Paragraph({
      text: '两端固支梁双向受力验算书',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    heading('基本参数情况'),
    ...diagramParagraphs,
    paraText(`混凝土：${getConcreteLabel(params)}`),
    paraText(`钢筋：${getSteelLabel(params)}`),
    paraText(`截面：b = ${input.b} mm，h = ${input.h} mm`),
    paraText(`梁长：l = ${fmt(worst.effectiveSpanM)} m`),
    paraText(`受力点位：a = ${a} m，b = l - a = ${horizontalB} m`),
    paraText(`竖向均布荷载：q = ${input.q} kN/m`),
    paraText(`水平集中力：F = ${input.F} kN`),
    paraText(`轴心抗压强度：f_c = ${input.fc} N/mm^2`),
    paraText(`混凝土抗拉强度标准值：f_t = ${input.ft} N/mm^2`),
    paraText(`钢筋强度设计值：f_y = ${input.fy} N/mm^2`),

    heading('1. 最不利点判定'),
    paraText('均布荷载作用下：'),
    paraText(`支座弯矩 M_x1 = -q l^2/12 = -${input.q}×${l}^2/12 = ${fmt(worst.verticalSupportMoment)} kN·m`),
    paraText(`跨中弯矩 M_x2 = q l^2/24 = ${input.q}×${l}^2/24 = ${fmt(worst.verticalMidMoment)} kN·m`),
    paraText(`支座剪力 V_1 = ql/2 = ${input.q}×${l}/2 = ${fmt(worst.verticalShear)} kN`),
    paraText('水平力作用下：'),
    paraText(`b = l - a = ${horizontalB} m`),
    paraText(`支座弯矩 M_y1 = max[-F a b^2/l^2, F b a^2/l^2] = max[-${F}×${a}×${horizontalB}^2/${l}^2, ${F}×${horizontalB}×${a}^2/${l}^2] = ${fmt(worst.horizontalSupportMoment)} kN·m`),
    paraText(`集中力处弯矩 M_y2 = F a^2 b^2/l^3 = ${F}×${a}^2×${horizontalB}^2/${l}^3 = ${fmt(worst.horizontalMidMoment)} kN·m`),
    paraText(`支座剪力 V_2 = max[|F b^2/l^2(1+2a/l)|, |-F a^2/l^2(1+2b/l)|] = ${fmt(worst.horizontalShear)} kN`),
    paraText(`得到最不利截面为${worst.worstSection === 'support' ? '支座处' : '集中力处'}。`),
    paraText(`M_x = max(|M_x1|, |M_x2|) = ${fmt(worst.Mx)} kN·m`),
    paraText(`M_y = max(|M_y1|, |M_y2|) = ${fmt(worst.My)} kN·m`),
    paraText(`V = max(|V_1|, |V_2|) = ${fmt(worst.V)} kN`),

    heading('2. 纵向受拉钢筋截面面积计算'),
    ...axisParagraphs(x, 'x 方向', input.fc, input.fy),
    ...axisParagraphs(y, 'y 方向', input.fc, input.fy),

    heading('3. 斜截面受剪验算'),
    paraText('截面限制条件：'),
    paraText(`0.25 f_c b h_0 = 0.25×${input.fc}×${input.b}×${fmtArea(x.h0)}/1000 = ${fmt(shear.limitCapacity, 1)} kN ${shear.limitOk ? '>' : '≤'} ${fmt(shear.shear)} kN，${shear.limitOk ? '满足' : '不满足'}`),
    paraText('受剪承载力：'),
    paraText(`0.7 f_t b h_0 = 0.7×${input.ft}×${input.b}×${fmtArea(x.h0)}/1000 = ${fmt(shear.concreteCapacity, 1)} kN ${shear.concreteOk ? '>' : '≤'} ${fmt(shear.shear)} kN，${shear.concreteOk ? '满足' : '不满足'}`),
    paraText(shear.concreteOk ? '混凝土即可承担剪力，箍筋按构造配置。' : '混凝土受剪承载力不足，应另行配置箍筋并复核。'),
  ];
}

function saveHtmlAsWord(html: string, filename: string): void {
  const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>结构梁双向受力验算书</title>
      <style>
        body{ font-family: SimSun, "Times New Roman", serif; font-size:11pt; color:#111827; }
        .katex-display{ text-align:center; margin:8px 0; }
      </style>
    </head><body>`;
  const footer = '</body></html>';
  const blob = new Blob(['\ufeff', header, html, footer], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function exportToWord(
  calcResult: StructuralBeamBiaxialResult | null,
  params: CalcParams,
): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数并完成计算。');
    return;
  }

  const doc = createDoc(await buildWordParagraphs(calcResult, params));
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `结构梁双向受力验算书_${formatExportTimestamp()}.docx`);
}

export function exportToLaTeX(calcResult: StructuralBeamBiaxialResult | null): void {
  if (!calcResult) {
    alert('请先填写完整参数并完成计算。');
    return;
  }

  const element = document.getElementById('export-area');
  if (!element) {
    alert('未找到导出区域，请联系开发者。');
    return;
  }

  const clone = element.cloneNode(true) as HTMLElement;
  clone.querySelectorAll<HTMLElement>('.overflow-x-auto').forEach((node) => {
    node.style.overflow = 'visible';
    node.style.whiteSpace = 'normal';
  });

  saveHtmlAsWord(clone.outerHTML, `结构梁双向受力验算书_LaTeX版_${formatExportTimestamp()}.doc`);
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

export async function exportToPDF(calcResult: StructuralBeamBiaxialResult | null): Promise<void> {
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
    filename: `结构梁双向受力验算书_${formatExportTimestamp()}.pdf`,
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
