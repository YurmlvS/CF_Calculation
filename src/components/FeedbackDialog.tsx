import React, { useState } from 'react';

type FeedbackType = 'module_request' | 'calculation_error' | 'feature_suggestion' | 'other';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

const feedbackOptions: Array<{ value: FeedbackType; label: string }> = [
  { value: 'module_request', label: '需要其他计算模块' },
  { value: 'calculation_error', label: '计算内容有错' },
  { value: 'feature_suggestion', label: '功能优化建议' },
  { value: 'other', label: '其他' },
];

const API_BASE_URL = import.meta.env.VITE_FEEDBACK_API_BASE_URL ?? '';

export default function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('module_request');
  const [otherType, setOtherType] = useState('');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!open) {
    return null;
  }

  const canSubmit =
    status !== 'submitting' &&
    content.trim().length > 0 &&
    (feedbackType !== 'other' || otherType.trim().length > 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus('error');
      setMessage('请填写必填项后再提交。');
      return;
    }

    setStatus('submitting');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          otherType: feedbackType === 'other' ? otherType.trim() : undefined,
          content: content.trim(),
          contact: contact.trim() || undefined,
          pageUrl: window.location.href,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error?.message ?? '提交失败，请稍后再试。');
      }

      setStatus('success');
      setMessage('反馈已提交，感谢您的帮助。');
      setContent('');
      setContact('');
      setOtherType('');
      setFeedbackType('module_request');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '提交失败，请稍后再试。');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        padding: '1rem',
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 'min(96vw, 560px)',
          backgroundColor: '#fff',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 45px rgb(15 23 42 / 0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.2rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 id="feedback-title" style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
            用户反馈
          </h2>
          <button
            type="button"
            aria-label="关闭反馈窗口"
            onClick={onClose}
            style={{ backgroundColor: 'transparent', color: '#64748b', fontSize: '1.2rem' }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.9rem', padding: '1.2rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: '#374151' }}>
            反馈类型 <span style={{ color: '#dc2626' }}>*</span>
            <select
              value={feedbackType}
              onChange={(event) => setFeedbackType(event.target.value as FeedbackType)}
              required
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.55rem 0.65rem',
                fontSize: '0.82rem',
                backgroundColor: '#fff',
              }}
            >
              {feedbackOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {feedbackType === 'other' && (
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: '#374151' }}>
              其他类型说明 <span style={{ color: '#dc2626' }}>*</span>
              <input
                value={otherType}
                onChange={(event) => setOtherType(event.target.value)}
                maxLength={100}
                required
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.55rem 0.65rem',
                  fontSize: '0.82rem',
                }}
              />
            </label>
          )}

          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: '#374151' }}>
            反馈内容 <span style={{ color: '#dc2626' }}>*</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={3000}
              required
              rows={6}
              style={{
                resize: 'vertical',
                minHeight: '7rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.65rem',
                fontSize: '0.82rem',
                lineHeight: 1.5,
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.82rem', color: '#374151' }}>
            联系方式
            <input
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              maxLength={200}
              placeholder="邮箱/手机号/微信号等任何可以联系到您的方式"
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.55rem 0.65rem',
                fontSize: '0.82rem',
              }}
            />
          </label>

          {message && (
            <div
              role="status"
              style={{
                color: status === 'success' ? '#16a34a' : '#dc2626',
                fontSize: '0.78rem',
              }}
            >
              {message}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
            padding: '0.9rem 1.2rem 1.1rem',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#f1f5f9',
              color: '#334155',
              padding: '0.5rem 0.85rem',
              borderRadius: '0.375rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              backgroundColor: '#2563eb',
              color: '#fff',
              padding: '0.5rem 0.95rem',
              borderRadius: '0.375rem',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            {status === 'submitting' ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  );
}
