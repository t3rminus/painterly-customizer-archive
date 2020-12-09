import Git from 'nodegit';
import path from 'path';
import fs from 'fs-extra';

export const getConfig = () => {
  return fs.readJson('config.json');
}

export const fileExists = async (file) => {
  try {
    await fs.stat(file);
    return true;
  } catch(err) {
    return false;
  }
}

export const updateGit = async () => {
  const config = await getConfig();

  if(await fileExists(config.localDir)) {
    await fs.remove(config.localDir);
  }
  await Git.Clone(config.git, config.localDir);
}