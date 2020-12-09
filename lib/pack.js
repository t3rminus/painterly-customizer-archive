import path from 'path';
import fs from 'fs-extra';
import archiver from 'archiver';
import sharp from 'sharp';
import { getConfig, fileExists } from './misc.js';
import db, { safeKeys } from './db.js';

const composeImage = (curImage, newImage) => {
  if(!curImage) {
    return sharp(newImage);
  }

  return curImage.composite([{ input: newImage }]);
}

const blankImage = (size) => {
  return sharp({ create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0.0 }
  } })
}

export const buildPack = async (description, textures, res) => {
  const { localDir } = await getConfig();

  const tmpOut = await fs.mkdtemp('painterly-');
  await fs.writeJson(path.resolve(path.join(tmpOut, 'pack.mcmeta')), { pack: { pack_format: 7, description }});
  const items = await db.find({ id: { $in: Object.values(textures) }});
  for(const item of items) {
    const output = safeKeys(item.output, false);
    const files = Object.keys(output);
    let composed = [];
    for(const file of files) {
      const srcDir = path.resolve(path.join(localDir, item.path));
      if(!Array.isArray(output[file])) {
        output[file] = [output[file]];
      }
      if(Array.isArray(output[file]) && output[file].length === 1) {
        if(output[file][0] === '_blank') {
          const outPath = path.resolve(path.join(tmpOut, file));
          blankImage(16).toFile(outPath);
          continue;
        } else {
          const outPath = path.resolve(path.join(tmpOut, file));
          await fs.ensureDir(path.dirname(outPath));
          await fs.copyFile(path.resolve(srcDir, output[file][0]), outPath);
        }
      } else {
        composed.push(file);
      }
    }

    for(const file of composed) {
      const outPath = path.resolve(path.join(tmpOut, file));
      const srcDir = path.resolve(path.join(localDir, item.path));
      await fs.ensureDir(path.dirname(outPath));

      let image;
      for(const input of output[file]) {
        if(/^@/.test(input)) {
          const realInput = path.resolve(path.join(tmpOut, input.replace('@','')));
          if(await fileExists(realInput)) {
            image = composeImage(image, realInput);
          }
        } else if(input !== '_blank') {
          const realInput = path.resolve(path.join(srcDir, input));
          if(await fileExists(realInput)) {
            image = composeImage(image, realInput);
          }
        }
      }

      await image.toFile(outPath);
    }
  }
  const archive = archiver('zip');
  archive.directory(tmpOut, false);
  res.setHeader('Content-Disposition', `attachment; filename="${path.basename(tmpOut)}.zip"`);
  res.on('close', () => { fs.remove(tmpOut) });
  archive.pipe(res);
  archive.finalize();
};