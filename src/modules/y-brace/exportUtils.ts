import { YBraceResult } from './calculate';

/**
 * 确保 html2pdf.js 已加载
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
 */
export async function exportToPDF(calcResult: YBraceResult | null): Promise<void> {
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

  const prevOverflow = element.style.overflow;
  const prevMaxHeight = element.style.maxHeight;
  const prevFlex = element.style.flex;
  element.style.overflow = 'visible';
  element.style.maxHeight = 'none';
  element.style.flex = 'none';

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
      windowWidth: document.documentElement.scrollWidth,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await window.html2pdf().set(opt).from(element).save();
  } finally {
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
export function exportToWord(calcResult: YBraceResult | null): void {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }
  const element = document.getElementById('export-area');
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;

  const uiProcess = clone.querySelector('#ui-calc-process');
  if (uiProcess && uiProcess.parentNode) {
    uiProcess.parentNode.removeChild(uiProcess);
  }

  const wordProcess = clone.querySelector('#word-calc-process') as HTMLElement;
  if (wordProcess) {
    wordProcess.style.display = 'block';
  }

  const formulaDiv = clone.querySelector<HTMLElement>('.overflow-x-auto');
  if (formulaDiv) {
    formulaDiv.style.overflow = 'visible';
    formulaDiv.style.whiteSpace = 'normal';
  }

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
    xmlns:w='urn:schemas-microsoft-com:office:word'
    xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Y撑复核验算书</title>
      <style>
        body{ font-family: 'SimSun', Arial, sans-serif; font-size:11pt; }
      </style>
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
