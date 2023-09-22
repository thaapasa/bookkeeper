import path from 'path';
import sharp from 'sharp';

import { FileUploadResult, safeDeleteFile, withoutExt } from 'server/server/FileHandling';

import { AssetDirectories } from './Assets';
import { FileWriteResult, writeImageToFile } from './ImageService';

export function getProfileImagePaths(filename: string) {
  const imageSmall = withoutExt(filename) + '.webp';
  const imageLarge = withoutExt(filename) + '-large.webp';
  const pathSmall = path.join(AssetDirectories.profileImage, imageSmall);
  const pathLarge = path.join(AssetDirectories.profileImage, imageLarge);
  return { imageSmall, imageLarge, pathSmall, pathLarge };
}

export async function createProfileImages(image: FileUploadResult) {
  const paths = getProfileImagePaths(image.filename);
  const writtenFiles: FileWriteResult[] = [];
  try {
    writtenFiles.push(
      await writeImageToFile(
        sharp(image.filepath)
          .trim()
          .resize({ width: 128, height: 128, fit: 'contain', background: 'transparent' })
          .webp(),
        paths.pathSmall,
        'small profile image',
      ),
    );
    writtenFiles.push(
      await writeImageToFile(
        sharp(image.filepath)
          .trim()
          .resize({ width: 512, height: 512, fit: 'contain', background: 'transparent' })
          .webp(),
        paths.pathLarge,
        'large profile image',
      ),
    );
    return paths.pathSmall;
  } catch (e) {
    // Clean up possibly created files
    await Promise.all(writtenFiles.map(f => safeDeleteFile(f.filepath)));
    throw e;
  }
}
