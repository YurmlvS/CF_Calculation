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

// ─── 配置常量 ─────────────────────────────────────────────────────────────
// docx 中的字体大小单位为半磅 (half-point)
const FONT_SIZES = {
  TITLE: 44,      // 22pt (二号) - 主标题
  HEADING_2: 24,  // 14pt (四号) - 章节标题
  NORMAL: 24,     // 12pt (小四) - 正文
  FORMULA: 24,    // 12pt (小四) - 公式
};

const FONTS = {
  CHINESE: 'Times New Roman',         // 正文中文字体
  ENGLISH: 'Times New Roman', // 正文英文字体
  HEADING: '黑体',         // 标题字体
  MATH: 'Cambria Math',   // 公式字体
};

// ─── KaTeX → plain text fallback for Word ───────────────────────────────────

function paraText(text: string, bold = false, size = FONT_SIZES.NORMAL): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ 
        text, 
        bold, 
        size,
        // 可以针对单个 TextRun 覆盖字体设置
        font: {
          ascii: FONTS.ENGLISH,
          eastAsia: FONTS.CHINESE,
          hint: 'eastAsia',
        }
      })
    ],
    spacing: { after: 120 }, // 调整段后间距
  });
}

function paraFormula(formula: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ 
        text: formula, 
        size: FONT_SIZES.FORMULA, 
        font: FONTS.MATH, // 公式专门使用数学字体
        italics: false     // 公式通常用斜体
      })
    ],
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    // 注意：标题的具体字体和大小现在在 Document 的 styles 属性中统一配置
  });
}

/** Convert Konva stage to PNG base64 string */
async function getKonvaImageBytes(): Promise<Uint8Array | null> {
  try {
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

  //常规输出方式
  if (axis === 'weak') {
    const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);
    paras.push(
      paraText('下撑杆件角度计算：'),
      paraFormula(`a = arctan(n/m) = arctan(${n}/${m}) = ${r.a_deg}°`),
      paraText('下撑杆件弱轴方向计算长度计算：'),
      paraFormula(`h₀ = max[(μn/sin a)·k, (μn/sin a)·(1-k)] = max[${full}×${kSnap}, ${full}×${(1-kSnap).toFixed(1)}] = ${r.h0.toFixed(1)} mm`),
      paraText('下撑杆件支座力：'),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆件轴向力：'),
      paraFormula(`Nx = R/sin a = ${R}/sin${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText('下撑杆弱轴方向回转半径：'),
      paraFormula(`i = √(I/A) = √(${I}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：'),
      paraFormula(`λ = h₀/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`),
      paraText('查《钢结构设计标准》GB50017-2017表D得，'),
      paraFormula(`φ = ${r.phi}`),
      paraText('轴心受压稳定性计算：'),
      paraFormula(`σ = Nx/(φA) = (${r.Nx.toFixed(2)}×10)/(${r.phi}×${A}) = ${r.sigma.toFixed(2)} N/mm² ${safeStr}`),
    );
  } else {
    paras.push(
      paraText('下撑杆件角度计算：'),
      paraFormula(`a = arctan(n/m) = arctan(${n}/${m}) = ${r.a_deg}°`),
      paraText('下撑杆件强轴方向计算长度计算：'),
      paraFormula(`h₀' = μn/sin a = ${mu}×${n}/sin${r.a_deg}° = ${r.h0.toFixed(0)} mm`),
      paraText('下撑杆件支座力：'),
      paraFormula(`R = ${R} kN`),
      paraText('下撑杆件轴向力：'),
      paraFormula(`Nx = R/sin a = ${R}/sin${r.a_deg}° = ${r.Nx.toFixed(2)} kN`),
      paraText('下撑杆强轴方向回转半径：'),
      paraFormula(`i' = √(I'/A) = √(${IPrime}/${A}) = ${r.i_val.toFixed(2)} cm`),
      paraText('下撑杆长细比：'),
      paraFormula(`λ = μh₀'/i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`),
      paraText('查《钢结构设计标准》GB50017-2017表D得，'),
      paraFormula(`φ = ${r.phi}`),
      paraText('轴心受压稳定性计算：'),
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
  const imgBytes = await getKonvaImageBytes();

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
            // 【修改这里】：调整宽(width)和高(height)即可改变图片尺寸，按你的需要填写像素值
            transformation: { width: 400, height: 600 }, 
          }),
        ],
        // 【修改这里】：将 CENTER 改为 LEFT 实现左对齐
        alignment: AlignmentType.LEFT,
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

  const overallSafe = calcResult.mode === 'both'
    ? (calcResult.weak?.isSafe ?? true) && (calcResult.strong?.isSafe ?? true)
    : calcResult.isSafe;
  const conclusionPara = paraText(
    overallSafe ? '✓ 验算通过，满足要求' : '✗ 验算不通过，不满足要求',
    true,
    FONT_SIZES.HEADING_2,
  );

  // ── 设置全局文档样式 ────────────────────────────────────────────────────
  const doc = new Document({
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
            size: FONT_SIZES.TITLE, // 一级标题 (这里用作文档主标题)
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
            size: FONT_SIZES.HEADING_2, // 二级标题
            bold: false,
            font: FONTS.HEADING,
          },
          paragraph: {
            spacing: { before: 240, after: 120 },
          },
        },
      ],
    },
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Y撑复核验算书',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          paraText(`生成时间：${now}`, false, 21), // 五号字
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

