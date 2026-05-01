import express from 'express';
import cors from 'cors';
import http from 'http';
import { initWebSocketServer } from './services/websocket';
import lettersRouter from './routes/letters';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/letters', lettersRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});
