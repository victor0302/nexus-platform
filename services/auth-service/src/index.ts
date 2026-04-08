import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'auth service is running' });
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;