import express, { type NextFunction, type Request, type Response } from 'express';
import { calculate as calculateStructuralBeamBiaxial } from '../src/modules/structural-beam-biaxial/calculate';
import { calculate as calculateYBrace } from '../src/modules/y-brace/calculate';
import {
  structuralBeamBiaxialCalcTargets,
  structuralBeamBiaxialDefaultCalcTarget,
  structuralBeamBiaxialDefaultParams,
  structuralBeamBiaxialParamFields,
} from './structuralBeamBiaxial/schema';
import { buildStructuralBeamBiaxialReport } from './structuralBeamBiaxial/report';
import { validateStructuralBeamBiaxialRequest } from './structuralBeamBiaxial/validation';
import {
  yBraceCalcTargets,
  yBraceDefaultCalcTarget,
  yBraceDefaultParams,
  yBraceParamFields,
} from './yBrace/schema';
import { buildYBraceDocxBuffer } from './yBrace/docxReport';
import { buildYBraceReport } from './yBrace/report';
import { validateYBraceRequest } from './yBrace/validation';
import { pushFeedbackToDingTalk, saveFeedback, validateFeedback } from './feedback';

const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/api/health' || req.path === '/api/feedback') {
    next();
    return;
  }

  const expectedKey = process.env.API_KEY;
  if (!expectedKey) {
    res.status(500).json({
      success: false,
      error: {
        code: 'auth_not_configured',
        message: '服务端未配置 API_KEY',
      },
    });
    return;
  }

  if (req.header('x-api-key') !== expectedKey) {
    res.status(401).json({
      success: false,
      error: {
        code: 'unauthorized',
        message: '缺少或无效的 x-api-key',
      },
    });
    return;
  }

  next();
}

function formatTimestampForFile(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('');
}

function handleYBraceCalculation(body: unknown) {
  const validation = validateYBraceRequest(body);

  if (!validation.ok) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: 'validation_failed',
          message: '请求参数校验失败',
          issues: validation.issues,
        },
      },
    } as const;
  }

  const { calcTarget, params, rawParams } = validation.value;
  const result = calculateYBrace(params, calcTarget);

  if (!result) {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'calculation_failed',
          message: '参数已通过格式校验，但计算未能产生结果',
        },
      },
    } as const;
  }

  const report = buildYBraceReport(calcTarget, params, result);

  return {
    status: 200,
    body: {
      success: true,
      moduleId: 'y_brace',
      calcTarget,
      input: rawParams,
      normalizedParams: params,
      result,
      conclusion: report.conclusion,
      report,
    },
  } as const;
}

function handleStructuralBeamBiaxialCalculation(body: unknown) {
  const validation = validateStructuralBeamBiaxialRequest(body);

  if (!validation.ok) {
    return {
      status: 400,
      body: {
        success: false,
        error: {
          code: 'validation_failed',
          message: 'Request parameter validation failed',
          issues: validation.issues,
        },
      },
    } as const;
  }

  const { calcTarget, params, rawParams } = validation.value;
  const result = calculateStructuralBeamBiaxial(params, calcTarget);

  if (!result) {
    return {
      status: 422,
      body: {
        success: false,
        error: {
          code: 'calculation_failed',
          message: 'Parameters passed validation, but calculation did not produce a result',
        },
      },
    } as const;
  }

  const report = buildStructuralBeamBiaxialReport(calcTarget, params, result);

  return {
    status: 200,
    body: {
      success: true,
      moduleId: 'structural_beam_biaxial',
      calcTarget,
      input: rawParams,
      normalizedParams: params,
      result,
      conclusion: report.conclusion,
      report,
    },
  } as const;
}

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(authMiddleware);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok' });
  });

  app.get('/api/y-brace/schema', (_req, res) => {
    res.json({
      success: true,
      moduleId: 'y_brace',
      paramFields: yBraceParamFields,
      defaultParams: yBraceDefaultParams,
      calcTargets: yBraceCalcTargets,
      defaultCalcTarget: yBraceDefaultCalcTarget,
    });
  });

  app.post('/api/y-brace/calculate', (req, res) => {
    const response = handleYBraceCalculation(req.body);
    res.status(response.status).json(response.body);
  });

  app.get('/api/structural-beam-biaxial/schema', (_req, res) => {
    res.json({
      success: true,
      moduleId: 'structural_beam_biaxial',
      paramFields: structuralBeamBiaxialParamFields,
      defaultParams: structuralBeamBiaxialDefaultParams,
      calcTargets: structuralBeamBiaxialCalcTargets,
      defaultCalcTarget: structuralBeamBiaxialDefaultCalcTarget,
    });
  });

  app.post('/api/structural-beam-biaxial/calculate', (req, res) => {
    const response = handleStructuralBeamBiaxialCalculation(req.body);
    res.status(response.status).json(response.body);
  });

  app.post('/api/feedback', async (req, res, next) => {
    try {
      const validation = validateFeedback(req.body);
      if (!validation.ok) {
        res.status(400).json({
          success: false,
          error: {
            code: 'validation_failed',
            message: '反馈内容校验失败',
            issues: validation.issues,
          },
        });
        return;
      }

      const feedback = await saveFeedback(validation.value);
      void pushFeedbackToDingTalk(feedback).catch((error) => {
        console.error('Failed to push feedback to DingTalk:', error);
      });

      res.status(201).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/y-brace/reports/docx', async (req, res, next) => {
    try {
      const response = handleYBraceCalculation(req.body);
      if (response.status !== 200) {
        res.status(response.status).json(response.body);
        return;
      }

      const buffer = await buildYBraceDocxBuffer(response.body.normalizedParams, response.body.result);
      const fileName = encodeURIComponent(`Y撑复核验算书_${formatTimestampForFile()}.docx`);

      res.setHeader('Content-Type', DOCX_CONTENT_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'not_found',
        message: '接口不存在',
      },
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({
      success: false,
      error: {
        code: 'internal_server_error',
        message: '服务端内部错误',
      },
    });
  });

  return app;
}
