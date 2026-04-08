import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { rateLimiter, securityHeaders } from './middleware/security';

dotenv.config();

const app = express();
app.use(express.json());
app.use(securityHeaders);
app.use(rateLimiter);

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'auth service is running' });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;