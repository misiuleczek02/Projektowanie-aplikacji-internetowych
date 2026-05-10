import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { habitsRouter } from './routes/habits';
import { categoriesRouter } from './routes/categories';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRouter);
app.use('/habits', habitsRouter);
app.use('/categories', categoriesRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API słucha na http://localhost:${PORT}`);
});
