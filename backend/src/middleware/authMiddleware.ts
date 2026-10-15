import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserPayload } from '../services/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: TokenUserPayload;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      message: 'Authentication required. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      message: 'Invalid or expired access token.',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  req.user = payload;
  next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        message: 'Authentication required. No token provided.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}.`,
      });
      return;
    }

    next();
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  requireRole('admin')(req, res, next);
}


