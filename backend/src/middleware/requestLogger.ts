import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isTest = process.env.NODE_ENV === 'test' || process.argv.includes('--test');

    // Only log non-200 or non-test requests to keep test output clean
    if (!isTest || res.statusCode >= 400) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });

  next();
}

/**
 * Enforces a maximum request execution timeout (default: 15 seconds)
 */
export function requestTimeout(timeoutMs = 15000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`[Timeout] Request ${req.method} ${req.originalUrl} timed out after ${timeoutMs}ms`);
        res.status(504).json({
          success: false,
          message: 'Gateway timeout: Request took too long to complete.',
          code: 'GATEWAY_TIMEOUT',
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
}
