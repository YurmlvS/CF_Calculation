import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import { ModuleResultProps } from '../types';
import { YBraceResult } from './calculate';

const safeRenderKatex = (tex: string) => {
  try {
    return katex.renderToString(tex, { displayMode: true, throwOnError: false });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return tex;
  }
};

/**
 * Y撑模块 —— 结果报告面板
 */
const ResultPanel: React.FC<ModuleResultProps> = ({ params, calcResult, calcTarget }) => {
  const katexContainerRef = useRef<HTMLDivElement>(null);
  const currentTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const result = calcResult as YBraceResult | null;

  useEffect(() => {
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
    }
  }, []);

  // KaTeX 网页渲染
  useEffect(() => {
    if (!katexContainerRef.current) return;

    if (!result) {
      katexContainerRef.current.innerHTML =
        '<div style="color:#9ca3af;font-size:0.875rem">请填入完整的参数以生成计算过程...</div>';
      return;
    }

    const { n, m, mu, R, I, A } = params;
    const { a_deg, h0, Nx, i_val, lambda, phi, sigma, isSafe } = result;

    const safeText = isSafe
      ? '< f \\text{ (满足要求)}'
      : '\\ge f \\text{ (不满足)}';

    const h0Formula = calcTarget === 'weak'
      ? `h_0 &= (\\mu n / \\sin a) / 2 = (${mu} \\times ${n} / \\sin ${a_deg}^\\circ) / 2 = ${h0.toFixed(1)} \\text{ mm}`
      : `h_0' &= \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${a_deg}^\\circ = ${h0.toFixed(0)} \\text{ mm}`;

    const lambdaFormula = calcTarget === 'weak'
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
  }, [params, result, calcTarget]);

  // Word 导出的分段公式 HTML
  const wordExportHTMLs = useMemo(() => {
    if (!result) return null;
    const { n, m, mu, R, I, A } = params;
    const { a_deg, h0, Nx, i_val, lambda, phi, sigma, isSafe } = result;

    const safeText = isSafe ? '< f \\text{ (满足要求)}' : '\\ge f \\text{ (不满足)}';

    const eqAngle = `a = \\arctan(n/m) = \\arctan(${n}/${m}) = ${a_deg}^\\circ`;
    const eqH0 = calcTarget === 'weak'
      ? `h_0 = (\\mu n / \\sin a) / 2 = (${mu} \\times ${n} / \\sin ${a_deg}^\\circ) / 2 = ${h0.toFixed(1)} \\text{ mm}`
      : `h_0' = \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${a_deg}^\\circ = ${h0.toFixed(0)} \\text{ mm}`;
    const eqNx = `N_x = R / \\sin a = ${R} / \\sin ${a_deg}^\\circ = ${Nx.toFixed(2)} \\text{ kN}`;
    const eqI = `i = \\sqrt{I/A} = \\sqrt{${I}/${A}} = ${i_val.toFixed(2)} \\text{ cm}`;
    const eqLambda = calcTarget === 'weak'
      ? `\\lambda = h_0 / (i \\times 10) = ${h0.toFixed(1)} / ${(i_val * 10).toFixed(1)} = ${lambda.toFixed(2)}`
      : `\\lambda = h_0' / (i \\times 10) = ${h0.toFixed(0)} / ${(i_val * 10).toFixed(1)} = ${lambda.toFixed(2)}`;
    const eqPhi = `\\text{查表取 } \\lambda = ${Math.ceil(lambda)} \\rightarrow \\phi = ${phi}`;
    const eqSigma = `\\sigma = \\frac{N_x \\times 10}{\\phi A} = \\frac{${Nx.toFixed(2)} \\times 10}{${phi} \\times ${A}} = \\mathbf{${sigma.toFixed(2)}} ${safeText}`;

    return {
      eqAngle: safeRenderKatex(eqAngle),
      eqH0: safeRenderKatex(eqH0),
      eqNx: safeRenderKatex(eqNx),
      eqI: safeRenderKatex(eqI),
      eqLambda: safeRenderKatex(eqLambda),
      eqPhi: safeRenderKatex(eqPhi),
      eqSigma: safeRenderKatex(eqSigma),
    };
  }, [params, result, calcTarget]);

  return (
    <section
      className="flex-1 flex flex-col transition-opacity duration-500"
      style={{ minWidth: 0 }}
    >
      {/* ── 供导出的报告容器 ── */}
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
          {result ? (
            <ul
              className="list-disc list-inside text-sm text-gray-700 ml-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}
            >
              <li>n = {params.n} mm</li>
              <li>m = {params.m} mm</li>
              <li>μ = {params.mu}</li>
              <li>R(下撑杆件支座力) = {params.R} kN</li>
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

          <div id="ui-calc-process">
            <div
              ref={katexContainerRef}
              className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto text-center py-6 min-h-[100px] flex items-center justify-center"
            />
          </div>

          {result && wordExportHTMLs && (
            <div id="word-calc-process" style={{ display: 'none' }}>
              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                下撑杆件角度计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqAngle }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                下撑杆件弱轴方向计算长度计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqH0 }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                下撑杆件轴向力：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqNx }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                下撑杆长细比：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqI }} />
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqLambda }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                查《钢结构设计标准》GB50017-2017表：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqPhi }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                轴心受压稳定性计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqSigma }} />
            </div>
          )}
        </div>

        {/* 3. 最终结论 */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">3. 最终结论 (Final Result):</h4>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: result
                ? result.isSafe ? '#16a34a' : '#dc2626'
                : '#9ca3af',
            }}
          >
            {result
              ? result.isSafe
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
