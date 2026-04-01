import express from 'express';
import cors from 'cors';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes will be mounted here in subsequent steps
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Global error handler — must be last
app.use(errorHandler);

export default app;
