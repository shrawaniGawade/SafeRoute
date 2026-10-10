import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError || (error && typeof error === 'object' && 'issues' in error)) {
        const issues = (error as any).issues || (error as any).errors || [];
        const formattedErrors: Record<string, string> = {};

        issues.forEach((err: any) => {
          const field = Array.isArray(err.path) ? err.path.join('.') : 'field';
          formattedErrors[field] = err.message || 'Invalid value';
        });

        res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
}
