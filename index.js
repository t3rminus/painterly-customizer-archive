import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';
import helpers from 'handlebars-helpers';
import { getConfig, updateGit } from './lib/misc.js';
import { updateOptions, getOptions } from './lib/db.js';
import { buildPack } from './lib/pack.js';

const app = express();

app.use(express.urlencoded());

app.engine('.hbs', exphbs({
  extname: '.hbs',
  helpers: helpers()
}));
app.set('view engine', '.hbs');

app.get('/update', async (req, res) => {
  if(!process.env.NO_PULL) {
    await updateGit();
  }
  await updateOptions();
  res.redirect('/');
});

app.get('/', async (req, res) => {
  const options = await getOptions();
  res.render('home', { options });
});

app.post('/', async (req, res) => {
  buildPack(req.body.description, req.body.textures, res);
});

app.get(/git.+\.png$/, async (req, res) => {
  const { localDir } = await getConfig();
  res.sendFile(req.url.replace(/^\/git/, ''), { root: path.resolve(localDir) });
});

app.use(express.static('./static'));

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.info(`Started server on port ${port}`);
  if(!process.env.NO_PULL) {
    await updateGit();
  }
  await updateOptions();
  console.info(`Updated info from GitHub`);
});