import { createApp } from './app';

const port = Number(process.env.API_PORT ?? 7034);
const host = process.env.API_HOST ?? '0.0.0.0';

const app = createApp();

app.listen(port, host, () => {
  console.log(`CF Calculation API listening on http://${host}:${port}`);
});
