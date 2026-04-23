import React, { useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import { ModuleResultProps } from '../types';
import { YBraceResult, YBraceAxisResult } from './calculate';

const safeRenderKatex = (tex: string) => {
  try {
    return katex.renderToString(tex, { displayMode: true, throwOnError: false });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return tex;
  }
};

/**
 * 渲染单轴计算过程的 LaTeX aligned 字符串
 */
function buildAxisLatex(
  axis: 'weak' | 'strong',
  r: YBraceAxisResult,
  params: Record<string, number | ''>,
): string {
  const { n, m, mu, R, I, IPrime, A, k, f } = params;
  const kVal = k === '' ? 0.5 : Number(k);
  const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;

  const safeText = r.isSafe
    ? `< f = ${f} \\text{ (满足要求)}`
    : `\\ge f = ${f} \\text{ (不满足)}`;

  if (axis === 'weak') {
    const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);
    return `
      \\begin{aligned}
      a &= \\arctan(n/m) = \\arctan(${n}/${m}) = ${r.a_deg}^\\circ \\\\[8pt]
      h_0 &= \\max\\!\\left[\\frac{\\mu n}{\\sin a}k,\\ \\frac{\\mu n}{\\sin a}(1-k)\\right] = \\max\\!\\left[${full}\\times${kSnap},\\ ${full}\\times${(1 - kSnap).toFixed(1)}\\right] = ${r.h0.toFixed(1)}\\text{ mm} \\\\[8pt]
      N_x &= R / \\sin a = ${R} / \\sin ${r.a_deg}^\\circ = ${r.Nx.toFixed(2)}\\text{ kN} \\\\[8pt]
      i &= \\sqrt{I/A} = \\sqrt{${I}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm} \\\\[8pt]
      \\lambda &= h_0/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)} \\\\[8pt]
      \\text{查表取 } \\lambda = ${Math.ceil(r.lambda)} &\\rightarrow \\phi = ${r.phi} \\\\[8pt]
      \\sigma &= \\frac{N_x \\times 10}{\\phi A} = \\frac{${r.Nx.toFixed(2)} \\times 10}{${r.phi} \\times ${A}} = \\mathbf{${r.sigma.toFixed(2)}} ${safeText}
      \\end{aligned}
    `;
  } else {
    return `
      \\begin{aligned}
      a &= \\arctan(n/m) = \\arctan(${n}/${m}) = ${r.a_deg}^\\circ \\\\[8pt]
      h_0' &= \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${r.a_deg}^\\circ = ${r.h0.toFixed(0)}\\text{ mm} \\\\[8pt]
      N_x &= R / \\sin a = ${R} / \\sin ${r.a_deg}^\\circ = ${r.Nx.toFixed(2)}\\text{ kN} \\\\[8pt]
      i' &= \\sqrt{I'/A} = \\sqrt{${IPrime}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm} \\\\[8pt]
      \\lambda &= \\mu h_0' / i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)} \\\\[8pt]
      \\text{查表取 } \\lambda = ${Math.ceil(r.lambda)} &\\rightarrow \\phi = ${r.phi} \\\\[8pt]
      \\sigma &= \\frac{N_x \\times 10}{\\phi A} = \\frac{${r.Nx.toFixed(2)} \\times 10}{${r.phi} \\times ${A}} = \\mathbf{${r.sigma.toFixed(2)}} ${safeText}
      \\end{aligned}
    `;
  }
}

/**
 * Y撑模块 —— 结果报告面板
 */
