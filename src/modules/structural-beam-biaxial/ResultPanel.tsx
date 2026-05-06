import React from 'react';
import katex from 'katex';
import { ModuleResultProps } from '../types';
import { FlexuralAxisResult, StructuralBeamBiaxialResult } from './calculate';

const safeRenderKatex = (tex: string) => {
  try {
    return katex.renderToString(tex, { displayMode: true, throwOnError: false, strict: false });
  } catch (e) {
    console.error('KaTeX render error:', e);
    return tex;
  }
};

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
  return `${(value * 100).toFixed(digits)}\\%`;
}

function okText(ok: boolean | null): string {
  if (ok === null) return '按自定义面积验算';
  return ok ? '满足' : '不满足';
}

function resultColor(ok: boolean | null): string {
  if (ok === null) return '#6b7280';
  return ok ? '#16a34a' : '#dc2626';
}

function rebarLabel(axis: FlexuralAxisResult): string {
  if (!axis.rebarCount || !axis.rebarDiameter) return '自定义';
  return `${axis.rebarCount}Φ${axis.rebarDiameter}`;
}

const SymbolText: React.FC<{ base: string; sub?: string }> = ({ base, sub }) => (
  <span>
    {base}
    {sub ? <sub>{sub}</sub> : null}
  </span>
);

const FormulaLine: React.FC<{ tex: string }> = ({ tex }) => (
  <div
    className="text-center overflow-x-auto"
    style={{ padding: '0.15rem 0' }}
    dangerouslySetInnerHTML={{ __html: safeRenderKatex(tex) }}
  />
);

const NoteLine: React.FC<{ children: React.ReactNode; muted?: boolean }> = ({ children, muted }) => (
  <p
    className={muted ? 'text-xs text-gray-500' : 'text-sm text-gray-700'}
    style={{ margin: '0.45rem 0 0.15rem 0' }}
  >
    {children}
  </p>
);

function targetLabel(calcTarget: string): string {
  if (calcTarget === 'worst') return '最不利点判定';
  if (calcTarget === 'rebar') return '纵向受拉钢筋的截面面积计算';
  if (calcTarget === 'shear') return '斜截面受剪验算';
  return '全部计算';
}

