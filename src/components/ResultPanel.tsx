import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import { CalcParams, CalcResult, CalcTarget } from '../types';
import { exportToPDF, exportToWord } from '../utils/exportUtils';

interface ResultPanelProps {
  params: CalcParams;
  calcResult: CalcResult | null;
  calcTarget: CalcTarget;
}

/**
 * 结果报告区域：KaTeX 公式渲染 + 参数列表 + 导出按钮
 */
const ResultPanel: React.FC<ResultPanelProps> = ({ params, calcResult, calcTarget }) => {
  const katexContainerRef = useRef<HTMLDivElement>(null);
  const currentTime = new Date().toLocaleString('zh-CN', { hour12: false });

  // 动态加载导出依赖
  useEffect(() => {
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // 渲染 KaTeX 公式
  useEffect(() => {
    if (!katexContainerRef.current) return;

    if (!calcResult) {
      katexContainerRef.current.innerHTML =
        '<div style="color:#9ca3af;font-size:0.875rem">请在左上方填入完整的参数以生成计算过程...</div>';
      return;
    }

    const { n, m, mu, R, I, A } = params;
    const { a_deg, h0, Nx, i_val, lambda, phi, sigma, isSafe } = calcResult;

    const safeText = isSafe
      ? '< f \\text{ (满足要求)}'
      : '\\ge f \\text{ (不满足)}';
    const h0Formula =
      calcTarget === 'weak'
        ? `h_0 &= (\\mu n / \\sin a) / 2 = (${mu} \\times ${n} / \\sin ${a_deg}^\\circ) / 2 = ${h0.toFixed(1)} \\text{ mm}`
        : `h_0' &= \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${a_deg}^\\circ = ${h0.toFixed(0)} \\text{ mm}`;
    const lambdaFormula =
      calcTarget === 'weak'
        ? `\\lambda &= h_0 / (i \\times 10) = ${h0.toFixed(1)} / ${(i_val * 10).toFixed(1)} = ${lambda.toFixed(2)}`
        : `\\lambda &= h_0' / (i \\times 10) = ${h0.toFixed(0)} / ${(i_val * 10).toFixed(1)} = ${lambda.toFixed(2)}`;

    const latexString = `
      \\begin{aligned}
      a &= \\arctan(n/m) = \\arctan(${n}/${m}) = ${a_deg}^\\circ \\\\[8pt]
      ${h0Formula} \\\\[8pt]
      N_x &= R / \\sin a = ${R} / \\sin ${a_deg}^\\circ = ${Nx.toFixed(2)} \\text{ kN} \\\\[8pt]
      i &= \\sqrt{I/A} = \\sqrt{${I}/${A}} = ${i_val.toFixed(2)} \\text{ cm} \\\\[8pt]
      ${lambdaFormula} \\\\[8pt]
      \\text{查表取 } \\lambda = ${Math.ceil(lambda)} \\rightarrow \\phi &= ${phi} \\\\[8pt]
      \\sigma &= \\frac{N_x \\times 10}{\\phi A} = \\frac{${Nx.toFixed(2)} \\times 10}{${phi} \\times ${A}} = \\mathbf{${sigma.toFixed(2)}} ${safeText}
      \\end{aligned}
    `;

    try {
      katex.render(latexString, katexContainerRef.current, {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch (e) {
      console.error('KaTeX render error', e);
    }
  }, [params, calcResult, calcTarget]);

  return (
    <section
      className="flex-1 flex flex-col transition-opacity duration-500"
      style={{ minWidth: 0 }}
    >
      {/* ── 标题行 + 导出按钮（对齐 index.txt 原版） ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          结果报告 (Result Report)
        </h2>
        <div className="flex gap-2">
          <button
            id="btn-export-word"
            onClick={() => exportToWord(calcResult)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              backgroundColor: '#2563eb', color: '#fff',
              padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
              fontSize: '0.8125rem', fontWeight: 500,
              cursor: 'pointer', border: 'none',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            导出 Word
          </button>
          <button
            id="btn-export-pdf"
            onClick={() => void exportToPDF(calcResult)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              backgroundColor: '#1e293b', color: '#fff',
              padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
              fontSize: '0.8125rem', fontWeight: 500,
              cursor: 'pointer', border: 'none',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
          >
            导出 PDF
          </button>
        </div>
      </div>

      {/* ── 供导出的报告容器（对齐 index.txt export-area 样式）── */}
      <div
        id="export-area"
        className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative"
        style={{ flex: 1 }}
      >
        {/* 报告标题 */}
        <div className="border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-xl font-bold text-center text-gray-800">Y撑复核验算书</h3>
          <p className="text-center text-xs text-gray-400 mt-1">
            验算方向: {calcTarget === 'weak' ? '弱轴' : '强轴'} | 生成时间: {currentTime}
          </p>
        </div>

        {/* 1. 已知参数 */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            1. 已知参数 (Known Parameters):
          </h4>
          {calcResult ? (
            <ul
              className="list-disc list-inside text-sm text-gray-700 ml-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}
            >
              <li>n = {params.n} mm</li>
              <li>m = {params.m} mm</li>
              <li>μ = {params.mu}</li>
              <li>R = {params.R} kN</li>
              <li>I = {params.I} cm⁴</li>
              <li>A = {params.A} cm²</li>
              <li>f = {params.f} N/mm²</li>
            </ul>
          ) : (
            <span className="text-xs text-gray-400">等待输入...</span>
          )}
        </div>

        {/* 2. 计算过程 */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            2. 计算过程 (Calculation Process):
          </h4>
          <div
            ref={katexContainerRef}
            className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto text-center py-6 min-h-[100px] flex items-center justify-center"
          />
        </div>

        {/* 3. 最终结论 */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">3. 最终结论 (Final Result):</h4>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: calcResult
                ? calcResult.isSafe ? '#16a34a' : '#dc2626'
                : '#9ca3af',
            }}
          >
            {calcResult
              ? calcResult.isSafe
                ? '✓ 验算通过，满足要求'
                : '✗ 验算不通过，不满足要求'
              : '待计算'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ResultPanel;
