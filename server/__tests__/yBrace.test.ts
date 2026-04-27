import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../app';

const apiKey = 'test-api-key';
let server: Server;
let baseUrl: string;

const validPayload = {
  calcTarget: 'both',
  params: {
    n: 4800,
    m: 2144,
    mu: 1,
    R: 25.151,
    A: 9.24,
    I: 16.6,
    IPrime: 101,
    k: 0.5,
    f: 205,
  },
};

before(async () => {
  process.env.API_KEY = apiKey;
  server = createApp().listen(0);
  await once(server, 'listening');
  const address = server.address();
  assert.equal(typeof address, 'object');
  assert.ok(address);
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('requires an API key for y_brace endpoints', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/calculate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(validPayload),
  });

  assert.equal(response.status, 401);
});

test('calculates y_brace for both axes', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/calculate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(validPayload),
  });

  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.moduleId, 'y_brace');
  assert.equal(body.calcTarget, 'both');
  assert.ok(body.result.weak);
  assert.ok(body.result.strong);
  assert.ok(Array.isArray(body.report.sections));
  assert.equal(body.report.sections.length, 2);
});

test('schema exposes material and strength select options', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/schema`, {
    headers: { 'x-api-key': apiKey },
  });

  const body = await response.json() as any;
  const materialField = body.paramFields.find((field: any) => field.key === 'materialSpec');
  const strengthField = body.paramFields.find((field: any) => field.key === 'f');

  assert.equal(response.status, 200);
  assert.equal(materialField.inputType, 'select');
  assert.ok(materialField.options.some((option: any) => option.value === 'φ48X2.4'));
  assert.ok(materialField.options.some((option: any) => option.value === 'custom'));
  assert.deepEqual(strengthField.options, [
    { value: 205, label: 'Q235' },
    { value: 295, label: 'Q355' },
  ]);
});

test('calculates y_brace by material specification', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/calculate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      calcTarget: 'both',
      params: {
        n: 4800,
        m: 2144,
        mu: 1,
        R: 25.151,
        materialSpec: '8号槽钢',
        k: 0.5,
        f: 'Q355',
      },
    }),
  });

  const body = await response.json() as any;

  assert.equal(response.status, 200);
  assert.equal(body.normalizedParams.materialSpec, '8号槽钢');
  assert.equal(body.normalizedParams.A, 10.24);
  assert.equal(body.normalizedParams.I, 101);
  assert.equal(body.normalizedParams.IPrime, 16.6);
  assert.equal(body.normalizedParams.f, 295);
});

test('returns detailed validation issues', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/calculate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      calcTarget: 'both',
      params: { ...validPayload.params, n: -1, IPrime: '', k: 1.2 },
    }),
  });

  const body = await response.json() as any;

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error.code, 'validation_failed');
  assert.ok(body.error.issues.some((issue: any) => issue.field === 'params.n'));
  assert.ok(body.error.issues.some((issue: any) => issue.field === 'params.IPrime'));
  assert.ok(body.error.issues.some((issue: any) => issue.field === 'params.k'));
});

test('rejects invalid material specification and strength option', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/calculate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      calcTarget: 'weak',
      params: { ...validPayload.params, materialSpec: '不存在的规格', f: 300 },
    }),
  });

  const body = await response.json() as any;

  assert.equal(response.status, 400);
  assert.ok(body.error.issues.some((issue: any) => issue.field === 'params.materialSpec'));
  assert.ok(body.error.issues.some((issue: any) => issue.field === 'params.f'));
});

test('returns a docx report as binary content', async () => {
  const response = await fetch(`${baseUrl}/api/y-brace/reports/docx`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(validPayload),
  });

  const bytes = await response.arrayBuffer();

  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get('content-type'),
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  );
  assert.ok(response.headers.get('content-disposition')?.includes('.docx'));
  assert.ok(bytes.byteLength > 0);
});