const ResultPanel: React.FC<ModuleResultProps> = ({ params, calcResult, calcTarget }) => {
  const weakKatexRef = useRef<HTMLDivElement>(null);
  const strongKatexRef = useRef<HTMLDivElement>(null);
  const currentTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const result = calcResult as YBraceResult | null;

  // KaTeX 网页渲染
  useEffect(() => {
    const renderAxis = (ref: React.RefObject<HTMLDivElement>, axis: 'weak' | 'strong', r: YBraceAxisResult) => {
      if (!ref.current) return;
      try {
        katex.render(buildAxisLatex(axis, r, params), ref.current, {
          displayMode: true, throwOnError: false, strict: false,
        });
      } catch (e) {
        console.error('KaTeX render error', e);
      }
    };

    if (!result) {
      [weakKatexRef, strongKatexRef].forEach(ref => {
        if (ref.current)
          ref.current.innerHTML = '<div style="color:#9ca3af;font-size:0.875rem">请填入完整的参数以生成计算过程...</div>';
      });
      return;
    }

    if (result.mode === 'both') {
      if (result.weak) renderAxis(weakKatexRef, 'weak', result.weak);
      if (result.strong) renderAxis(strongKatexRef, 'strong', result.strong);
    } else if (result.mode === 'weak' && result.weak) {
      renderAxis(weakKatexRef, 'weak', result.weak);
    } else if (result.mode === 'strong' && result.strong) {
      renderAxis(strongKatexRef, 'strong', result.strong);
    }
  }, [params, result, calcTarget]);

  // Word 导出的分段公式 HTML
  const wordExportHTMLs = useMemo(() => {
    if (!result) return null;

    const buildAxisEquations = (axis: 'weak' | 'strong', r: YBraceAxisResult) => {
      const { n, m, mu, R, I, IPrime, A, k, f } = params;
      const kVal = k === '' ? 0.5 : Number(k);
      const kSnap = Math.round(Math.min(0.9, Math.max(0.1, kVal)) * 10) / 10;

      const safeText = r.isSafe ? `< f = ${f} \\text{ (满足要求)}` : `\\ge f = ${f} \\text{ (不满足)}`;
      const eqAngle = `a = \\arctan(n/m) = \\arctan(${n}/${m}) = ${r.a_deg}^\\circ`;
      const eqNx = `N_x = R / \\sin a = ${R} / \\sin ${r.a_deg}^\\circ = ${r.Nx.toFixed(2)}\\text{ kN}`;
      const eqPhi = `\\text{查表取 } \\lambda = ${Math.ceil(r.lambda)} \\rightarrow \\phi = ${r.phi}`;
      const eqSigma = `\\sigma = \\frac{N_x \\times 10}{\\phi A} = \\frac{${r.Nx.toFixed(2)} \\times 10}{${r.phi} \\times ${A}} = \\mathbf{${r.sigma.toFixed(2)}} ${safeText}`;

      if (axis === 'weak') {
        const full = (Number(mu) * Number(n) / r.sin_a).toFixed(1);
        const eqH0 = `h_0 = \\max\\!\\left[\\frac{\\mu n}{\\sin a}k,\\ \\frac{\\mu n}{\\sin a}(1{-}k)\\right] = \\max[${full}\\times${kSnap},\\ ${full}\\times${(1 - kSnap).toFixed(1)}] = ${r.h0.toFixed(1)}\\text{ mm}`;
        const eqI = `i = \\sqrt{I/A} = \\sqrt{${I}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm}`;
        const eqLambda = `\\lambda = h_0/i = ${r.h0.toFixed(1)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`;
        return { eqAngle, eqH0, eqNx, eqI, eqLambda, eqPhi, eqSigma };
      } else {
        const eqH0 = `h_0' = \\mu n / \\sin a = ${mu} \\times ${n} / \\sin ${r.a_deg}^\\circ = ${r.h0.toFixed(0)}\\text{ mm}`;
        const eqI = `i' = \\sqrt{I'/A} = \\sqrt{${IPrime}/${A}} = ${r.i_val.toFixed(2)}\\text{ cm}`;
        const eqLambda = `\\lambda = \\mu h_0' / i' = ${r.h0.toFixed(0)} / ${(r.i_val * 10).toFixed(2)} = ${r.lambda.toFixed(2)}`;
        return { eqAngle, eqH0, eqNx, eqI, eqLambda, eqPhi, eqSigma };
      }
    };

    const renderAll = (axis: 'weak' | 'strong', r: YBraceAxisResult) => {
      const eqs = buildAxisEquations(axis, r);
      return {
        eqAngle: safeRenderKatex(eqs.eqAngle),
        eqH0: safeRenderKatex(eqs.eqH0),
        eqNx: safeRenderKatex(eqs.eqNx),
        eqI: safeRenderKatex(eqs.eqI),
        eqLambda: safeRenderKatex(eqs.eqLambda),
        eqPhi: safeRenderKatex(eqs.eqPhi),
        eqSigma: safeRenderKatex(eqs.eqSigma),
      };
    };

    const weak = result.weak ? renderAll('weak', result.weak) : null;
    const strong = result.strong ? renderAll('strong', result.strong) : null;
    return { weak, strong };
  }, [params, result, calcTarget]);

  const showWeak = result && (result.mode === 'both' || result.mode === 'weak');
  const showStrong = result && (result.mode === 'both' || result.mode === 'strong');

  /** Render axis calculation section */
  type AxisHtmls = { eqAngle: string; eqH0: string; eqNx: string; eqI: string; eqLambda: string; eqPhi: string; eqSigma: string } | null;
  const renderAxisSection = (
    title: string,
    sectionNum: number,
    axisKey: 'weak' | 'strong',
    katexRef: React.RefObject<HTMLDivElement>,
    axisResult: YBraceAxisResult | undefined,
    wordHtmls: AxisHtmls,
  ) => {
    const h0Label = axisKey === 'weak' ? '下撑杆件弱轴方向计算长度计算：' : '下撑杆件强轴方向计算长度计算：';
    return (
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-2">
          {sectionNum}. {title}
        </h4>
        {axisResult ? (
          <div
            className="text-xs text-gray-500 mb-1 flex gap-4"
            style={{ display: 'flex', gap: '1rem' }}
          >
            <span>λ = {axisResult.lambda.toFixed(2)}</span>
            <span>φ = {axisResult.phi}</span>
            <span>σ = {axisResult.sigma.toFixed(2)} N/mm²</span>
            <span style={{ color: axisResult.isSafe ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
              {axisResult.isSafe ? '✓ 满足' : '✗ 不满足'}
            </span>
          </div>
        ) : null}
        <div
          ref={katexRef}
          className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto text-center py-4 min-h-[80px] flex items-center justify-center"
        />
        {axisResult && wordHtmls && (
          <div id={`word-calc-${axisKey}`} style={{ display: 'none' }}>
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>下撑杆件角度计算：</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqAngle }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>{h0Label}</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqH0 }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>下撑杆件支座力：</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqNx }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>下撑杆{axisKey === 'weak' ? '弱' : '强'}轴方向回转半径：</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqI }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>下撑杆长细比：</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqLambda }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>查《钢结构设计标准》GB50017-2017表D得，</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqPhi }} />
            <p style={{ margin: '12px 0 4px 0', fontSize: '11pt' }}>轴心受压稳定性计算：</p>
            <div dangerouslySetInnerHTML={{ __html: (wordHtmls as any).eqSigma }} />
          </div>
        )}
      </div>
    );
  };

  // Overall safety
  const overallSafe = result
    ? (result.mode === 'both'
        ? (result.weak?.isSafe ?? true) && (result.strong?.isSafe ?? true)
        : result.isSafe)
    : null;

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
            验算方向: {calcTarget === 'both' ? '强/弱轴' : calcTarget === 'weak' ? '弱轴' : '强轴'} | 生成时间: {currentTime}
          </p>
        </div>

        {/* 1. 已知参数 */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">
            1. 计算参数 (Known Parameters):
          </h4>
          {result ? (
            <ul
              className="list-disc list-inside text-sm text-gray-700 ml-2"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}
            >
              <li>(支撑上下固定点的竖向距离) n = {params.n} mm</li>
              <li>(支撑上下固定点的水平距离) m = {params.m} mm</li>
              <li>μ(计算长度系数) = {params.mu}</li>
              <li>R(下撑杆件支座力) = {params.R} kN</li>
              <li>A(下撑杆截面积) = {params.A} cm²</li>
              <li>I(弱轴惯性矩) = {params.I} cm⁴</li>
              <li>I'(强轴惯性矩) = {params.IPrime} cm⁴</li>
              <li>k(斜杆L₁与L₀的比值) = {params.k === '' ? 0.5 : params.k}</li>
              <li>f(材料抗压强度设计值) = {params.f} N/mm²</li>
            </ul>
          ) : (
            <span className="text-xs text-gray-400">等待输入...</span>
          )}
        </div>

        {/* 计算过程 */}
        {showWeak && renderAxisSection(
          '弱轴方向验算',
          2,
          'weak',
          weakKatexRef,
          result?.weak,
          wordExportHTMLs?.weak ?? null,
        )}

        {showStrong && renderAxisSection(
          '强轴方向验算',
          showWeak ? 3 : 2,
          'strong',
          strongKatexRef,
          result?.strong,
          wordExportHTMLs?.strong ?? null,
        )}

        {/* 最终结论 */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">最终结论 (Final Result):</h4>
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: overallSafe === null ? '#9ca3af' : overallSafe ? '#16a34a' : '#dc2626',
            }}
          >
            {overallSafe === null
              ? '待计算'
              : overallSafe
                ? '✓ 验算通过，满足要求'
                : '✗ 验算不通过，不满足要求'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ResultPanel;
