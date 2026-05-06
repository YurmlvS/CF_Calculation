import {
  AlignmentType,
  Document,
  HeadingLevel,
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

function paraText(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size: FONT_SIZES.NORMAL,
        font: {
          ascii: FONTS.ENGLISH,
          eastAsia: FONTS.CHINESE,
          hint: 'eastAsia',
        },
      }),
    ],
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

function buildWordParagraphs(calcResult: StructuralBeamBiaxialResult, params: CalcParams): Paragraph[] {
  const { input, worst, flexural, shear } = calcResult;
  const x = flexural.x;
  const y = flexural.y;

  return [
    new Paragraph({
      text: '两端固支梁双向受弯复核',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    heading('基本参数情况'),
    paraText(`混凝土 ${getConcreteLabel(params)}`),
    paraText(`钢筋 ${getSteelLabel(params)}`),
    paraText(`截面 b=${input.b} mm  h=${input.h} mm`),
    paraText(`有效高度 h0=${fmtArea(x.h0)} mm (有利方向）`),
    paraText(`有效高度 h0'=${fmtArea(y.h0)} mm(不利方向）`),
    paraText(`梁长 l=${fmt(worst.effectiveSpanM)} m`),
    paraText(`竖向均布荷载 q= ${input.q} kN/m`),
    paraText(`水平力 F= ${input.F} kN`),
    paraText(`轴心抗压强度fc=${input.fc} N/mm2`),
    paraText(`混凝土的抗拉强度标准值ft=${input.ft} N/mm2`),
    paraText(`钢筋强度设计值fy=${input.fy} N/mm2`),

    heading('1.最不利点判定'),
    paraText('均布荷载作用下'),
    paraText(`支座弯矩 M1 = -ql2/12 =${fmt(worst.verticalSupportMoment)} kN·m`),
    paraText(`跨中弯矩 M2 = ql2/24 = ${fmt(worst.verticalMidMoment)} kN·m`),
    paraText(`支座剪力 V1 = ql/2 = ${fmt(worst.verticalShear, 0)} kN`),
    paraText('水平力作用下 (以作用在中点为例）'),
    paraText(`支座弯矩 M1 = -Fab2/l2 或 Fba2/l2 =${fmt(worst.horizontalSupportMoment)} kN·m`),
    paraText(`跨中弯矩 M2 = Fa2b2/l3 = ${fmt(worst.horizontalMidMoment)} kN·m`),
    paraText(`支座剪力 V1 =(Fb2/l2)*(1+2a/l) 或 -(Fa2/l2)*(1+2b/l) = ${fmt(worst.horizontalShear, 0)} kN`),
    paraText(`得到最不利截面为${worst.worstSection === 'support' ? '支座处' : '跨中处'}`),
    paraText(`Mx = max[Mx1,Mx2]=${fmt(worst.Mx)} kN·m`),
    paraText(`My = max[My1,My2]=${fmt(worst.My)} kN·m`),
    paraText(`V= max[V1,V2]=${fmt(worst.V, 0)} kN`),

    heading('2.纵向受拉钢筋的截面面积计算'),
    paraText('x方向'),
    paraText('截面抵抗矩系数计算：'),
    paraText(`as=Mx/(a1*fc*b*h02) =${fmt(worst.Mx)}*106/(1*${input.fc}*${input.b}*${fmtArea(x.h0)}2)=${fmt(x.alphaS, 2)}`),
    paraText('相对受压区高度计算'),
    paraText(`ξ=1-sqrt(1-2as)=${fmt(x.xi, 3)}<ξb = ${x.xiB}`),
    paraText('内力矩的内力臂系数'),
    paraText(`Υs=0.5*(1+sqrt(1-2as))=${fmt(x.gammaS, 3)}`),
    paraText('纵向受拉钢筋的截面面积'),
    paraText(`Asx=M/(fy*Υs*h0)=${fmt(worst.Mx)}*106/(${input.fy}*${fmt(x.gammaS, 3)}*${fmtArea(x.h0)})=${fmtArea(x.requiredArea)} mm2`),
    paraText('y方向'),
    paraText('截面抵抗矩系数计算：'),
    paraText(`as=My/(a1*fc*b*h02) =${fmt(worst.My)}*106/(1*${input.fc}*${fmtArea(y.sectionWidth)}*${fmtArea(y.h0)}2)=${fmt(y.alphaS, 3)}`),
    paraText('相对受压区高度计算'),
    paraText(`ξ=1-sqrt(1-2as)=${fmt(y.xi, 3)}<ξb = ${y.xiB}`),
    paraText('内力矩的内力臂系数'),
    paraText(`Υs=0.5*(1+sqrt(1-2as))=${fmt(y.gammaS, 3)}`),
    paraText('纵向受拉钢筋的截面面积'),
    paraText(`Asy=M/(fy*Υs*h0)=${fmt(worst.My)}*106/(${input.fy}*${fmt(y.gammaS, 3)}*${fmtArea(y.h0)})=${fmtArea(y.requiredArea)} mm2`),
    paraText('对x、y两个方向分别进行配筋得到'),
    paraText(`绕 x：${rebarLabel(x)}，Aux=${fmtArea(input.Aux)} mm² ${x.areaOk ? '>' : '<'} ${fmtArea(x.requiredArea)} mm²`),
    paraText(`绕 y：${rebarLabel(y)}，Auy=${fmtArea(input.Auy)} mm² ${y.areaOk ? '>' : '<'} ${fmtArea(y.requiredArea)} mm²`),
    paraText(`验算在b=${fmtArea(x.fitWidth)} mm 宽度内是否放得下：`),
    paraText(x.arrangementWidth === null
      ? '自定义钢筋，未进行排布宽度自动验算。'
      : `${x.rebarCount}*${x.rebarDiameter}+${Math.max(0, (x.rebarCount ?? 1) - 1)}*25+2*（20+8）=${fmtArea(x.arrangementWidth)} mm < ${fmtArea(x.fitWidth)} mm ${x.fits ? '可以' : '不可以'}`),
    paraText(`ρ=${fmtArea(input.Aux)}/(${fmtArea(x.sectionWidth)}*${fmtArea(x.h0)})=${pct(x.rho)} > ρmin *h/h0 = 0.45(ft/fy)*(h/h0) = ${pct(x.rhoMinFt, 1)},同时ρ>0.2%*h/h0=${pct(x.rhoMinBase)} ${x.rhoOk ? '可以' : '不可以'}`),
    paraText(`验算在b=${fmtArea(y.fitWidth)} mm 宽度内是否放得下：`),
    paraText(y.arrangementWidth === null
      ? '自定义钢筋，未进行排布宽度自动验算。'
      : `${y.rebarCount}*${y.rebarDiameter}+${Math.max(0, (y.rebarCount ?? 1) - 1)}*25+2*（20+8）=${fmtArea(y.arrangementWidth)} mm < ${fmtArea(y.fitWidth)} mm ${y.fits ? '可以' : '不可以'}`),
    paraText(`ρ=${fmtArea(input.Auy)}/(${fmtArea(y.h0)}*${fmtArea(y.sectionWidth)})=${pct(y.rho)} > ρmin *h/h0 = 0.45(ft/fy)*(h/h0) = ${pct(y.rhoMinFt)},同时ρ>0.2%*h/h0=${pct(y.rhoMinBase)} ${y.rhoOk ? '可以' : '不可以'}`),

    heading('3.斜截面受剪验算'),
    paraText('截面限制条件'),
    paraText(`0.25fcbh0=0.25*${input.fc}*${input.b}*${fmtArea(x.h0)}=${fmt(shear.limitCapacity, 1)}>${fmt(shear.shear, 0)} ${shear.limitOk ? '满足' : '不满足'}`),
    paraText('受剪承载力'),
    paraText(`0.7ftbh0=0.7*${input.ft}*${input.b}*${fmtArea(x.h0)}=${fmt(shear.concreteCapacity, 1)}>${fmt(shear.shear, 0)} ${shear.concreteOk ? '满足' : '不满足'}`),
    paraText(shear.concreteOk ? '混凝土即可承担剪力，箍筋按照构造配置' : '混凝土受剪承载力不足，应另行配置箍筋并复核'),
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

  const doc = createDoc(buildWordParagraphs(calcResult, params));
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

