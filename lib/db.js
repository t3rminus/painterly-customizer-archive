import Datastore from 'nedb-promises';
import glob from 'glob';
import path from 'path';
import fs from 'fs-extra';
import { getConfig } from './misc.js';

const db = Datastore.create({ filename: 'customizer.db', autoload: true });
db.ensureIndex({ fieldName: 'id', unique: true });

export default db;

const safeChr = '•';
const safeReg = new RegExp(safeChr, 'g');
export const safeKeys = (obj, safe = true) => {
  const keys = Object.keys(obj);
  const newObj = {};
  keys.forEach(key => {
    if(safe) {
      newObj[key.replace(/\./g, safeChr)] = obj[key];
    } else {
      newObj[key.replace(safeReg, '.')] = obj[key];
    }
  });
  return newObj;
}

export const updateOptions = async () => {
  const config = await getConfig();
  const zepath = path.resolve(config.localDir, '**/*.json');
  const jsons = await new Promise((y,n) => glob(zepath, (err, res) => err ? n(err) : y(res)));
  await db.remove({}, { multi: true }); // Clear out DB
  for(const file of jsons) {
    try {
      const json = await fs.readJson(file);
      const fileDir = path.dirname(file.replace(path.resolve(config.localDir), ''));
      const [,group,texture] = /([^\/]+)\/([^\/]+)\/[^.\/]+\.json$/.exec(file);
      const id = `${group}/${json.category}/${texture}/${json.name}`;
      if(json.preview) {
        json.preview = `${fileDir}/${json.preview}`;
      } else {
        const firstFile = Object.values(json.output)[0].slice(-1)[0];
        json.preview = `${fileDir}/${firstFile}`;
      }
      json.output = safeKeys(json.output);
      await db.insert({ ...json, id, group, texture, path: fileDir});
    } catch(err) {
      console.log(err);
      /* ignore */
    }
  }
}

export const getOptions = async (category) => {
  const opts = {};
  if(category) {
    opts.category = category;
  }

  const options = await db.find(opts);
  const categories = options.reduce((cats, opt) => {
    if(cats[opt.category] && cats[opt.category][opt.group] && cats[opt.category][opt.group][opt.texture]) {
      cats[opt.category][opt.group][opt.texture].push(opt);
    } else if(cats[opt.category] && cats[opt.category][opt.group]) {
      cats[opt.category][opt.group][opt.texture] = [opt];
    } else if(cats[opt.category]) {
      cats[opt.category][opt.group] = {
        [opt.texture]: [opt]
      };
    } else {
      cats[opt.category] = {
        [opt.group]: {
          [opt.texture]: [opt]
        }
      };
    }

    return cats;
  }, {});
  return categories;
}