import React from 'react';
import { CalcParams, CalcTarget } from '../types';

interface ParamsPanelProps {
  currentModule: string;
  onModuleChange: (value: string) => void;
  params: CalcParams;
  onParamChange: (key: keyof CalcParams) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  calcTarget: CalcTarget;
  onCalcTargetChange: (value: CalcTarget) => void;
}

/** 单个输入行（标签 + 输入框，竖向单列） */
const Field: React.FC<{
  id: string;
  label: string;
  placeholder: string;
  value: number | '';
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ id, label, placeholder, value, onChange }) => (
  <div style={{ marginBottom: '0.625rem' }}>
    <label
      htmlFor={id}
      style={{
        display: 'block',
        marginBottom: '0.25rem',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: '#374151',
      }}
    >
      {label}
    </label>
    <input
      id={id}
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '0.5rem 0.625rem',
        fontSize: '0.8125rem',
        color: '#111827',
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);

/** section 卡片公共样式 */
const sectionStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239,246,255,0.5)',
  padding: '0.875rem',
  borderRadius: '0.75rem',
  border: '1px solid #dbeafe',
};

/** section 标题公共样式 */
const sectionHeadStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.375rem',
  marginBottom: '0.75rem',
  fontSize: '0.8125rem',
  fontWeight: 700,
  color: '#1f2937',
};

/**
 * 参数输入面板（模块选择 + 参数输入 + 计算方向选择）
 * 竖向单列布局，与窄列宽匹配
 */
const ParamsPanel: React.FC<ParamsPanelProps> = ({
  currentModule,
  onModuleChange,
  params,
  onParamChange,
  calcTarget,
  onCalcTargetChange,
}) => {

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.625rem',
    fontSize: '0.8125rem',
    color: '#111827',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

      {/* ── 模块选择（与参数输入同卡片样式）── */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          {/* 模块图标 */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" rx="2"/>
            <rect x="14" y="2" width="8" height="8" rx="2"/>
            <rect x="2" y="14" width="8" height="8" rx="2"/>
            <rect x="14" y="14" width="8" height="8" rx="2"/>
          </svg>
          模块选择
        </h2>
        <select
          id="module-select"
          value={currentModule}
          onChange={(e) => onModuleChange(e.target.value)}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        >
          <option value="y_brace">Y撑的复核验算</option>
          <option value="wall_tie" disabled>超长连墙件 (开发中...)</option>
          <option value="bracket" disabled>底板钢筋支架支撑计算 (开发中...)</option>
        </select>
      </section>

      {/* ── 参数输入（竖向单列）── */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          {/* 编辑图标 */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          参数输入
        </h2>

        {/* 竖向单列：7 个参数逐行排列 */}
        <Field id="input-n"  label="n (mm)"            placeholder="例如: 4800"  value={params.n}  onChange={onParamChange('n')}  />
        <Field id="input-m"  label="m (mm)"            placeholder="例如: 2144"  value={params.m}  onChange={onParamChange('m')}  />
        <Field id="input-mu" label="μ (约束系数)"       placeholder="例如: 1"     value={params.mu} onChange={onParamChange('mu')} />
        <Field id="input-R"  label="R (kN)"            placeholder="例如: 25.151" value={params.R}  onChange={onParamChange('R')}  />
        <Field
          id="input-I"
          label="I (惯性矩 cm⁴)"
          placeholder={calcTarget === 'weak' ? '例如: 16.6' : '例如: 101'}
          value={params.I}
          onChange={onParamChange('I')}
        />
        <Field id="input-A"  label="A (截面积 cm²)"    placeholder="例如: 10.24" value={params.A}  onChange={onParamChange('A')}  />
        <Field id="input-f"  label="f (抗压强度 N/mm²)" placeholder="例如: 205"  value={params.f}  onChange={onParamChange('f')}  />
      </section>

      {/* ── 计算目标（与参数输入同卡片样式）── */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          {/* 目标图标 */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="12" y1="2" x2="12" y2="4"/>
            <line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/>
            <line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
          计算目标
        </h2>
        <select
          id="calc-target-select"
          value={calcTarget}
          onChange={(e) => onCalcTargetChange(e.target.value as CalcTarget)}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.2)';
            e.target.style.backgroundColor = '#ffffff';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#d1d5db';
            e.target.style.boxShadow = 'none';
            e.target.style.backgroundColor = '#f9fafb';
          }}
        >
          <option value="weak">弱轴方向演算</option>
          <option value="strong">强轴方向演算</option>
        </select>
      </section>

    </div>
  );
};

export default ParamsPanel;