function renderWorstSection(result: StructuralBeamBiaxialResult) {
  const { q, F } = result.input;
  const w = result.worst;
  const l = fmt(w.effectiveSpanM);
  const a = fmt(w.horizontalA);
  const b = fmt(w.horizontalB);

  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto">
      <NoteLine>均布荷载作用下：</NoteLine>
      <FormulaLine tex={`M_1=-\\frac{ql^2}{12}=-\\frac{${q}\\times${l}^2}{12}=${fmt(w.verticalSupportMoment)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`M_2=\\frac{ql^2}{24}=\\frac{${q}\\times${l}^2}{24}=${fmt(w.verticalMidMoment)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`V_1=\\frac{ql}{2}=\\frac{${q}\\times${l}}{2}=${fmt(w.verticalShear)}\\,\\mathrm{kN}`} />

      <NoteLine>水平力作用下（以作用在中点为例）：</NoteLine>
      <FormulaLine tex={`a=b=\\frac{l}{2}=${a}\\,\\mathrm{m}`} />
      <FormulaLine tex={`M_1=-\\frac{Fab^2}{l^2}=-\\frac{${F}\\times${a}\\times${b}^2}{${l}^2}=${fmt(w.horizontalSupportMoment)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`M_2=\\frac{Fa^2b^2}{l^3}=\\frac{${F}\\times${a}^2\\times${b}^2}{${l}^3}=${fmt(w.horizontalMidMoment)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`V_2=\\frac{Fb^2}{l^2}\\left(1+\\frac{2a}{l}\\right)=${fmt(w.horizontalShear)}\\,\\mathrm{kN}`} />

      <NoteLine>得到最不利截面为{w.worstSection === 'support' ? '支座处' : '跨中处'}：</NoteLine>
      <FormulaLine tex={`M_x=\\max(|M_{x1}|,|M_{x2}|)=${fmt(w.Mx)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`M_y=\\max(|M_{y1}|,|M_{y2}|)=${fmt(w.My)}\\,\\mathrm{kN\\cdot m}`} />
      <FormulaLine tex={`V=\\max(V_1,V_2)=${fmt(w.V)}\\,\\mathrm{kN}`} />
    </div>
  );
}

function renderFlexuralAxis(axis: FlexuralAxisResult, fc: number, fy: number, ft: number) {
  const axisName = axis.axis === 'x' ? 'x方向' : 'y方向';
  const moment = axis.axis === 'x' ? 'M_x' : 'M_y';
  const area = axis.axis === 'x' ? 'A_{sx}' : 'A_{sy}';
  const provided = axis.axis === 'x' ? 'A_{ux}' : 'A_{uy}';
  const widthName = axis.axis === 'x' ? 'b' : 'h';
  const rho = axis.axis === 'x' ? '\\rho_x' : '\\rho_y';
  const fitText = axis.fits === null
    ? '自定义钢筋，未进行排布宽度自动验算。'
    : `${fmtArea(axis.arrangementWidth ?? 0)} mm < ${fmtArea(axis.fitWidth)} mm，${okText(axis.fits)}。`;

  return (
    <div className="mb-4">
      <h5 className="text-sm font-semibold text-gray-600 mb-2">{axisName}</h5>
      <div className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto">
        <NoteLine>截面抵抗矩系数计算：</NoteLine>
        <FormulaLine tex={`a_s=\\frac{${moment}}{\\alpha_1 f_c ${widthName}h_0^2}=\\frac{${fmt(axis.moment)}\\times10^6}{1\\times${fc}\\times${fmtArea(axis.sectionWidth)}\\times${fmtArea(axis.h0)}^2}=${fmt(axis.alphaS, 3)}`} />

        <NoteLine>相对受压区高度计算：</NoteLine>
        <FormulaLine tex={`\\xi=1-\\sqrt{1-2a_s}=${fmt(axis.xi, 3)}${axis.xi < axis.xiB ? '<' : '\\ge'}\\xi_b=${axis.xiB}`} />

        <NoteLine>内力矩的内力臂系数：</NoteLine>
        <FormulaLine tex={`\\Upsilon_s=0.5\\left(1+\\sqrt{1-2a_s}\\right)=${fmt(axis.gammaS, 3)}`} />

        <NoteLine>纵向受拉钢筋的截面面积：</NoteLine>
        <FormulaLine tex={`${area}=\\frac{${moment}}{f_y\\Upsilon_s h_0}=\\frac{${fmt(axis.moment)}\\times10^6}{${fy}\\times${fmt(axis.gammaS, 3)}\\times${fmtArea(axis.h0)}}=${fmtArea(axis.requiredArea)}\\,\\mathrm{mm^2}`} />

        <NoteLine>配筋验算：</NoteLine>
        <FormulaLine tex={`${provided}=${fmtArea(axis.providedArea)}\\,\\mathrm{mm^2}${axis.areaOk ? '\\ge' : '<'}${fmtArea(axis.requiredArea)}\\,\\mathrm{mm^2}`} />
        <p className="text-sm text-gray-700 text-center" style={{ color: axis.areaOk ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
          {rebarLabel(axis)}，{okText(axis.areaOk)}
        </p>

        <NoteLine>验算在 {fmtArea(axis.fitWidth)} mm 宽度内是否放得下：</NoteLine>
        {axis.arrangementWidth === null ? (
          <p className="text-sm text-gray-700 text-center">{fitText}</p>
        ) : (
          <>
            <FormulaLine tex={`${axis.rebarCount}\\times${axis.rebarDiameter}+${Math.max(0, (axis.rebarCount ?? 1) - 1)}\\times25+2\\times(20+8)=${fmtArea(axis.arrangementWidth)}\\,\\mathrm{mm}`} />
            <p className="text-sm text-gray-700 text-center" style={{ color: axis.fits ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
              {fitText}
            </p>
          </>
        )}

        <NoteLine>最小配筋率验算：</NoteLine>
        <FormulaLine tex={`${rho}=\\frac{${fmtArea(axis.providedArea)}}{${fmtArea(axis.sectionWidth)}\\times${fmtArea(axis.h0)}}=${pct(axis.rho)}`} />
        <FormulaLine tex={`\\rho_{min,1}=0.45\\frac{f_t}{f_y}\\frac{h}{h_0}=0.45\\times\\frac{${ft}}{${fy}}\\times\\frac{${fmtArea(axis.sectionHeight)}}{${fmtArea(axis.h0)}}=${pct(axis.rhoMinFt)}`} />
        <FormulaLine tex={`\\rho_{min,2}=0.2\\%\\times\\frac{h}{h_0}=${pct(axis.rhoMinBase)}`} />
        <p className="text-sm text-center" style={{ color: axis.rhoOk ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
          {okText(axis.rhoOk)}
        </p>
      </div>
    </div>
  );
}

function renderShearSection(result: StructuralBeamBiaxialResult) {
  const { b, h, fc, ft } = result.input;
  const s = result.shear;
  const h0 = h - 40;

  return (
    <div className="bg-gray-50 p-4 rounded border border-gray-100 overflow-x-auto">
      <NoteLine>截面限制条件：</NoteLine>
      <FormulaLine tex={`0.25f_cbh_0=0.25\\times${fc}\\times${b}\\times${h0}/1000=${fmt(s.limitCapacity, 1)}\\,\\mathrm{kN}${s.limitOk ? '>' : '\\le'}${fmt(s.shear)}\\,\\mathrm{kN}`} />
      <p className="text-sm text-center" style={{ color: s.limitOk ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
        {okText(s.limitOk)}
      </p>

      <NoteLine>受剪承载力：</NoteLine>
      <FormulaLine tex={`0.7f_tbh_0=0.7\\times${ft}\\times${b}\\times${h0}/1000=${fmt(s.concreteCapacity, 1)}\\,\\mathrm{kN}${s.concreteOk ? '>' : '\\le'}${fmt(s.shear)}\\,\\mathrm{kN}`} />
      <p className="text-sm text-center" style={{ color: s.concreteOk ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
        {okText(s.concreteOk)}
      </p>

      <p className="text-sm text-gray-700 mt-2">
        {s.concreteOk ? '混凝土即可承担剪力，箍筋按照构造配置。' : '混凝土受剪承载力不足，应另行配置箍筋并复核。'}
      </p>
    </div>
  );
}

const ResultPanel: React.FC<ModuleResultProps> = ({ params, calcResult, calcTarget }) => {
  const currentTime = new Date().toLocaleString('zh-CN', { hour12: false });
  const result = calcResult as StructuralBeamBiaxialResult | null;
  const showWorst = calcTarget === 'all' || calcTarget === 'worst';
  const showRebar = calcTarget === 'all' || calcTarget === 'rebar';
  const showShear = calcTarget === 'all' || calcTarget === 'shear';
  const overallSafe = result
    ? calcTarget === 'worst'
      ? true
      : calcTarget === 'rebar'
        ? result.flexural.isSafe
        : calcTarget === 'shear'
          ? result.shear.isSafe
          : result.isSafe
    : null;

  return (
    <section className="flex-1 flex flex-col transition-opacity duration-500" style={{ minWidth: 0 }}>
      <div id="export-area" className="bg-white border border-gray-200 shadow-sm rounded-xl px-4 relative" style={{ flex: 1 }}>
        <div className="border-b border-gray-100 px-4 mb-4">
          <h3 className="text-xl font-bold text-center text-gray-800">结构梁双向受力验算书</h3>
          <p className="text-center text-xs text-gray-400 mt-1">
            计算目标: {targetLabel(calcTarget)} | 生成时间: {currentTime}
          </p>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">1. 计算参数</h4>
          {result ? (
            <ul className="list-disc list-inside text-cs text-gray-700 ml-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
              <li>梁高 h = {params.h} mm</li>
              <li>梁宽 b = {params.b} mm</li>
              <li>梁长 l = {params.l} m</li>
              <li>竖向均布荷载 q = {params.q} kN/m</li>
              <li>水平集中力 F = {params.F} kN</li>
              <li>轴心抗压强度 <SymbolText base="f" sub="c" /> = {params.fc} N/mm²</li>
              <li>混凝土抗拉强度标准值 <SymbolText base="f" sub="t" /> = {params.ft} N/mm²</li>
              <li>钢筋强度设计值 <SymbolText base="f" sub="y" /> = {params.fy} N/mm²</li>
              <li>X轴钢筋 {rebarLabel(result.flexural.x)}，<SymbolText base="A" sub="ux" /> = {params.Aux} mm²</li>
              <li>Y轴钢筋 {rebarLabel(result.flexural.y)}，<SymbolText base="A" sub="uy" /> = {params.Auy} mm²</li>
            </ul>
          ) : (
            <span className="text-xs text-gray-400">请填写完整参数以生成计算过程...</span>
          )}
        </div>

        {result && result.worst.spanNote && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2 mb-4">
            {result.worst.spanNote}
          </p>
        )}

        {result && showWorst && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">2. 最不利点判定</h4>
            {renderWorstSection(result)}
          </div>
        )}

        {result && showRebar && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">{showWorst ? 3 : 2}. 纵向受拉钢筋的截面面积计算</h4>
            <NoteLine muted>对 x、y 两个方向分别进行配筋验算。</NoteLine>
            {renderFlexuralAxis(result.flexural.x, result.input.fc, result.input.fy, result.input.ft)}
            {renderFlexuralAxis(result.flexural.y, result.input.fc, result.input.fy, result.input.ft)}
          </div>
        )}

        {result && showShear && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">{showWorst && showRebar ? 4 : showWorst || showRebar ? 3 : 2}. 斜截面受剪验算</h4>
            {renderShearSection(result)}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-600">最终结论：</h4>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: resultColor(overallSafe) }}>
            {overallSafe === null ? '待计算' : overallSafe ? '验算通过，满足要求' : '验算不通过，不满足要求'}
          </span>
        </div>
      </div>
    </section>
  );
};

export default ResultPanel;

