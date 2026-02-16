import 'dotenv/config';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;

async function start() {
  const { server, context } = await createApp();

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(PORT) },
    context,
  });

  console.log(`Server running at ${url}`);
}

start();
