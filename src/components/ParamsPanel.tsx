import React from 'react';
import { createPortal } from 'react-dom';
import { CalcModule, ParamFieldDef, ParamValue } from '../modules/types';
import { modules } from '../modules';

interface ParamsPanelProps {
  currentModuleId: string;
  onModuleChange: (value: string) => void;
  activeModule: CalcModule;
  params: Record<string, ParamValue>;
  onParamChange: (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onParamPatch: (patch: Record<string, ParamValue>) => void;
  calcTarget: string;
  onCalcTargetChange: (value: string) => void;
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#374151',
};

const fieldLabelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  marginBottom: '0.25rem',
};

/** 单个输入行（标签 + 输入框，竖向单列） */
const Field: React.FC<{
  id: string;
  label: React.ReactNode;
  tip?: ParamFieldDef['tip'];
  placeholder: string;
  value: ParamValue;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ id, label, tip, placeholder, value, onChange, disabled }) => (
  <div style={{ marginBottom: '0.625rem' }}>
    <div style={fieldLabelRowStyle}>
      <label
        htmlFor={id}
        style={{ ...fieldLabelStyle, marginBottom: 0 }}
      >
        {label}
      </label>
      {tip && <ParamTip tip={tip} />}
    </div>
    <input
      id={id}
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.5rem 0.625rem',
        fontSize: '0.8125rem',
        color: disabled ? '#6b7280' : '#111827',
        backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
      onFocus={(e) => {
        if (disabled) return;
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

const ParamTip: React.FC<{ tip: NonNullable<ParamFieldDef['tip']> }> = ({ tip }) => {
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const tipId = React.useRef(`param-tip-${Math.random().toString(36).slice(2)}`);
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 0, top: 0 });

  const updatePosition = React.useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setPosition({
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
    });
  }, []);

  const showTip = React.useCallback(() => {
    updatePosition();
    window.dispatchEvent(new CustomEvent('param-tip-show', { detail: tipId.current }));
    setIsVisible(true);
  }, [updatePosition]);

  const hideTip = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return undefined;

    trigger.addEventListener('pointerenter', showTip);
    trigger.addEventListener('mouseenter', showTip);
    trigger.addEventListener('click', showTip);
    trigger.addEventListener('pointerleave', hideTip);
    trigger.addEventListener('mouseleave', hideTip);
    trigger.addEventListener('focus', showTip);
    trigger.addEventListener('blur', hideTip);

    return () => {
      trigger.removeEventListener('pointerenter', showTip);
      trigger.removeEventListener('mouseenter', showTip);
      trigger.removeEventListener('click', showTip);
      trigger.removeEventListener('pointerleave', hideTip);
      trigger.removeEventListener('mouseleave', hideTip);
      trigger.removeEventListener('focus', showTip);
      trigger.removeEventListener('blur', hideTip);
    };
  }, [hideTip, showTip]);

  React.useEffect(() => {
    const handleOtherTipShow = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== tipId.current) {
        setIsVisible(false);
      }
    };

    window.addEventListener('param-tip-show', handleOtherTipShow);
    return () => {
      window.removeEventListener('param-tip-show', handleOtherTipShow);
    };
  }, []);

  React.useEffect(() => {
    if (!isVisible) return undefined;

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        className="param-tip-trigger"
        tabIndex={0}
        aria-label={tip.caption}
      >
        <span className="param-tip-icon" aria-hidden="true">?</span>
      </span>
      {isVisible && createPortal(
        <span
          className="param-tip-popover"
          role="tooltip"
          style={{
            left: position.left,
            top: position.top,
          }}
        >
          <img className="param-tip-image" src={tip.imageSrc} alt={tip.imageAlt ?? tip.caption} />
          <span className="param-tip-caption">{tip.caption}</span>
        </span>,
        document.body,
      )}
    </>
  );
};

const renderRichLabel = (label: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const re = /_([A-Za-z0-9]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(label)) !== null) {
    if (match.index > lastIndex) parts.push(label.slice(lastIndex, match.index));
    parts.push(<sub key={`${match.index}-${match[1]}`}>{match[1]}</sub>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < label.length) parts.push(label.slice(lastIndex));
  return parts.length > 0 ? parts : label;
};

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
  onParamPatch,
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

  const isFieldReadOnly = (field: ParamFieldDef) => {
    if (!field.readOnlyWhen) return false;
    const actual = params[field.readOnlyWhen.key];
    if ('notValue' in field.readOnlyWhen) {
      return actual !== field.readOnlyWhen.notValue;
    }
    return actual === field.readOnlyWhen.value;
  };

  const handleSelectChange = (field: ParamFieldDef, value: string) => {
    const selectedOption = field.options?.find((option) => String(option.value) === value);
    const fieldValue = selectedOption ? selectedOption.value : value;
    const dynamicPatch = field.getPatchOnChange?.(fieldValue, params) ?? {};
    onParamPatch({
      [field.key]: fieldValue,
      ...(selectedOption?.fill ?? {}),
      ...dynamicPatch,
    });
  };

  const renderSelectControl = (field: ParamFieldDef) => (
    <select
      id={`input-${field.key}`}
      value={String(params[field.key] ?? '')}
      onChange={(e) => handleSelectChange(field, e.target.value)}
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
      {field.options?.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );

  const renderField = (field: ParamFieldDef) => {
    if (field.inputType === 'select') {
      return (
        <div key={field.key} style={{ marginBottom: '0.625rem' }}>
          <div style={fieldLabelRowStyle}>
            <label
              htmlFor={`input-${field.key}`}
              style={{ ...fieldLabelStyle, marginBottom: 0 }}
            >
              {renderRichLabel(field.label)}
            </label>
            {field.tip && <ParamTip tip={field.tip} />}
          </div>
          {renderSelectControl(field)}
        </div>
      );
    }

    return (
      <Field
        key={field.key}
        id={`input-${field.key}`}
        label={renderRichLabel(field.label)}
        tip={field.tip}
        placeholder={field.placeholder}
        value={params[field.key] ?? ''}
        onChange={onParamChange(field.key)}
        disabled={isFieldReadOnly(field)}
      />
    );
  };

  const renderParamFields = () => {
    const nodes: React.ReactNode[] = [];

    for (let i = 0; i < activeModule.paramFields.length; i += 1) {
      const field = activeModule.paramFields[i];
      const nextField = activeModule.paramFields[i + 1];

      if (field.inlineWithNext && nextField?.inputType === 'select') {
        nodes.push(
          <div key={`${field.key}-${nextField.key}`} style={{ marginBottom: '0.625rem' }}>
            <label
              htmlFor={`input-${field.key}`}
              style={fieldLabelStyle}
            >
              {renderRichLabel(field.label)}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
              {renderSelectControl(field)}
              <span style={{ color: '#374151', fontWeight: 700 }}>{field.inlineWithNext.separator}</span>
              {renderSelectControl(nextField)}
            </div>
          </div>,
        );
        i += 1;
        continue;
      }

      nodes.push(renderField(field));
    }

    return nodes;
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

        {renderParamFields()}
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
