import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
} from 'docx';
import { saveAs } from 'file-saver';
import { YBraceResult, YBraceAxisResult } from './calculate';

// ─── KaTeX → plain text fallback for Word ───────────────────────────────────
// We render formulas as plain text lines in docx (LaTeX-style notation)

function paraText(text: string, bold = false, size = 22): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size })],
    spacing: { after: 100 },
  });
}

function paraFormula(formula: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: formula, size: 22, font: 'Cambria Math' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
  });
}



/** Convert Konva stage to PNG base64 string */
async function getKonvaImageBytes(): Promise<Uint8Array | null> {
  try {
    // Try to get the Konva stage from the DOM
    const canvas = document.querySelector<HTMLCanvasElement>('canvas');
    if (!canvas) return null;
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function buildAxisParagraphs(
  axis: 'weak' | 'strong',
  r: YBraceAxisResult,
  params: Record<string, number | ''>,
): Paragraph[] {
  const { n, m, mu, R, I, IPrime, A, k } = params;
  const kVal = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;
  const safeStr = r.isSafe ? '< f (满足要求)' : '≥ f (不满足)';

  const paras: Paragraph[] = [];

  if (axis === 'weak') {
    const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);
    paras.push(
      paraText('下撑杆件角度计算：', true),
      paraFormula(`a = arctan(n/m) = arctan(${n}/${m}) = ${r.a_deg}°`),
      paraText('下撑杆件弱轴方向计算长度计算：', true),
      paraFormula(`h₀ = max[(μn/sin a)·k, (μn/sin a)·(1-k)] = max[${full}×${kSnap}, ${full}×${(1-kSnap).toFixed(1)}] = ${r.h0.toFixed(1)} mm`),
      paraText('下撑杆件支座力：', true),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆件轴向力：', true),
      paraFormula(`Nx = R/sin a = ${R}/sin${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText('下撑杆弱轴方向回转半径：', true),
      paraFormula(`i = √(I/A) = √(${I}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：', true),
      paraFormula(`λ = h₀/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`),
      paraText('查《钢结构设计标准》GB50017-2017表D得，', true),
      paraFormula(`φ = ${r.phi}`),
      paraText('轴心受压稳定性计算：', true),
      paraFormula(`σ = Nx/(φA) = (${r.Nx.toFixed(2)}×10)/(${r.phi}×${A}) = ${r.sigma.toFixed(2)} N/mm² ${safeStr}`),
    );
  } else {
    paras.push(
      paraText('下撑杆件角度计算：', true),
      paraFormula(`a = arctan(n/m) = arctan(${n}/${m}) = ${r.a_deg}°`),
      paraText('下撑杆件强轴方向计算长度计算：', true),
      paraFormula(`h₀' = μn/sin a = ${mu}×${n}/sin${r.a_deg}° = ${r.h0.toFixed(0)} mm`),
      paraText('下撑杆件支座力：', true),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆件轴向力：', true),
      paraFormula(`Nx = R/sin a = ${R}/sin${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText('下撑杆强轴方向回转半径：', true),
      paraFormula(`i' = √(I'/A) = √(${IPrime}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：', true),
      paraFormula(`λ = μh₀'/i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`),
      paraText('查《钢结构设计标准》GB50017-2017表D得，', true),
      paraFormula(`φ = ${r.phi}`),
      paraText('轴心受压稳定性计算：', true),
      paraFormula(`σ = Nx/(φA) = (${r.Nx.toFixed(2)}×10)/(${r.phi}×${A}) = ${r.sigma.toFixed(2)} N/mm² ${safeStr}`),
    );
  }

  return paras;
}

/** 导出 Word (.docx) */
export async function exportToWord(
  calcResult: YBraceResult | null,
  params: Record<string, number | ''>,
  _calcTarget: string,
): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }

  const now = new Date().toLocaleString('zh-CN', { hour12: false });

  // Attempt to get Konva canvas image
  const imgBytes = await getKonvaImageBytes();

  // ── 1. 计算参数 ──────────────────────────────────────────────────────────
  const { n, m, mu, R, I, IPrime, A, k, f } = params;
  const kVal = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;

  const paramParagraphs: Paragraph[] = [
    heading2('1. 计算参数'),
  ];

  if (imgBytes) {
    paramParagraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png',
            data: imgBytes,
            transformation: { width: 400, height: 300 },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );
  }

  const paramLines = [
    `支撑件上下固定点的垂直距离 n = ${n} mm`,
    `支撑件上下固定点的水平距离 m = ${m} mm`,
    `计算长度系数 μ = ${mu}`,
    `下撑杆截面积 A = ${A} cm²`,
    `下撑杆弱轴方向截面惯性矩 I = ${I} cm⁴`,
    `下撑杆强轴方向截面惯性矩 I' = ${IPrime} cm⁴`,
    `Y撑交点位于斜杆位置 k = ${kSnap}`,
    `下撑杆件支座力 R = ${R} kN`,
    `材料抗压强度设计值 f = ${f} N/mm²`,
  ];
  paramLines.forEach(l => paramParagraphs.push(paraText(l)));

  // ── 2 & 3. 验算部分 ──────────────────────────────────────────────────────
  const calcSections: Paragraph[] = [];
  let sectionIdx = 2;

  if (calcResult.mode === 'both' || calcResult.mode === 'weak') {
    if (calcResult.weak) {
      calcSections.push(heading2(`${sectionIdx}. 弱轴方向验算`));
      calcSections.push(...buildAxisParagraphs('weak', calcResult.weak, params));
      sectionIdx++;
    }
  }

  if (calcResult.mode === 'both' || calcResult.mode === 'strong') {
    if (calcResult.strong) {
      calcSections.push(heading2(`${sectionIdx}. 强轴方向验算`));
      calcSections.push(...buildAxisParagraphs('strong', calcResult.strong, params));
    }
  }

  // ── Overall conclusion ───────────────────────────────────────────────────
  const overallSafe = calcResult.mode === 'both'
    ? (calcResult.weak?.isSafe ?? true) && (calcResult.strong?.isSafe ?? true)
    : calcResult.isSafe;
  const conclusionPara = paraText(
    overallSafe ? '✓ 验算通过，满足要求' : '✗ 验算不通过，不满足要求',
    true,
    28,
  );

  // ── Assemble document ────────────────────────────────────────────────────
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Y撑复核验算书',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          paraText(`生成时间：${now}`),
          new Paragraph({ text: '', spacing: { after: 200 } }),
          ...paramParagraphs,
          ...calcSections,
          new Paragraph({ text: '', spacing: { after: 200 } }),
          heading2('结论'),
          conclusionPara,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Y撑验算书_${Date.now()}.docx`);
}

/**
 * 导出 PDF（保留旧接口，内部仍用 html2pdf）
 */
function ensureHtml2Pdf(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) { resolve(); return; }
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
  if (!calcResult) { alert('请先填写完整参数完成计算！'); return; }
  const element = document.getElementById('export-area');
  if (!element) { alert('找不到导出区域，请联系开发者。'); return; }
  try { await ensureHtml2Pdf(); } catch { alert('PDF 导出插件加载失败，请检查网络连接后重试。'); return; }

  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;
  const prevFlex = element.style.flex;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.flex = 'none';

  const opt = {
    margin: [12, 15, 12, 15],
    filename: `Y撑验算书_${Date.now()}.pdf`,
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
