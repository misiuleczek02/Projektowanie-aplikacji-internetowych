import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import {
  createCheckinSchema,
  createHabitSchema,
  updateHabitSchema,
} from '../schemas/habit';

export const habitsRouter = Router();

habitsRouter.use(requireAuth);

habitsRouter.get('/', async (req, res, next) => {
  try {
    const habits = await prisma.habit.findMany({
      where: { userId: req.user!.userId },
      include: { category: true, checkins: { orderBy: { date: 'desc' }, take: 30 } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(habits);
  } catch (e) {
    next(e);
  }
});

habitsRouter.post('/', async (req, res, next) => {
  try {
    const data = createHabitSchema.parse(req.body);
    const habit = await prisma.habit.create({
      data: { ...data, userId: req.user!.userId },
      include: { category: true },
    });
    res.status(201).json(habit);
  } catch (e) {
    next(e);
  }
});

habitsRouter.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = updateHabitSchema.parse(req.body);
    const existing = await prisma.habit.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono nawyku' });
    const updated = await prisma.habit.update({
      where: { id },
      data,
      include: { category: true },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

habitsRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.habit.findFirst({
      where: { id, userId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ error: 'Nie znaleziono nawyku' });
    await prisma.habit.delete({ where: { id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// Odznaczenie wykonania nawyku w danym dniu (domyślnie dzisiaj)
habitsRouter.post('/:id/checkins', async (req, res, next) => {
  try {
    const habitId = Number(req.params.id);
    const { date } = createCheckinSchema.parse(req.body ?? {});
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: req.user!.userId },
    });
    if (!habit) return res.status(404).json({ error: 'Nie znaleziono nawyku' });

    const day = date ? new Date(date) : new Date();
    day.setUTCHours(0, 0, 0, 0);

    const checkin = await prisma.checkin.upsert({
      where: { habitId_date: { habitId, date: day } },
      update: {},
      create: { habitId, date: day },
    });
    res.status(201).json(checkin);
  } catch (e) {
    next(e);
  }
});

// Cofnięcie odznaczenia
habitsRouter.delete('/:id/checkins/:date', async (req, res, next) => {
  try {
    const habitId = Number(req.params.id);
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId: req.user!.userId },
    });
    if (!habit) return res.status(404).json({ error: 'Nie znaleziono nawyku' });

    const day = new Date(req.params.date);
    day.setUTCHours(0, 0, 0, 0);

    await prisma.checkin.deleteMany({ where: { habitId, date: day } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
