import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import projectsRouter from './routes/projects';
import testimonialsRouter from './routes/testimonials';
import experienceRouter from './routes/experience';
import skillsRouter from './routes/skills';
import messagesRouter from './routes/messages';
import userAuthRouter from './routes/userAuth';
import userPortfolioRouter from './routes/userPortfolio';
import publicPortfolioRouter from './routes/publicPortfolio';
import adminUsersRouter from './routes/adminUsers';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Existing admin routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/experience', experienceRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/messages', messagesRouter);

// Multi-user portfolio routes
app.use('/api/auth/user', userAuthRouter);
app.use('/api/user', userPortfolioRouter);
app.use('/api/portfolio', publicPortfolioRouter);
app.use('/api/admin', adminUsersRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on port ${env.PORT}`);
});

export default app;
