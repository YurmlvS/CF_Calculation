import crypto from 'node:crypto';
import { Pool } from 'pg';
import { z } from 'zod';

const feedbackTypeLabels = {
  module_request: '需要其他计算模块',
  calculation_error: '计算内容有错',
  feature_suggestion: '功能优化建议',
  other: '其他',
} as const;

const feedbackSchema = z.object({
  type: z.enum(['module_request', 'calculation_error', 'feature_suggestion', 'other']),
  otherType: z.string().trim().max(100).optional(),
  content: z.string().trim().min(1, '反馈内容不能为空').max(3000, '反馈内容不能超过 3000 字'),
  contact: z.string().trim().min(1, '联系方式不能为空').max(200, '联系方式不能超过 200 字'),
  pageUrl: z.string().trim().max(1000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

let pool: Pool | undefined;
let tableReady = false;

function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.FEEDBACK_DATABASE_URL;
  if (!connectionString) {
    throw new Error('FEEDBACK_DATABASE_URL is not configured');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.FEEDBACK_DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}

async function ensureFeedbackTable(): Promise<void> {
  if (tableReady || process.env.FEEDBACK_AUTO_INIT_TABLE !== 'true') {
    return;
  }

  await getPool().query(`
    CREATE TABLE IF NOT EXISTS feedback (
      "反馈类型" TEXT NOT NULL,
      "反馈内容" TEXT NOT NULL,
      "联系方式" TEXT NOT NULL,
      "提交时间" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')
    );
  `);
  tableReady = true;
}

function getTypeText(input: FeedbackInput): string {
  const typeLabel = feedbackTypeLabels[input.type];
  return input.type === 'other' && input.otherType ? `${typeLabel}（${input.otherType}）` : typeLabel;
}

function formatUtc8Timestamp(date: Date): string {
  const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    utc8.getUTCFullYear(),
    pad(utc8.getUTCMonth() + 1),
    pad(utc8.getUTCDate()),
  ].join('-') + ` ${pad(utc8.getUTCHours())}:${pad(utc8.getUTCMinutes())}:${pad(utc8.getUTCSeconds())}`;
}

export function validateFeedback(body: unknown) {
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false as const,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
  }

  if (parsed.data.type === 'other' && !parsed.data.otherType) {
    return {
      ok: false as const,
      issues: [{ field: 'otherType', message: '选择其他时请填写类型说明' }],
    };
  }

  return { ok: true as const, value: parsed.data };
}

export async function saveFeedback(input: FeedbackInput) {
  await ensureFeedbackTable();

  const typeText = getTypeText(input);
  await getPool().query(
    `INSERT INTO feedback
      ("反馈类型", "反馈内容", "联系方式", "提交时间")
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')`,
    [typeText, input.content, input.contact],
  );

  const submittedAt = new Date();

  return {
    submittedAtText: formatUtc8Timestamp(submittedAt),
    typeText,
    ...input,
  };
}

function buildDingTalkUrl(): string | undefined {
  const webhook = process.env.DINGTALK_WEBHOOK_URL;
  const secret = process.env.DINGTALK_SECRET;
  if (!webhook) {
    return undefined;
  }

  if (!secret) {
    return webhook;
  }

  const timestamp = Date.now();
  const signSource = `${timestamp}\n${secret}`;
  const sign = encodeURIComponent(
    crypto.createHmac('sha256', secret).update(signSource).digest('base64'),
  );
  const separator = webhook.includes('?') ? '&' : '?';
  return `${webhook}${separator}timestamp=${timestamp}&sign=${sign}`;
}

function sanitizeMarkdown(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export async function pushFeedbackToDingTalk(feedback: Awaited<ReturnType<typeof saveFeedback>>) {
  const url = buildDingTalkUrl();
  if (!url) {
    return;
  }

  const markdown = [
    `- 反馈类型：${feedback.typeText}`,
    `- 反馈内容：${sanitizeMarkdown(feedback.content)}`,
    `- 联系方式：${sanitizeMarkdown(feedback.contact)}`,
    `- 提交时间：${feedback.submittedAtText}`,
  ].join('\n\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      msgtype: 'markdown',
      markdown: {
        title: '新的用户反馈',
        text: markdown,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`DingTalk webhook responded with ${response.status}`);
  }
}
