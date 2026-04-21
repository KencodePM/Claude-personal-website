import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const flat = err.flatten();
    const hasFieldErrors = Object.keys(flat.fieldErrors).length > 0;
    const hasFormErrors = flat.formErrors.length > 0;
    res.status(400).json({
      success: false,
      error: 'Validation error',
      // Include both — for top-level array/primitive failures, fieldErrors is empty
      // but formErrors carries the actual message. Issues is the most complete view.
      details: hasFieldErrors ? flat.fieldErrors : undefined,
      formErrors: hasFormErrors ? flat.formErrors : undefined,
      issues: err.issues.map((i) => ({
        path: i.path.join('.') || '<root>',
        message: i.message,
        code: i.code,
      })),
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (statusCode === 500) {
    console.error('[Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}
