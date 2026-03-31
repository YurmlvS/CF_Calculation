import { CalcParams, CalcResult, CalcTarget } from '../types';

/** 导出 PDF（依赖 html2pdf.js CDN） */
export function exportToPDF(calcResult: CalcResult | null): void {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }
  const element = document.getElementById('export-area');
  if (!element || !window.html2pdf) return;

  // 克隆节点以避免滚动条截断或受父级宽度挤压
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '800px';
  clone.style.position = 'absolute';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.zIndex = '-9999';
  clone.style.backgroundColor = '#ffffff';

  // 移除 KaTeX 公式在截屏时被横向截断的 overflow 类
  const formulaDiv = clone.querySelector('.overflow-x-auto');
  if (formulaDiv) {
    formulaDiv.classList.remove('overflow-x-auto');
    (formulaDiv as HTMLElement).style.overflow = 'visible';
    (formulaDiv as HTMLElement).style.whiteSpace = 'normal';
  }

  document.body.appendChild(clone);

  const opt = {
    margin: 15,
    filename: `Y撑验算书_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 800 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: 'avoid-all' },
  };

  window.html2pdf()
    .set(opt)
    .from(clone)
    .save()
    .then(() => {
      document.body.removeChild(clone);
    });
}

/** 导出 Word (.doc) */
export function exportToWord(calcResult: CalcResult | null): void {
  if (!calcResult) {
    alert('请先填写完整参数完成计算！');
    return;
  }
  const element = document.getElementById('export-area');
  if (!element) return;

  const clone = element.cloneNode(true) as HTMLElement;
  const formulaDiv = clone.querySelector('.overflow-x-auto');
  if (formulaDiv) {
    formulaDiv.classList.remove('overflow-x-auto');
    (formulaDiv as HTMLElement).style.overflow = 'visible';
  }

  const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Calculation Report</title></head><body>`;
  const footer = '</body></html>';

  const sourceHTML = header + clone.innerHTML + footer;
  const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Y撑验算书_${Date.now()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