// ─── html2canvas 加载 & KaTeX 公式截图辅助 ──────────────────────────────────

/** 确保 html2canvas 已加载（独立于 html2pdf） */
function ensureHtml2Canvas(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).html2canvas) { resolve(); return; }
    const existing = document.querySelector('script[src*="html2canvas"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('html2canvas 加载失败')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('html2canvas 加载失败'));
    document.head.appendChild(script);
  });
}

/** 将 KaTeX HTML 字符串渲染为 PNG 字节（通过临时 DOM + html2canvas） */
async function katexHtmlToPng(
  katexHtml: string,
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  // 创建临时容器
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;background:#fff;padding:12px 16px;font-size:14px;z-index:-1;';
  container.innerHTML = katexHtml;
  document.body.appendChild(container);

  // 确保 KaTeX CSS 已加载
  if (!document.querySelector('link[href*="katex"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(link);
    await new Promise(r => setTimeout(r, 500)); // 等待字体加载
  }

  try {
    await new Promise(r => setTimeout(r, 100)); // 确保布局完成
    const canvas = await (window as any).html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    });
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return {
      data: bytes,
      width: Math.round(canvas.width / 2),   // 还原 scale=2 的实际尺寸
      height: Math.round(canvas.height / 2),
    };
  } catch (e) {
    console.error('KaTeX→PNG 失败', e);
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 构建单轴计算段落（LaTeX 版，公式用 KaTeX→PNG 图片）
 */
async function buildAxisParagraphsLatex(
  axis: 'weak' | 'strong',
  r: YBraceAxisResult,
  params: Record<string, number | ''>,
): Promise<Paragraph[]> {
  // 动态引入 katex（与 ResultPanel 保持一致）
  const katex = (await import('katex')).default;

  const safeRender = (tex: string) => {
    try {
      return katex.renderToString(tex, { displayMode: true, throwOnError: false });
    } catch { return tex; }
  };

  const { n, m, mu, R, I, IPrime, A, k } = params;
  const kVal = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;
  const safeText = r.isSafe ? '< f \\text{ (满足要求)}' : '\\ge f \\text{ (不满足)}';

  // 生成与 ResultPanel 完全一致的 LaTeX 公式
  const eqAngle = `a = \\arctan(n/m) = \\arctan(${n}/${m}) = ${r.a_deg}^\\circ`;
  const eqNx = `N_x = R / \\sin a = ${R} / \\sin ${r.a_deg}^\\circ = ${r.Nx.toFixed(2)}\\text{ kN}`;
  const eqPhi = `\\text{查表取 } \\lambda = ${Math.ceil(r.lambda)} \\rightarrow \\phi = ${r.phi}`;
  const eqSigma = `\\sigma = \\frac{N_x \\times 10}{\\phi A} = \\frac{${r.Nx.toFixed(2)} \\times 10}{${r.phi} \\times ${A}} = \\mathbf{${r.sigma.toFixed(2)}} ${safeText}`;

  let eqH0: string, eqI: string, eqLambda: string;
  let h0Label: string, iLabel: string;

  if (axis === 'weak') {
    const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);
    eqH0 = `h_0 = \\max\\!\\left[\\frac{\\mu n}{\\sin a}k,\\ \\frac{\\mu n}{\\sin a}(1{-}k)\\right] = \\max[${full}\\times${kSnap},\\ ${full}\\times${(1 - kSnap).toFixed(1)}] = ${r.h0.toFixed(1)}\\text{ mm}`;
    eqI = `i = \\sqrt{I/A} = \\sqrt{${I}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm}`;
    eqLambda = `\\lambda = h_0/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`;
    h0Label = '下撑杆件弱轴方向计算长度计算：';
    iLabel = '下撑杆弱轴方向回转半径：';
  } else {
    eqH0 = `h_0' = \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${r.a_deg}^\\circ = ${r.h0.toFixed(0)}\\text{ mm}`;
    eqI = `i' = \\sqrt{I'/A} = \\sqrt{${IPrime}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm}`;
    eqLambda = `\\lambda = \\mu h_0' / i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`;
    h0Label = '下撑杆件强轴方向计算长度计算：';
    iLabel = '下撑杆强轴方向回转半径：';
  }

  // 按顺序：文字说明 → 公式截图
  const steps: { label: string; tex: string }[] = [
    { label: '下撑杆件角度计算：', tex: eqAngle },
    { label: h0Label, tex: eqH0 },
    { label: '下撑杆件支座力：', tex: eqNx },
    { label: iLabel, tex: eqI },
    { label: '下撑杆长细比：', tex: eqLambda },
    { label: '查《钢结构设计标准》GB50017-2017表D得，', tex: eqPhi },
    { label: '轴心受压稳定性计算：', tex: eqSigma },
  ];

  const paras: Paragraph[] = [];

  for (const step of steps) {
    // 文字标签
    paras.push(paraText(step.label));

    // 渲染 KaTeX → HTML → PNG → ImageRun
    const html = safeRender(step.tex);
    const img = await katexHtmlToPng(html);
    if (img) {
      // 限制最大宽度为 500px，等比缩放
      const maxW = 500;
      let w = img.width;
      let h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }

      paras.push(
        new Paragraph({
          children: [
            new ImageRun({ type: 'png', data: img.data, transformation: { width: w, height: h } }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 40, after: 120 },
        }),
      );
    } else {
      // 降级：无法截图时用纯文本
      paras.push(paraFormula(step.tex));
    }
  }

  return paras;
}

