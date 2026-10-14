import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

export const adminUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  search: z.string().trim().optional(),
  role: z.enum(['user', 'admin']).optional(),
});
