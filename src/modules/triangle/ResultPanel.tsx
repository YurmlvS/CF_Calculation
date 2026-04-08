import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import { ModuleResultProps } from '../types';
import { TriangleResult } from './calculate';

const safeRenderKatex = (tex: string) => {
  try {
    return katex.renderToString(tex, { displayMode: true, throwOnError: false });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return tex;
  }
};

/**
 * 直角三角形模块 —— 结果报告面板
 */
const ResultPanel: React.FC<ModuleResultProps> = ({ params, calcResult, calcTarget }) => {
  const katexContainerRef = useRef<HTMLDivElement>(null);
  const currentTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const result = calcResult as TriangleResult | null;

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

    const { a, b, c, perimeter, area, angleA_deg, angleB_deg } = result;

    const latexString = `
      \\begin{aligned}
      &\\textbf{勾股定理 (Pythagorean Theorem):} \\\\[6pt]
      c &= \\sqrt{a^2 + b^2} = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${(a * a + b * b).toFixed(0)}} = ${c.toFixed(2)} \\text{ mm} \\\\[10pt]
      &\\textbf{周长 (Perimeter):} \\\\[6pt]
      P &= a + b + c = ${a} + ${b} + ${c.toFixed(2)} = ${perimeter.toFixed(2)} \\text{ mm} \\\\[10pt]
      &\\textbf{面积 (Area):} \\\\[6pt]
      S &= \\frac{a \\times b}{2} = \\frac{${a} \\times ${b}}{2} = ${area.toFixed(2)} \\text{ mm}^2 \\\\[10pt]
      &\\textbf{角度 (Angles):} \\\\[6pt]
      \\angle A &= \\arctan\\left(\\frac{a}{b}\\right) = \\arctan\\left(\\frac{${a}}{${b}}\\right) = ${angleA_deg.toFixed(2)}^\\circ \\\\[6pt]
      \\angle B &= 90^\\circ - \\angle A = 90^\\circ - ${angleA_deg.toFixed(2)}^\\circ = ${angleB_deg.toFixed(2)}^\\circ \\\\[6pt]
      \\angle C &= 90^\\circ
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

  // Word 导出分段公式
  const wordExportHTMLs = useMemo(() => {
    if (!result) return null;
    const { a, b, c, perimeter, area, angleA_deg, angleB_deg } = result;

    return {
      eqC: safeRenderKatex(`c = \\sqrt{a^2 + b^2} = \\sqrt{${a}^2 + ${b}^2} = ${c.toFixed(2)} \\text{ mm}`),
      eqPerimeter: safeRenderKatex(`P = a + b + c = ${a} + ${b} + ${c.toFixed(2)} = ${perimeter.toFixed(2)} \\text{ mm}`),
      eqArea: safeRenderKatex(`S = \\frac{a \\times b}{2} = \\frac{${a} \\times ${b}}{2} = ${area.toFixed(2)} \\text{ mm}^2`),
      eqAngleA: safeRenderKatex(`\\angle A = \\arctan(a/b) = \\arctan(${a}/${b}) = ${angleA_deg.toFixed(2)}^\\circ`),
      eqAngleB: safeRenderKatex(`\\angle B = 90^\\circ - ${angleA_deg.toFixed(2)}^\\circ = ${angleB_deg.toFixed(2)}^\\circ`),
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
          <h3 className="text-xl font-bold text-center text-gray-800">直角三角形勾股定理计算书</h3>
          <p className="text-center text-xs text-gray-400 mt-1">
            计算目标: 周长 + 面积 | 生成时间: {currentTime}
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
              <li>直角边 a = {params.a} mm</li>
              <li>直角边 b = {params.b} mm</li>
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
                斜边计算（勾股定理）：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqC }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                周长计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqPerimeter }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                面积计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqArea }} />

              <p style={{ margin: '12px 0 4px 0', fontSize: '11pt', color: '#000000' }}>
                角度计算：
              </p>
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqAngleA }} />
              <div dangerouslySetInnerHTML={{ __html: wordExportHTMLs.eqAngleB }} />
            </div>
          )}
        </div>

        {/* 3. 计算结果汇总 */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">3. 计算结果 (Results):</h4>
          {result ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.5rem',
                border: '1px solid #bbf7d0',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>斜边 c</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#15803d' }}>
                  {result.c.toFixed(2)} mm
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#eff6ff',
                borderRadius: '0.5rem',
                border: '1px solid #bfdbfe',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600 }}>周长 P</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1d4ed8' }}>
                  {result.perimeter.toFixed(2)} mm
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fefce8',
                borderRadius: '0.5rem',
                border: '1px solid #fde68a',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#ca8a04', fontWeight: 600 }}>面积 S</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a16207' }}>
                  {result.area.toFixed(2)} mm²
                </div>
              </div>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#faf5ff',
                borderRadius: '0.5rem',
                border: '1px solid #e9d5ff',
              }}>
                <div style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600 }}>角度</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#6d28d9' }}>
                  ∠A={result.angleA_deg.toFixed(1)}° ∠B={result.angleB_deg.toFixed(1)}°
                </div>
              </div>
            </div>
          ) : (
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                color: '#9ca3af',
              }}
            >
              待计算
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResultPanel;
