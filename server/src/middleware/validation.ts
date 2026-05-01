import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export const createLetterSchema = z.object({
  title: z.string().min(1).max(255),
  contentJson: z.array(z.record(z.unknown())).optional().default([]),
  contentHtml: z.string().optional().default(''),
  author: z.string().min(1).max(100),
  letterDate: z.string().datetime(),
  position: z.number().int().min(0).optional(),
});

export const updateLetterSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  contentJson: z.array(z.record(z.unknown())).optional(),
  contentHtml: z.string().optional(),
  author: z.string().min(1).max(100).optional(),
  letterDate: z.string().datetime().optional(),
});

export const reorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string(),
      position: z.number().int().min(0),
    })
  ),
});
