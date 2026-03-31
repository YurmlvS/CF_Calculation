import { CalcResult } from '../types';

/**
 * 确保 html2pdf.js 已加载，返回 Promise
 */
function ensureHtml2Pdf(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.html2pdf) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src*="html2pdf"]'
    ) as HTMLScriptElement | null;
    if (existing) {
      // 脚本已插入但尚未加载完，等待它
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('html2pdf.js 加载失败'))
      );
      return;
    }
    const script = document.createElement('script');
    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('html2pdf.js 加载失败'));
    document.head.appendChild(script);
  });
}

/**
 * 导出 PDF
 * 修复要点：
 *  1. 操作原始 element，先把 overflow 约束临时去除，截图后还原
 *  2. 等 html2pdf 加载完毕再执行，避免 window.html2pdf 为 undefined
 *  3. html2canvas windowWidth 与 element 实际渲染宽度一致
 */
export async function exportToPDF(calcResult: CalcResult | null): Promise<void> {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }

  const element = document.getElementById('export-area');
  if (!element) {
    alert('找不到导出区域，请联系开发者。');
    return;
  }

  try {
    await ensureHtml2Pdf();
  } catch {
    alert('PDF 导出插件加载失败，请检查网络连接后重试。');
    return;
  }

  // 临时解除容器的 overflow / flex 约束，避免内容被截断
  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;
  const prevFlex = element.style.flex;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.flex = 'none';

  // 同样处理公式区（KaTeX 内部的 overflow-x-auto 可能截断公式）
  const formulaDiv = element.querySelector<HTMLElement>('.overflow-x-auto');
  let prevFormulaOverflow = '';
  if (formulaDiv) {
    prevFormulaOverflow = formulaDiv.style.overflow;
    formulaDiv.style.overflow = 'visible';
    formulaDiv.style.whiteSpace = 'normal';
  }

  const opt = {
    margin: [12, 15, 12, 15],
    filename: `Y撑验算书_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      // 告诉 html2canvas 使用元素的实际渲染宽度
      windowWidth: document.documentElement.scrollWidth,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await window.html2pdf().set(opt).from(element).save();
  } finally {
    // 还原样式
    element.style.overflow = prevOverflow;
    element.style.maxHeight = prevMaxHeight;
    element.style.flex = prevFlex;
    if (formulaDiv) {
      formulaDiv.style.overflow = prevFormulaOverflow;
      formulaDiv.style.whiteSpace = '';
    }
  }
}

/** 导出 Word (.doc) */
export function exportToWord(calcResult: CalcResult | null): void {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }
  const element = document.getElementById('export-area');
  if (!element) return;

  // 克隆 DOM 用于 Word 输出（Word 导出不依赖截图，克隆安全）
  const clone = element.cloneNode(true) as HTMLElement;
  const formulaDiv = clone.querySelector<HTMLElement>('.overflow-x-auto');
  if (formulaDiv) {
    formulaDiv.style.overflow = 'visible';
    formulaDiv.style.whiteSpace = 'normal';
  }

  // 内嵌 KaTeX 字体样式链接，保证 Word 打开时样式尽量保留
  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word'
    xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Y撑复核验算书</title>
      <style>body{font-family:Arial,sans-serif;font-size:11pt;}</style>
    </head><body>`;
  const footer = '</body></html>';

  const sourceHTML = header + clone.outerHTML + footer;
  const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Y撑验算书_${Date.now()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
