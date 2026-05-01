import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { broadcast } from '../services/websocket';
import {
  validate,
  createLetterSchema,
  updateLetterSchema,
  reorderSchema,
} from '../middleware/validation';

const router = Router();
const prisma = new PrismaClient();

// GET /api/letters
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const letters = await prisma.letter.findMany({
      orderBy: { position: 'asc' },
    });
    res.json(letters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch letters' });
  }
});

// GET /api/letters/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const letter = await prisma.letter.findUnique({ where: { id: req.params.id } });
    if (!letter) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }
    res.json(letter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch letter' });
  }
});

// POST /api/letters
router.post('/', validate(createLetterSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const maxPositionResult = await prisma.letter.aggregate({ _max: { position: true } });
    const nextPosition = (maxPositionResult._max.position ?? -1) + 1;

    const letter = await prisma.letter.create({
      data: {
        title: req.body.title,
        contentJson: req.body.contentJson,
        contentHtml: req.body.contentHtml,
        author: req.body.author,
        letterDate: new Date(req.body.letterDate),
        position: req.body.position ?? nextPosition,
      },
    });

    broadcast({ type: 'LETTER_CREATED', payload: letter });
    res.status(201).json(letter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create letter' });
  }
});

// PATCH /api/letters/:id
router.patch('/:id', validate(updateLetterSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.letter.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.contentJson !== undefined) updateData.contentJson = req.body.contentJson;
    if (req.body.contentHtml !== undefined) updateData.contentHtml = req.body.contentHtml;
    if (req.body.author !== undefined) updateData.author = req.body.author;
    if (req.body.letterDate !== undefined) updateData.letterDate = new Date(req.body.letterDate);

    const letter = await prisma.letter.update({
      where: { id: req.params.id },
      data: updateData,
    });

    broadcast({ type: 'LETTER_UPDATED', payload: letter });
    res.json(letter);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update letter' });
  }
});

// DELETE /api/letters/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.letter.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Letter not found' });
      return;
    }

    await prisma.letter.delete({ where: { id: req.params.id } });
    broadcast({ type: 'LETTER_DELETED', payload: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete letter' });
  }
});

// POST /api/letters/reorder
router.post('/reorder', validate(reorderSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders } = req.body as { orders: { id: string; position: number }[] };

    await prisma.$transaction(
      orders.map(({ id, position }) =>
        prisma.letter.update({ where: { id }, data: { position } })
      )
    );

    broadcast({ type: 'LETTER_REORDERED', payload: { orders } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reorder letters' });
  }
});

export default router;
