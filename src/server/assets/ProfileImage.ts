import crypto from 'crypto';
import path, { basename } from 'path';
import sharp from 'sharp';

import { FileUploadResult, safeDeleteFile, withoutExt } from 'server/server/FileHandling';

import { AssetDirectories } from './Assets';
import { FileWriteResult, writeImageToFile } from './ImageService';

const ProfileImageSizeSmall = 128;
const ProfileImageSizeLarge = 512;

export function getProfileImagePaths(filename: string) {
  const basefile = withoutExt(basename(filename));
  const imageSmall = basefile + '.webp';
  const imageLarge = basefile + '-large.webp';
  const pathSmall = path.join(AssetDirectories.profileImage, imageSmall);
  const pathLarge = path.join(AssetDirectories.profileImage, imageLarge);
  return { imageSmall, imageLarge, pathSmall, pathLarge };
}

export function profileImagePath(
  imagePath: string | undefined,
  email: string | undefined,
  variant: 'small' | 'large',
): string | undefined {
  if (imagePath) {
    return `assets/img/profile/${imagePath}`;
  }
  if (email) {
    const size = variant === 'large' ? ProfileImageSizeLarge : ProfileImageSizeSmall;
    return `${getGravatarUrl(email)}&s=${size}`;
  }
  return undefined;
}

export function getGravatarUrl(email: string): string {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=wavatar`;
}

export async function createProfileImages(image: FileUploadResult) {
  const paths = getProfileImagePaths(image.filename);
  const writtenFiles: FileWriteResult[] = [];
  try {
    writtenFiles.push(
      await writeImageToFile(
        sharp(image.filepath)
          .trim()
          .resize({
            width: ProfileImageSizeSmall,
            height: ProfileImageSizeSmall,
            fit: 'contain',
            background: 'transparent',
          })
          .webp(),
        paths.pathSmall,
        'small profile image',
      ),
    );
    writtenFiles.push(
      await writeImageToFile(
        sharp(image.filepath)
          .trim()
          .resize({
            width: ProfileImageSizeLarge,
            height: ProfileImageSizeLarge,
            fit: 'contain',
            background: 'transparent',
          })
          .webp(),
        paths.pathLarge,
        'large profile image',
      ),
    );
    return paths.imageSmall;
  } catch (e) {
    // Clean up possibly created files
    await Promise.all(writtenFiles.map(f => safeDeleteFile(f.filepath)));
    throw e;
  }
}
