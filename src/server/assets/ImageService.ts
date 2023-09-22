import path from 'path';
import sharp from 'sharp';

import { logger } from 'server/Logger';
import { FileUploadResult, withoutExt } from 'server/server/FileHandling';

import { AssetDirectories } from './Assets';

export async function createProfileImages(image: FileUploadResult) {
  const imageSmall = withoutExt(image.filename) + '.webp';
  const imageLarge = withoutExt(image.filename) + '-large.webp';
  await writeImage(
    sharp(image.filepath)
      .trim()
      .resize({ width: 128, height: 128, fit: 'contain', background: 'transparent' })
      .webp(),
    AssetDirectories.profileImage,
    imageSmall,
    'small profile image',
  );
  await writeImage(
    sharp(image.filepath)
      .trim()
      .resize({ width: 512, height: 512, fit: 'contain', background: 'transparent' })
      .webp(),
    AssetDirectories.profileImage,
    imageLarge,
    'large profile image',
  );
}

async function writeImage(image: sharp.Sharp, targetDir: string, filename: string, title: string) {
  const fullpath = path.join(targetDir, filename);
  const res = await image.toFile(fullpath);
  logger.info(`Wrote ${title} to ${fullpath}: ${res.size} bytes`);
}
