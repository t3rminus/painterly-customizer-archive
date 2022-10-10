import pg from 'pg';
import { createSortArray } from './misc.js';
const { Pool } = pg;

const QUERY_CREATE_SETTINGS = `
  CREATE TABLE IF NOT EXISTS "settings" (
    "key" text,
    "value" text,
    PRIMARY KEY ("key")
  );
`;

const QUERY_CREATE_OPTIONS = `
  CREATE TABLE IF NOT EXISTS "painterly_options" (
    "id" text NOT NULL,
    "group" text NOT NULL,
    "category" text NOT NULL,
    "texture" text NOT NULL,
    "name" text NOT NULL,
    "choice" text,
    "author" text NOT NULL,
    "date" date NOT NULL,
    "preview" text,
    "path" text NOT NULL,
    "tags" text[],
    "collections" text[],
    "telethon" boolean DEFAULT false NOT NULL,
    "edits" jsonb,
    "output" jsonb,
    PRIMARY KEY (id)
  );
`;

const QUERY_INSERT_OPTION = `
  INSERT INTO "painterly_options" (
    "id", "group", "category", "texture", "name", "choice",
    "author", "date", "preview", "path", "tags", "collections",
    "telethon", "edits", "output"
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
`;

const VERSION = 1;

export default class Database {
  constructor() {
    this.client = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DYNO ? { rejectUnauthorized: false } : ''
    });
  }

  async initialize(baseUrl) {
    await this.client.query(QUERY_CREATE_SETTINGS);
    await this.client.query(QUERY_CREATE_OPTIONS);
  }

  async setSetting(key, val) {
    await this.client.query(`
      INSERT INTO "settings" ("key", "value")
      VALUES ($1, $2)
      ON CONFLICT ("key")
      DO UPDATE SET "value" = $2`, [key, val]);
  }

  async getSetting(key, defaultVal) {
    const result = await this.client.query(`SELECT "value" FROM "settings" WHERE "key" = $1`, [key]);
    if(result.rows[0]) {
      return result.rows[0].value;
    }
    return defaultVal;
  }

  async getSettings(keys, defaultVals) {
    const result = await this.client.query(`SELECT "key", "value" FROM "settings" WHERE "key" = ANY($1::text[])`, [keys]);
    return keys.reduce((arr, key, idx) => {
      const foundResult = result.rows.find(r => r.key === key);
      if(foundResult) {
        arr[key] = foundResult.value;
      } else if(defaultVals && defaultVals.length && defaultVals[idx]) {
        arr[key] = defaultVals[idx];
      } else if(defaultVals && defaultVals.length) {
        arr[key] = defaultVals[defaultVals.length - 1];
      } else {
        arr[key] = defaultVals;
      }
      return arr;
    }, {});
  }

  insertOption(option) {
    return this.client.query(QUERY_INSERT_OPTION, [
      option.id, option.group, option.category, option.texture, option.name, option.choice,
      option.author, option.date, option.preview, option.path, option.tags, option.collections,
      option.telethon || false, option.edits, option.output
    ]);
  }

  async getTextures() {
    const sortGroups = createSortArray(await this.getSetting('sortGroups', 'blocks,misc'));
    const sortCategories = createSortArray(await this.getSetting('sortCategories', ''));
    const sortTextures = createSortArray(await this.getSetting('sortTextures', ''));

    const { rows } = await this.client.query(`SELECT "id", "group", "category", "texture", "name", "choice", "author", "date", "preview", "tags", "collections", "telethon", "edits" FROM "painterly_options"`);
    const result = {};
    rows.forEach((row) => {
      if(result[row.group] && result[row.group][row.category] && result[row.group][row.category][row.texture]) {
        result[row.group][row.category][row.texture].options[row.id] = {
          id: row.id, name: row.name, choice: row.choice, author: row.author, date: row.date, preview: row.preview,
          tags: row.tags, collection: row.collection, telethon: row.telethon, edits: row.edits
        };
      } else if(result[row.group] && result[row.group][row.category]) {
        result[row.group][row.category][row.texture] = {
          options: {
            [row.id]: {
              id: row.id, name: row.name, choice: row.choice, author: row.author, date: row.date, preview: row.preview,
              tags: row.tags, collection: row.collection, telethon: row.telethon, edits: row.edits
            }
          }
        };
      } else if(result[row.group]) {
        result[row.group][row.category] = {
          [row.texture]: {
            options: {
              [row.id]: {
                id: row.id, name: row.name, choice: row.choice, author: row.author, date: row.date, preview: row.preview,
                tags: row.tags, collection: row.collection, telethon: row.telethon, edits: row.edits
              }
            }
          }
        };
      } else {
        result[row.group] = {
          [row.category]: {
            [row.texture]: {
              options: {
                [row.id]: {
                  id: row.id, name: row.name, choice: row.choice, author: row.author, date: row.date, preview: row.preview,
                  tags: row.tags, collection: row.collection, telethon: row.telethon, edits: row.edits
                }
              }
            }
          }
        };
      }
    });

    const finalResult = [];
    for(const group of Object.keys(result)) {
      const curGroup = {
        name: group,
        categories: []
      };
      for(const category of Object.keys(result[group])) {
        const curCategory = {
          name: category,
          textures: []
        };
        for(const texture of Object.keys(result[group][category])) {
          const curTexture = {
            name: texture,
            options: Object.values(result[group][category][texture].options)
          };
          curCategory.textures.push(curTexture);
        }
        curCategory.textures.sort((a, b) =>
          (sortTextures[a.name] || 0) - (sortTextures[b.name] || 0)
        );
        curGroup.categories.push(curCategory);
      }
      curGroup.categories.sort((a, b) =>
        (sortCategories[a.name] || 0) - (sortCategories[b.name] || 0)
      );
      finalResult.push(curGroup);
    }
    finalResult.sort((a, b) => (sortGroups[a.name] || 0) - (sortGroups[b.name] || 0));

    return finalResult;
  }

  end() {
    return this.client.end();
  }
}

let databaseCache;
export const getDatabase = async () => {
  if(!databaseCache) {
    databaseCache = new Database();
    await databaseCache.initialize();
  }

  return databaseCache;
}