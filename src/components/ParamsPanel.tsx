import React from 'react';
import { CalcModule } from '../modules/types';
import { modules } from '../modules';

interface ParamsPanelProps {
  currentModuleId: string;
  onModuleChange: (value: string) => void;
  activeModule: CalcModule;
  params: Record<string, number | ''>;
  onParamChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  calcTarget: string;
  onCalcTargetChange: (value: string) => void;
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
 * 参数输入面板（模块选择 + 动态参数输入 + 计算目标选择）
 * 竖向单列布局，根据 activeModule 动态渲染
 */
const ParamsPanel: React.FC<ParamsPanelProps> = ({
  currentModuleId,
  onModuleChange,
  activeModule,
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

      {/* ── 模块选择 ── */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
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
          value={currentModuleId}
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
          {modules.map((mod) => (
            <option key={mod.info.id} value={mod.info.id}>
              {mod.info.label}
            </option>
          ))}
        </select>
      </section>

      {/* ── 参数输入（根据 activeModule.paramFields 动态渲染） ── */}
      <section style={sectionStyle}>
        <h2 style={sectionHeadStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          参数输入
        </h2>

        {activeModule.paramFields.map((field) => (
          <Field
            key={field.key}
            id={`input-${field.key}`}
            label={field.label}
            placeholder={field.placeholder}
            value={params[field.key] ?? ''}
            onChange={onParamChange(field.key)}
          />
        ))}
      </section>

      {/* ── 计算目标（如果模块有多个目标选项） ── */}
      {activeModule.calcTargets.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={sectionHeadStyle}>
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
            onChange={(e) => onCalcTargetChange(e.target.value)}
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
            {activeModule.calcTargets.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </section>
      )}

    </div>
  );
};

export default ParamsPanel;
