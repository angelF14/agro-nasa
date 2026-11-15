import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { type NextFunction, type Request, type Response } from 'express';
import { join } from 'node:path';
import type { AgronomistChatRequest } from './app/models/agronomist.model';
import {
  AgronomistHttpError,
  generateAgronomistReply,
  getAgronomistStatus,
} from './server/agronomist';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const jsonParser = express.json({ limit: '10mb' });

app.use(['/api', '/agronomist'], (req: Request, res: Response, next: NextFunction) => {
  if (req.body !== undefined && typeof req.body === 'object' && req.body !== null) {
    next();
    return;
  }
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      req.body = JSON.parse(req.body);
      next();
      return;
    } catch {
      res.status(400).json({ error: 'Formato JSON inválido en la solicitud.' });
      return;
    }
  }
  jsonParser(req, res, next);
});

app.get(['/api/agronomist/status', '/agronomist/status'], (_req, res) => {
  res.json(getAgronomistStatus());
});

app.post(['/api/agronomist/chat', '/agronomist/chat'], async (req, res) => {
  try {
    const payload = req.body as AgronomistChatRequest;
    const result = await generateAgronomistReply(payload);
    res.json(result);
  } catch (error) {
    if (error instanceof AgronomistHttpError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({
      error: 'Error interno al procesar la consulta con la Superinteligencia Agrónoma.',
    });
  }
});

app.use(['/api', '/agronomist'], (err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (typeof err === 'object' && err !== null && 'type' in err) {
    const errType = (err as { type?: string }).type;
    if (errType === 'entity.too.large') {
      res.status(413).json({
        error: 'La imagen o consulta supera el límite máximo permitido (10 MB).',
      });
      return;
    }
    if (errType === 'entity.parse.failed') {
      res.status(400).json({ error: 'Formato JSON inválido en la solicitud.' });
      return;
    }
  }
  next(err);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
