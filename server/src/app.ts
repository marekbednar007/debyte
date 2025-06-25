import express, { ErrorRequestHandler, Request, Response } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { ServerError } from './types/types';
import debateRoutes from './routes/debateRoutes';

const app = express();

// CORS setup
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'your-frontend-domain.com'
        : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' })); // Increase limit for large debate content
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('assets'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'), {
    headers: { 'Content-Type': 'text/html' },
  });
});

app.get('/ping', (_req: Request, res: Response) => res.send('pong'));

// API Routes
app.use('/api', debateRoutes);

// --- Eror Handler ----------------------------------------------
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// --- Global error handler --------------------------------------
const errorHandler: ErrorRequestHandler = (
  err: ServerError,
  _req,
  res,
  _next
) => {
  const defaultError: ServerError = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj: ServerError = { ...defaultError, ...err };
  console.log(errorObj.log);
  res.status(errorObj.status).json(errorObj.message);
};
app.use(errorHandler);

export default app;
