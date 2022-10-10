// src/app.js
import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import { getDatabase } from './lib/database.js';

const app = express();
app.use(bodyParser.json());

app.get('/api/textures', async (req, res) => {
  const db = await getDatabase();
  res.json(await db.getTextures());
});

app.get('/api/settings', async (req, res) => {
  const db = await getDatabase();
  const settings = await db.getSettings(['base_url']);
  res.json(settings);
});

if (process.env.NODE_ENV === 'production') {
  // Compute the build path and index.html path
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const buildPath = path.resolve(__dirname, '../../front/build');
  const indexHtml = path.join(buildPath, 'index.html');

  // Setup build path as a static assets path
  app.use(express.static(buildPath));
  // Serve index.html on unmatched routes
  app.get('*', (req, res) => res.sendFile(indexHtml));
}

const port = process.env.PORT || 5000;
app.listen(port, (err) => {
  if (err) {
    console.error(`ERROR: ${err.message}`);
  } else {
    console.log(`Listening on port ${port}`);
  }
});