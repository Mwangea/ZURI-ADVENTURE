import { createApp } from './app.js';

const PORT = Number(process.env.PORT ?? 3001);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const app = createApp();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] running on http://localhost:${PORT} (env: ${NODE_ENV})`);
});