/** 导出 LaTeX 版 (.docx — 公式以 KaTeX 渲染图片嵌入) */
export async function exportToLaTeX(
  calcResult: YBraceResult | null,
  params: Record<string, number | ''>,
  _calcTarget: string,
): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }

  // 加载 html2canvas
  try {
    await ensureHtml2Canvas();
  } catch {
    alert('html2canvas 加载失败，请检查网络连接后重试。');
    return;
  }

  const now = new Date().toLocaleString('zh-CN', { hour12: false });
  const imgBytes = await getKonvaImageBytes();

  const { n, m, mu, R, I, IPrime, A, k, f } = params;
  const kVal = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;

  // ── 1. 计算参数 ──
  const paramParagraphs: Paragraph[] = [heading2('1. 计算参数')];

  if (imgBytes) {
    paramParagraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: 'png', data: imgBytes,
            transformation: { width: 400, height: 600 },
          }),
        ],
        alignment: AlignmentType.LEFT,
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

  // ── 2/3. 计算过程（公式用 KaTeX 截图） ──
  const calcSections: Paragraph[] = [];
  let sectionIdx = 2;

  if (calcResult.mode === 'both' || calcResult.mode === 'weak') {
    if (calcResult.weak) {
      calcSections.push(heading2(`${sectionIdx}. 弱轴方向验算`));
      calcSections.push(...await buildAxisParagraphsLatex('weak', calcResult.weak, params));
      sectionIdx++;
    }
  }

  if (calcResult.mode === 'both' || calcResult.mode === 'strong') {
    if (calcResult.strong) {
      calcSections.push(heading2(`${sectionIdx}. 强轴方向验算`));
      calcSections.push(...await buildAxisParagraphsLatex('strong', calcResult.strong, params));
    }
  }

  // ── 结论 ──
  const overallSafe = calcResult.mode === 'both'
    ? (calcResult.weak?.isSafe ?? true) && (calcResult.strong?.isSafe ?? true)
    : calcResult.isSafe;
  const conclusionPara = paraText(
    overallSafe ? '✓ 验算通过，满足要求' : '✗ 验算不通过，不满足要求',
    true,
    FONT_SIZES.HEADING_2,
  );

  // ── 生成 .docx ──
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: FONT_SIZES.NORMAL,
            font: { ascii: FONTS.ENGLISH, eastAsia: FONTS.CHINESE },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: FONT_SIZES.TITLE, bold: true, font: FONTS.HEADING },
          paragraph: { spacing: { before: 240, after: 240 } },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: FONT_SIZES.HEADING_2, bold: false, font: FONTS.HEADING },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      ],
    },
    sections: [{
      children: [
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
        conclusionPara,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Y撑验算书_LaTeX版_${Date.now()}.docx`);
}

/** 导出 PDF（保留旧接口） */
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