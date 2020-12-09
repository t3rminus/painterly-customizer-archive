import path from 'path';
import express from 'express';
import exphbs from 'express-handlebars';
import { getConfig, updateGit } from './lib/misc.js';
import { updateOptions, getOptions } from './lib/db.js';
import { buildPack } from './lib/pack.js';

const app = express();

app.use(express.urlencoded());

app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.get('/update', async (req, res) => {
  await updateGit();
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

app.listen(process.env.port || 3000);