import 'dotenv/config';
import { buildApp } from './app.js';
import { logger } from './infrastructure/logger.js';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const HOST = process.env['HOST'] ?? '0.0.0.0';

async function main(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    logger.info(`StormWatch BH API running on http://${HOST}:${PORT}`);
    logger.info(`Swagger docs: http://localhost:${PORT}/docs`);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

void main();
